import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Activity, BOQItem, InventoryItem, EquipmentEntry, SafetyIncident, DelayEntry, PurchaseOrder } from '@/types/construction';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { offlineGet, offlineSet, offlineClearAll, isOnline, addToSyncQueue, onConnectivityChange, getSyncQueue, clearSyncQueue } from '@/lib/offlineStorage';

const CACHE_KEY = 'buildforge_offline_cache';
const STORAGE_KEY = 'buildforge_project_data';

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
    if (k === 'project_id') continue;
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
  cloudSync?: { tableName: string; key: string; userId: string; projectId: string | null },
  approvalMode?: { enabled: boolean; userId: string; projectId: string | null; tableName: string; key: string }
) {
  const pushHistory = () => setHistory(prev => [...prev.slice(-20), data]);

  const syncToCloud = async (newData: T[]) => {
    if (!cloudSync) return;
    const { tableName, key, userId, projectId } = cloudSync;

    // Save to IndexedDB always
    const cacheKey = `${projectId || 'default'}_${key}`;
    offlineSet(cacheKey, newData).catch(() => {});

    if (!isOnline()) {
      // Queue for later sync
      addToSyncQueue({ tableName, key, data: newData.map(item => toSnakeCase(key, item, userId, projectId)), userId, projectId });
      return;
    }

    let deleteQuery = (supabase as any).from(tableName).delete().eq('user_id', userId);
    if (projectId) deleteQuery = deleteQuery.eq('project_id', projectId);
    await deleteQuery;
    if (newData.length > 0) {
      const rows = newData.map(item => toSnakeCase(key, item, userId, projectId));
      await (supabase as any).from(tableName).insert(rows);
    }
  };

  const submitForApproval = async (operation: 'insert' | 'update' | 'delete', item: T) => {
    if (!approvalMode || !approvalMode.projectId) return false;
    const snakeData = toSnakeCase(approvalMode.key, item, approvalMode.userId, approvalMode.projectId);
    await (supabase as any).from('data_changes').insert({
      project_id: approvalMode.projectId,
      user_id: approvalMode.userId,
      table_name: approvalMode.tableName,
      record_id: item.id || crypto.randomUUID(),
      operation,
      data: snakeData,
      status: 'pending',
    });

    const { data: admins } = await (supabase as any)
      .from('project_members')
      .select('user_id')
      .eq('project_id', approvalMode.projectId)
      .eq('status', 'approved')
      .in('role', ['admin', 'co_admin']);

    if (admins && admins.length > 0) {
      const tableFriendly = approvalMode.tableName.replace(/_/g, ' ');
      const notifications = admins.map((a: any) => ({
        user_id: a.user_id,
        project_id: approvalMode.projectId,
        title: `📝 New ${operation} pending approval`,
        message: `A team member submitted a ${operation} on ${tableFriendly}. Review it in the Dashboard approval queue.`,
        type: 'approval',
      }));
      await (supabase as any).from('notifications').insert(notifications);
    }

    toast({ 
      title: '📋 Submitted for Approval', 
      description: `Your ${operation} has been sent to admin/co-admin for review.` 
    });
    return true;
  };

  const needsApproval = approvalMode?.enabled && approvalMode?.projectId;

  return {
    add: async (item: T) => {
      if (needsApproval) { await submitForApproval('insert', item); return; }
      pushHistory();
      setData(prev => { const next = [...prev, item]; if (cloudSync) syncToCloud(next); return next; });
    },
    update: async (item: T) => {
      if (needsApproval) { await submitForApproval('update', item); return; }
      pushHistory();
      setData(prev => { const next = prev.map(i => i.id === item.id ? item : i); if (cloudSync) syncToCloud(next); return next; });
    },
    save: async (item: T) => {
      if (needsApproval) {
        const existing = data.find(i => i.id === item.id);
        await submitForApproval(existing ? 'update' : 'insert', item);
        return;
      }
      pushHistory();
      setData(prev => {
        const idx = prev.findIndex(i => i.id === item.id);
        const next = idx >= 0 ? [...prev.slice(0, idx), item, ...prev.slice(idx + 1)] : [...prev, item];
        if (cloudSync) syncToCloud(next);
        return next;
      });
    },
    remove: async (id: string) => {
      if (needsApproval) { const item = data.find(i => i.id === id); if (item) await submitForApproval('delete', item); return; }
      pushHistory();
      setData(prev => { const next = prev.filter(i => i.id !== id); if (cloudSync) syncToCloud(next); return next; });
    },
    bulkAdd: async (items: T[]) => {
      if (needsApproval) { for (const item of items) await submitForApproval('insert', item); return; }
      pushHistory();
      setData(prev => { const next = [...prev, ...items]; if (cloudSync) syncToCloud(next); return next; });
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

// ── Hook: state with cloud persistence + IndexedDB for offline ──
function useDataState<T>(key: string, userId: string | null, projectId: string | null) {
  const [data, setData] = useState<T[]>([]);
  const [history, setHistory] = useState<T[][]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const tableName = TABLE_MAP[key];
    if (!tableName) { setLoaded(true); return; }
    const cacheKey = `${projectId || 'default'}_${key}`;

    if (userId && isOnline()) {
      setLoaded(false);
      let query = (supabase as any).from(tableName).select('*');
      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.eq('user_id', userId).is('project_id', null);
      }
      query.then(async ({ data: rows, error }: any) => {
        if (rows && !error) {
          const mapped = rows.map((r: any) => toCamelCase(key, r)) as T[];
          setData(mapped);
          // Cache to IndexedDB
          offlineSet(cacheKey, mapped).catch(() => {});
        } else {
          // Fallback to IndexedDB
          const cached = await offlineGet<T[]>(cacheKey);
          setData(cached || []);
        }
        setLoaded(true);
      });
    } else if (userId) {
      // Offline: load from IndexedDB
      offlineGet<T[]>(cacheKey).then(cached => {
        setData(cached || []);
        setLoaded(true);
      }).catch(() => { setData([]); setLoaded(true); });
    } else {
      setData([]);
      setLoaded(true);
    }
  }, [key, userId, projectId]);

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
  isOffline: boolean;
  pendingSyncCount: number;
  syncNow: () => Promise<void>;
}

const ProjectDataContext = createContext<ProjectDataContextType | null>(null);

export function ProjectDataProvider({ children }: { children: ReactNode }) {
  const { user, storageMode, setStorageMode, currentProjectId, canApprove } = useAuth();
  const userId = user?.id || null;
  const projectId = currentProjectId;
  const [offline, setOffline] = useState(!isOnline());
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Listen for connectivity changes
  useEffect(() => {
    const unsub = onConnectivityChange((online) => {
      setOffline(!online);
      if (online) {
        toast({ title: '🌐 Back Online', description: 'Syncing pending changes...' });
        syncPendingChanges();
      } else {
        toast({ title: '📴 Offline Mode', description: 'Changes will be saved locally and synced when connection returns.' });
      }
    });
    return unsub;
  }, []);

  // Check pending sync count
  useEffect(() => {
    getSyncQueue().then(q => setPendingSyncCount(q.length)).catch(() => {});
  }, [offline]);

  const syncPendingChanges = async () => {
    if (!isOnline()) return;
    const queue = await getSyncQueue();
    if (queue.length === 0) return;
    for (const item of queue) {
      try {
        let deleteQuery = (supabase as any).from(item.tableName).delete().eq('user_id', item.userId);
        if (item.projectId) deleteQuery = deleteQuery.eq('project_id', item.projectId);
        await deleteQuery;
        if (item.data.length > 0) {
          await (supabase as any).from(item.tableName).insert(item.data);
        }
      } catch (e) {
        console.error('Sync failed for', item.tableName, e);
      }
    }
    await clearSyncQueue();
    setPendingSyncCount(0);
    toast({ title: '✅ Sync Complete', description: `${queue.length} pending changes synced to server.` });
  };

  useEffect(() => {
    if (user && storageMode === null) {
      setStorageMode('cloud');
    }
  }, [user, storageMode]);

  const cloudSync = userId ? (key: string) => ({
    tableName: TABLE_MAP[key],
    key,
    userId,
    projectId,
  }) : () => undefined;

  const approvalInfo = (key: string) => {
    if (!userId || canApprove) return undefined;
    return { enabled: true, userId, projectId, tableName: TABLE_MAP[key], key };
  };

  const act = useDataState<Activity>('activities', userId, projectId);
  const boq = useDataState<BOQItem>('boqItems', userId, projectId);
  const inv = useDataState<InventoryItem>('inventory', userId, projectId);
  const eq = useDataState<EquipmentEntry>('equipment', userId, projectId);
  const saf = useDataState<SafetyIncident>('safety', userId, projectId);
  const del = useDataState<DelayEntry>('delays', userId, projectId);
  const po = useDataState<PurchaseOrder>('purchaseOrders', userId, projectId);
  const mp = useDataState<any>('manpower', userId, projectId);
  const fl = useDataState<any>('fuelLog', userId, projectId);
  const cp = useDataState<any>('concretePours', userId, projectId);
  const dq = useDataState<any>('dailyQty', userId, projectId);

  const dataLoaded = act.loaded && boq.loaded;

  const value: ProjectDataContextType = {
    activities: act.data,
    activitiesOps: createCrudOps(act.data, act.setData, act.history, act.setHistory, cloudSync('activities'), approvalInfo('activities')),
    boqItems: boq.data,
    boqOps: createCrudOps(boq.data, boq.setData, boq.history, boq.setHistory, cloudSync('boqItems'), approvalInfo('boqItems')),
    inventory: inv.data,
    inventoryOps: createCrudOps(inv.data, inv.setData, inv.history, inv.setHistory, cloudSync('inventory'), approvalInfo('inventory')),
    equipment: eq.data,
    equipmentOps: createCrudOps(eq.data, eq.setData, eq.history, eq.setHistory, cloudSync('equipment'), approvalInfo('equipment')),
    safety: saf.data,
    safetyOps: createCrudOps(saf.data, saf.setData, saf.history, saf.setHistory, cloudSync('safety'), approvalInfo('safety')),
    delays: del.data,
    delaysOps: createCrudOps(del.data, del.setData, del.history, del.setHistory, cloudSync('delays'), approvalInfo('delays')),
    purchaseOrders: po.data,
    poOps: createCrudOps(po.data, po.setData, po.history, po.setHistory, cloudSync('purchaseOrders'), approvalInfo('purchaseOrders')),
    manpower: mp.data,
    manpowerOps: createCrudOps(mp.data, mp.setData, mp.history, mp.setHistory, cloudSync('manpower'), approvalInfo('manpower')),
    fuelLog: fl.data,
    fuelOps: createCrudOps(fl.data, fl.setData, fl.history, fl.setHistory, cloudSync('fuelLog'), approvalInfo('fuelLog')),
    concretePours: cp.data,
    concreteOps: createCrudOps(cp.data, cp.setData, cp.history, cp.setHistory, cloudSync('concretePours'), approvalInfo('concretePours')),
    dailyQty: dq.data,
    dailyQtyOps: createCrudOps(dq.data, dq.setData, dq.history, dq.setHistory, cloudSync('dailyQty'), approvalInfo('dailyQty')),
    isCloudMode: true,
    dataLoaded,
    isOffline: offline,
    pendingSyncCount,
    syncNow: syncPendingChanges,
  };

  return (
    <ProjectDataContext.Provider value={value}>
      {children}
    </ProjectDataContext.Provider>
  );
}

export function useProjectData() {
  const ctx = useContext(ProjectDataContext);
  if (!ctx) throw new Error('useProjectData must be used within ProjectDataProvider');
  return ctx;
}
