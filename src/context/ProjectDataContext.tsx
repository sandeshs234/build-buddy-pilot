import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Activity, BOQItem, InventoryItem, EquipmentEntry, SafetyIncident, DelayEntry, PurchaseOrder } from '@/types/construction';
import { sampleActivities, sampleBOQ, sampleInventory, sampleEquipment, sampleSafety, sampleDelays, samplePOs } from '@/data/sampleData';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const CACHE_KEY = 'buildforge_offline_cache';
const STORAGE_KEY = 'buildforge_project_data';

// ── Local storage helpers ──
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

// ── Table name mapping ──
const TABLE_MAP: Record<string, string> = {
  activities: 'activities',
  boqItems: 'boq_items',
  inventory: 'inventory',
  equipment: 'equipment',
  safety: 'safety_incidents',
  delays: 'delays',
  purchaseOrders: 'purchase_orders',
  manpower: 'manpower',
  fuelLog: 'fuel_log',
  concretePours: 'concrete_pours',
  dailyQty: 'daily_quantity',
};

// ── Field mapping: camelCase <-> snake_case ──
const FIELD_MAPS: Record<string, Record<string, string>> = {
  activities: { plannedStart: 'planned_start', plannedEnd: 'planned_end', actualStart: 'actual_start', actualEnd: 'actual_end', percentComplete: 'percent_complete' },
  boqItems: { measureType: 'measure_type', totalQty: 'total_qty', executedQty: 'executed_qty' },
  inventory: { minLevel: 'min_level' },
  equipment: { eqId: 'eq_id', equipmentName: 'equipment_name' },
  purchaseOrders: { poNo: 'po_no', itemCode: 'item_code' },
};

function toSnakeCase(key: string, item: any, userId: string, projectId: string | null): any {
  const map = FIELD_MAPS[key] || {};
  const result: any = { user_id: userId };
  if (projectId) result.project_id = projectId;
  for (const [k, v] of Object.entries(item)) {
    if (k === 'id') {
      if (typeof v === 'string' && v.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        result.id = v;
      }
      continue;
    }
    if (k === 'project_id') continue; // already set above
    result[map[k] || k] = v;
  }
  return result;
}

function toCamelCase(key: string, row: any): any {
  const map = FIELD_MAPS[key] || {};
  const reverseMap: Record<string, string> = {};
  for (const [camel, snake] of Object.entries(map)) {
    reverseMap[snake] = camel;
  }
  const result: any = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === 'user_id' || k === 'created_at' || k === 'project_id') continue;
    result[reverseMap[k] || k] = v;
  }
  return result;
}

// ── Generic CRUD with undo ──
function createCrudOps<T extends { id: string }>(
  data: T[],
  setData: React.Dispatch<React.SetStateAction<T[]>>,
  history: T[][],
  setHistory: React.Dispatch<React.SetStateAction<T[][]>>,
  cloudSync?: { tableName: string; key: string; userId: string; projectId: string | null }
) {
  const pushHistory = () => setHistory(prev => [...prev.slice(-20), data]);

  const syncToCloud = async (newData: T[]) => {
    if (!cloudSync) return;
    const { tableName, key, userId, projectId } = cloudSync;
    // Delete scoped data then re-insert
    let deleteQuery = (supabase as any).from(tableName).delete().eq('user_id', userId);
    if (projectId) deleteQuery = deleteQuery.eq('project_id', projectId);
    await deleteQuery;
    if (newData.length > 0) {
      const rows = newData.map(item => toSnakeCase(key, item, userId, projectId));
      await (supabase as any).from(tableName).insert(rows);
    }
  };

  return {
    add: (item: T) => {
      pushHistory();
      setData(prev => {
        const next = [...prev, item];
        if (cloudSync) syncToCloud(next);
        return next;
      });
    },
    update: (item: T) => {
      pushHistory();
      setData(prev => {
        const next = prev.map(i => i.id === item.id ? item : i);
        if (cloudSync) syncToCloud(next);
        return next;
      });
    },
    save: (item: T) => {
      pushHistory();
      setData(prev => {
        const idx = prev.findIndex(i => i.id === item.id);
        const next = idx >= 0 ? [...prev.slice(0, idx), item, ...prev.slice(idx + 1)] : [...prev, item];
        if (cloudSync) syncToCloud(next);
        return next;
      });
    },
    remove: (id: string) => {
      pushHistory();
      setData(prev => {
        const next = prev.filter(i => i.id !== id);
        if (cloudSync) syncToCloud(next);
        return next;
      });
    },
    bulkAdd: (items: T[]) => {
      pushHistory();
      setData(prev => {
        const next = [...prev, ...items];
        if (cloudSync) syncToCloud(next);
        return next;
      });
    },
    setAll: (items: T[]) => {
      pushHistory();
      setData(items);
      if (cloudSync) syncToCloud(items);
    },
    clearAll: () => {
      if (data.length === 0) return;
      pushHistory();
      setData([]);
      if (cloudSync) syncToCloud([]);
      toast({ title: 'Cleared', description: 'All data cleared. Use Undo to restore.' });
    },
    undo: () => {
      if (history.length === 0) return;
      const restored = history[history.length - 1];
      setData(restored);
      setHistory(prev => prev.slice(0, -1));
      if (cloudSync) syncToCloud(restored);
      toast({ title: 'Undone', description: 'Last action reverted' });
    },
    canUndo: history.length > 0,
  };
}

// ── Hook: state with optional cloud or local persistence, scoped by project ──
function useDataState<T>(key: string, fallback: T[], isCloud: boolean, userId: string | null, projectId: string | null) {
  const [data, setData] = useState<T[]>([]);
  const [history, setHistory] = useState<T[][]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load data - re-fetch when projectId changes
  useEffect(() => {
    if (isCloud && userId) {
      const tableName = TABLE_MAP[key];
      if (!tableName) return;
      setLoaded(false);
      let query = (supabase as any).from(tableName).select('*');
      // If project is selected, filter by project_id; otherwise filter by user_id only
      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.eq('user_id', userId).is('project_id', null);
      }
      query.then(({ data: rows }: any) => {
        if (rows) {
          setData(rows.map((r: any) => toCamelCase(key, r)) as T[]);
        } else {
          setData([]);
        }
        setLoaded(true);
      });
    } else if (!isCloud) {
      setData(getInitial(key, fallback));
      setLoaded(true);
    }
  }, [key, isCloud, userId, projectId]);

  // Save to localStorage when in local mode
  useEffect(() => {
    if (!isCloud && loaded) {
      saveState(key, data);
    }
  }, [key, data, isCloud, loaded]);

  return { data, setData, history, setHistory, loaded };
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
  isCloudMode: boolean;
  dataLoaded: boolean;
}

const ProjectDataContext = createContext<ProjectDataContextType | null>(null);

export function ProjectDataProvider({ children }: { children: ReactNode }) {
  const { user, storageMode, setStorageMode, currentProjectId } = useAuth();
  const isCloud = storageMode === 'cloud';
  const userId = user?.id || null;
  const projectId = currentProjectId;
  const showChoice = !!user && storageMode === null;

  const cloudSync = isCloud && userId ? (key: string) => ({
    tableName: TABLE_MAP[key],
    key,
    userId,
    projectId,
  }) : () => undefined;

  const act = useDataState<Activity>('activities', sampleActivities, isCloud, userId, projectId);
  const boq = useDataState<BOQItem>('boqItems', sampleBOQ, isCloud, userId, projectId);
  const inv = useDataState<InventoryItem>('inventory', sampleInventory, isCloud, userId, projectId);
  const eq = useDataState<EquipmentEntry>('equipment', sampleEquipment, isCloud, userId, projectId);
  const saf = useDataState<SafetyIncident>('safety', sampleSafety, isCloud, userId, projectId);
  const del = useDataState<DelayEntry>('delays', sampleDelays, isCloud, userId, projectId);
  const po = useDataState<PurchaseOrder>('purchaseOrders', samplePOs, isCloud, userId, projectId);
  const mp = useDataState<any>('manpower', [], isCloud, userId, projectId);
  const fl = useDataState<any>('fuelLog', [], isCloud, userId, projectId);
  const cp = useDataState<any>('concretePours', [], isCloud, userId, projectId);
  const dq = useDataState<any>('dailyQty', [], isCloud, userId, projectId);

  const dataLoaded = act.loaded && boq.loaded;

  const handleStorageChoice = async (mode: 'local' | 'cloud') => {
    await setStorageMode(mode);
    if (mode === 'cloud' && userId) {
      const localData = loadState();
      for (const [key, items] of Object.entries(localData)) {
        const tableName = TABLE_MAP[key];
        if (!tableName || !items || items.length === 0) continue;
        const rows = items.map((item: any) => toSnakeCase(key, item, userId, projectId));
        await (supabase as any).from(tableName).insert(rows);
      }
      localStorage.removeItem(STORAGE_KEY);
      toast({ title: 'Data migrated to cloud', description: 'Your local data has been synced to the cloud.' });
      window.location.reload();
    }
  };

  const value: ProjectDataContextType = {
    activities: act.data,
    activitiesOps: createCrudOps(act.data, act.setData, act.history, act.setHistory, cloudSync('activities')),
    boqItems: boq.data,
    boqOps: createCrudOps(boq.data, boq.setData, boq.history, boq.setHistory, cloudSync('boqItems')),
    inventory: inv.data,
    inventoryOps: createCrudOps(inv.data, inv.setData, inv.history, inv.setHistory, cloudSync('inventory')),
    equipment: eq.data,
    equipmentOps: createCrudOps(eq.data, eq.setData, eq.history, eq.setHistory, cloudSync('equipment')),
    safety: saf.data,
    safetyOps: createCrudOps(saf.data, saf.setData, saf.history, saf.setHistory, cloudSync('safety')),
    delays: del.data,
    delaysOps: createCrudOps(del.data, del.setData, del.history, del.setHistory, cloudSync('delays')),
    purchaseOrders: po.data,
    poOps: createCrudOps(po.data, po.setData, po.history, po.setHistory, cloudSync('purchaseOrders')),
    manpower: mp.data,
    manpowerOps: createCrudOps(mp.data, mp.setData, mp.history, mp.setHistory, cloudSync('manpower')),
    fuelLog: fl.data,
    fuelOps: createCrudOps(fl.data, fl.setData, fl.history, fl.setHistory, cloudSync('fuelLog')),
    concretePours: cp.data,
    concreteOps: createCrudOps(cp.data, cp.setData, cp.history, cp.setHistory, cloudSync('concretePours')),
    dailyQty: dq.data,
    dailyQtyOps: createCrudOps(dq.data, dq.setData, dq.history, dq.setHistory, cloudSync('dailyQty')),
    isCloudMode: isCloud,
    dataLoaded,
  };

  return (
    <ProjectDataContext.Provider value={value}>
      <StorageChoiceDialog open={showChoice} onChoose={handleStorageChoice} />
      {children}
    </ProjectDataContext.Provider>
  );
}

export function useProjectData() {
  const ctx = useContext(ProjectDataContext);
  if (!ctx) throw new Error('useProjectData must be used within ProjectDataProvider');
  return ctx;
}
