import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Activity, BOQItem, InventoryItem, EquipmentEntry, SafetyIncident, DelayEntry, PurchaseOrder } from '@/types/construction';
import { sampleActivities, sampleBOQ, sampleInventory, sampleEquipment, sampleSafety, sampleDelays, samplePOs } from '@/data/sampleData';
import { toast } from '@/hooks/use-toast';

const STORAGE_KEY = 'buildforge_project_data';

// Load from localStorage or use defaults
function loadState(): Record<string, any[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveState(key: string, data: any[]) {
  try {
    const current = loadState();
    current[key] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {}
}

function getInitial<T>(key: string, fallback: T[]): T[] {
  const stored = loadState();
  if (key in stored) return stored[key] as T[];
  return fallback;
}

// Generic CRUD with undo
function createCrudOps<T extends { id: string }>(
  data: T[],
  setData: React.Dispatch<React.SetStateAction<T[]>>,
  history: T[][],
  setHistory: React.Dispatch<React.SetStateAction<T[][]>>
) {
  const pushHistory = () => setHistory(prev => [...prev.slice(-20), data]);

  return {
    add: (item: T) => { pushHistory(); setData(prev => [...prev, item]); },
    update: (item: T) => { pushHistory(); setData(prev => prev.map(i => i.id === item.id ? item : i)); },
    save: (item: T) => {
      pushHistory();
      setData(prev => {
        const idx = prev.findIndex(i => i.id === item.id);
        if (idx >= 0) { const copy = [...prev]; copy[idx] = item; return copy; }
        return [...prev, item];
      });
    },
    remove: (id: string) => { pushHistory(); setData(prev => prev.filter(i => i.id !== id)); },
    bulkAdd: (items: T[]) => { pushHistory(); setData(prev => [...prev, ...items]); },
    setAll: (items: T[]) => { pushHistory(); setData(items); },
    clearAll: () => {
      if (data.length === 0) return;
      pushHistory();
      setData([]);
      toast({ title: 'Cleared', description: 'All data cleared. Use Undo to restore.' });
    },
    undo: () => {
      if (history.length === 0) return;
      setData(history[history.length - 1]);
      setHistory(prev => prev.slice(0, -1));
      toast({ title: 'Undone', description: 'Last action reverted' });
    },
    canUndo: history.length > 0,
  };
}

// Hook: persistent state with localStorage
function usePersistentState<T>(key: string, fallback: T[]) {
  const [data, setData] = useState<T[]>(() => getInitial(key, fallback));
  const [history, setHistory] = useState<T[][]>([]);

  useEffect(() => {
    saveState(key, data);
  }, [key, data]);

  return { data, setData, history, setHistory };
}

interface ProjectDataContextType {
  activities: Activity[];
  activitiesOps: ReturnType<typeof createCrudOps<Activity>>;
  boqItems: BOQItem[];
  boqOps: ReturnType<typeof createCrudOps<BOQItem>>;
  inventory: InventoryItem[];
  inventoryOps: ReturnType<typeof createCrudOps<InventoryItem>>;
  equipment: EquipmentEntry[];
  equipmentOps: ReturnType<typeof createCrudOps<EquipmentEntry>>;
  safety: SafetyIncident[];
  safetyOps: ReturnType<typeof createCrudOps<SafetyIncident>>;
  delays: DelayEntry[];
  delaysOps: ReturnType<typeof createCrudOps<DelayEntry>>;
  purchaseOrders: PurchaseOrder[];
  poOps: ReturnType<typeof createCrudOps<PurchaseOrder>>;
  manpower: any[];
  manpowerOps: ReturnType<typeof createCrudOps<any>>;
  fuelLog: any[];
  fuelOps: ReturnType<typeof createCrudOps<any>>;
  concretePours: any[];
  concreteOps: ReturnType<typeof createCrudOps<any>>;
  dailyQty: any[];
  dailyQtyOps: ReturnType<typeof createCrudOps<any>>;
}

const ProjectDataContext = createContext<ProjectDataContextType | null>(null);

export function ProjectDataProvider({ children }: { children: ReactNode }) {
  const act = usePersistentState<Activity>('activities', sampleActivities);
  const boq = usePersistentState<BOQItem>('boqItems', sampleBOQ);
  const inv = usePersistentState<InventoryItem>('inventory', sampleInventory);
  const eq = usePersistentState<EquipmentEntry>('equipment', sampleEquipment);
  const saf = usePersistentState<SafetyIncident>('safety', sampleSafety);
  const del = usePersistentState<DelayEntry>('delays', sampleDelays);
  const po = usePersistentState<PurchaseOrder>('purchaseOrders', samplePOs);
  const mp = usePersistentState<any>('manpower', []);
  const fl = usePersistentState<any>('fuelLog', []);
  const cp = usePersistentState<any>('concretePours', []);
  const dq = usePersistentState<any>('dailyQty', []);

  const value: ProjectDataContextType = {
    activities: act.data,
    activitiesOps: createCrudOps(act.data, act.setData, act.history, act.setHistory),
    boqItems: boq.data,
    boqOps: createCrudOps(boq.data, boq.setData, boq.history, boq.setHistory),
    inventory: inv.data,
    inventoryOps: createCrudOps(inv.data, inv.setData, inv.history, inv.setHistory),
    equipment: eq.data,
    equipmentOps: createCrudOps(eq.data, eq.setData, eq.history, eq.setHistory),
    safety: saf.data,
    safetyOps: createCrudOps(saf.data, saf.setData, saf.history, saf.setHistory),
    delays: del.data,
    delaysOps: createCrudOps(del.data, del.setData, del.history, del.setHistory),
    purchaseOrders: po.data,
    poOps: createCrudOps(po.data, po.setData, po.history, po.setHistory),
    manpower: mp.data,
    manpowerOps: createCrudOps(mp.data, mp.setData, mp.history, mp.setHistory),
    fuelLog: fl.data,
    fuelOps: createCrudOps(fl.data, fl.setData, fl.history, fl.setHistory),
    concretePours: cp.data,
    concreteOps: createCrudOps(cp.data, cp.setData, cp.history, cp.setHistory),
    dailyQty: dq.data,
    dailyQtyOps: createCrudOps(dq.data, dq.setData, dq.history, dq.setHistory),
  };

  return <ProjectDataContext.Provider value={value}>{children}</ProjectDataContext.Provider>;
}

export function useProjectData() {
  const ctx = useContext(ProjectDataContext);
  if (!ctx) throw new Error('useProjectData must be used within ProjectDataProvider');
  return ctx;
}
