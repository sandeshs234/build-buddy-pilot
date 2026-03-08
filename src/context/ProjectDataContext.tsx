import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Activity, BOQItem, InventoryItem, ManpowerEntry, EquipmentEntry, SafetyIncident, DelayEntry, PurchaseOrder } from '@/types/construction';
import { sampleActivities, sampleBOQ, sampleInventory, sampleManpower, sampleEquipment, sampleSafety, sampleDelays, samplePOs } from '@/data/sampleData';
import { toast } from '@/hooks/use-toast';

// Generic CRUD state with undo
function createCrudOps<T extends { id: string }>(data: T[], setData: React.Dispatch<React.SetStateAction<T[]>>, history: T[][], setHistory: React.Dispatch<React.SetStateAction<T[][]>>) {
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
  // Generic stores for other modules
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
  const [activities, setActivities] = useState<Activity[]>(sampleActivities);
  const [activitiesHistory, setActivitiesHistory] = useState<Activity[][]>([]);

  const [boqItems, setBoqItems] = useState<BOQItem[]>(sampleBOQ);
  const [boqHistory, setBoqHistory] = useState<BOQItem[][]>([]);

  const [inventory, setInventory] = useState<InventoryItem[]>(sampleInventory);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryItem[][]>([]);

  const [equipment, setEquipment] = useState<EquipmentEntry[]>(sampleEquipment);
  const [equipmentHistory, setEquipmentHistory] = useState<EquipmentEntry[][]>([]);

  const [safety, setSafety] = useState<SafetyIncident[]>(sampleSafety);
  const [safetyHistory, setSafetyHistory] = useState<SafetyIncident[][]>([]);

  const [delays, setDelays] = useState<DelayEntry[]>(sampleDelays);
  const [delaysHistory, setDelaysHistory] = useState<DelayEntry[][]>([]);

  const [purchaseOrders, setPOs] = useState<PurchaseOrder[]>(samplePOs);
  const [poHistory, setPoHistory] = useState<PurchaseOrder[][]>([]);

  const [manpower, setManpower] = useState<any[]>([]);
  const [manpowerHistory, setManpowerHistory] = useState<any[][]>([]);

  const [fuelLog, setFuelLog] = useState<any[]>([]);
  const [fuelHistory, setFuelHistory] = useState<any[][]>([]);

  const [concretePours, setConcrete] = useState<any[]>([]);
  const [concreteHistory, setConcreteHistory] = useState<any[][]>([]);

  const [dailyQty, setDailyQty] = useState<any[]>([]);
  const [dailyQtyHistory, setDailyQtyHistory] = useState<any[][]>([]);

  const value: ProjectDataContextType = {
    activities,
    activitiesOps: createCrudOps(activities, setActivities, activitiesHistory, setActivitiesHistory),
    boqItems,
    boqOps: createCrudOps(boqItems, setBoqItems, boqHistory, setBoqHistory),
    inventory,
    inventoryOps: createCrudOps(inventory, setInventory, inventoryHistory, setInventoryHistory),
    equipment,
    equipmentOps: createCrudOps(equipment, setEquipment, equipmentHistory, setEquipmentHistory),
    safety,
    safetyOps: createCrudOps(safety, setSafety, safetyHistory, setSafetyHistory),
    delays,
    delaysOps: createCrudOps(delays, setDelays, delaysHistory, setDelaysHistory),
    purchaseOrders,
    poOps: createCrudOps(purchaseOrders, setPOs, poHistory, setPoHistory),
    manpower,
    manpowerOps: createCrudOps(manpower, setManpower, manpowerHistory, setManpowerHistory),
    fuelLog,
    fuelOps: createCrudOps(fuelLog, setFuelLog, fuelHistory, setFuelHistory),
    concretePours,
    concreteOps: createCrudOps(concretePours, setConcrete, concreteHistory, setConcreteHistory),
    dailyQty,
    dailyQtyOps: createCrudOps(dailyQty, setDailyQty, dailyQtyHistory, setDailyQtyHistory),
  };

  return <ProjectDataContext.Provider value={value}>{children}</ProjectDataContext.Provider>;
}

export function useProjectData() {
  const ctx = useContext(ProjectDataContext);
  if (!ctx) throw new Error('useProjectData must be used within ProjectDataProvider');
  return ctx;
}
