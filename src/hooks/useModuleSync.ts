import { useCallback, useState } from 'react';
import { useProjectData } from '@/context/ProjectDataContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Activity, BOQItem, InventoryItem } from '@/types/construction';
import { useAuth } from '@/context/AuthContext';

interface SyncResult {
  materials: any[];
  activities: any[];
  inventoryGaps: any[];
  summary: string;
}

export function useModuleSync() {
  const projectData = useProjectData();
  const { user, currentProject } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const analyzeMaterials = useCallback(async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('boq-material-analysis', {
        body: {
          action: 'analyze-materials',
          boqItems: projectData.boqItems,
          existingInventory: projectData.inventory,
        },
      });
      if (error) throw error;
      return data?.result;
    } catch (err: any) {
      toast({ title: 'Analysis Error', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setSyncing(false);
    }
  }, [projectData.boqItems, projectData.inventory]);

  const generateActivities = useCallback(async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('boq-material-analysis', {
        body: {
          action: 'generate-activities',
          boqItems: projectData.boqItems,
          existingActivities: projectData.activities,
        },
      });
      if (error) throw error;
      return data?.result;
    } catch (err: any) {
      toast({ title: 'Generation Error', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setSyncing(false);
    }
  }, [projectData.boqItems, projectData.activities]);

  const fullSync = useCallback(async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('boq-material-analysis', {
        body: {
          action: 'sync-analysis',
          boqItems: projectData.boqItems,
          existingActivities: projectData.activities,
          existingInventory: projectData.inventory,
        },
      });
      if (error) throw error;
      const result = data?.result as SyncResult;
      setLastSyncResult(result);
      return result;
    } catch (err: any) {
      toast({ title: 'Sync Error', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setSyncing(false);
    }
  }, [projectData.boqItems, projectData.activities, projectData.inventory]);

  const applyActivities = useCallback((activities: any[]) => {
    const today = new Date();
    const newActivities: Activity[] = activities.map((a: any, idx: number) => {
      const start = new Date(today);
      start.setDate(start.getDate() + idx * 2);
      const end = new Date(start);
      end.setDate(end.getDate() + (a.durationDays || 7));
      return {
        id: crypto.randomUUID(),
        wbs: a.wbs || `${idx + 1}.0`,
        name: a.name,
        plannedStart: start.toISOString().split('T')[0],
        plannedEnd: end.toISOString().split('T')[0],
        percentComplete: 0,
        critical: false,
        predecessors: a.predecessors || '',
        status: 'not-started' as const,
      };
    });
    projectData.activitiesOps.bulkAdd(newActivities);
    toast({ title: 'Activities Created', description: `${newActivities.length} activities added from BOQ analysis` });
  }, [projectData.activitiesOps]);

  const applyMaterials = useCallback((materials: any[]) => {
    const existingCodes = new Set(projectData.inventory.map(i => i.code));
    const newItems: InventoryItem[] = materials
      .filter(m => !existingCodes.has(m.code))
      .map(m => ({
        id: crypto.randomUUID(),
        code: m.code,
        description: m.description,
        unit: m.unit,
        opening: 0,
        receipts: 0,
        issues: 0,
        balance: 0,
        minLevel: Math.ceil(m.totalWithWaste * 0.1),
        location: m.category || '',
        requiredQty: Math.ceil(m.totalWithWaste || m.requiredQty || 0),
      }));

    // Update requiredQty for existing items
    const updatedExisting = projectData.inventory.map(item => {
      const mat = materials.find(m => m.code === item.code);
      if (mat) {
        return { ...item, requiredQty: Math.ceil(mat.totalWithWaste || mat.requiredQty || 0) };
      }
      return item;
    });

    if (newItems.length > 0) {
      projectData.inventoryOps.setAll([...updatedExisting, ...newItems]);
      toast({ title: 'Inventory Updated', description: `${newItems.length} new materials added, required quantities updated` });
    } else if (updatedExisting.some((item, i) => item.requiredQty !== projectData.inventory[i]?.requiredQty)) {
      projectData.inventoryOps.setAll(updatedExisting);
      toast({ title: 'Inventory Updated', description: 'Required quantities updated from BOQ analysis' });
    } else {
      toast({ title: 'Inventory', description: 'All materials already exist in inventory' });
    }
  }, [projectData.inventory, projectData.inventoryOps]);

  return {
    syncing,
    lastSyncResult,
    analyzeMaterials,
    generateActivities,
    fullSync,
    applyActivities,
    applyMaterials,
  };
}
