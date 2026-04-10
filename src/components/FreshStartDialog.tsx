import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Database, Trash2, Download } from 'lucide-react';
import { useProjectData } from '@/context/ProjectDataContext';
import { toast } from '@/hooks/use-toast';

interface FreshStartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FreshStartDialog({ open, onOpenChange }: FreshStartDialogProps) {
  const [step, setStep] = useState<'backup-reminder' | 'confirm'>('backup-reminder');
  const [clearing, setClearing] = useState(false);
  const {
    activitiesOps, boqOps, inventoryOps, equipmentOps, safetyOps, delaysOps,
    poOps, manpowerOps, fuelOps, concreteOps, dailyQtyOps,
  } = useProjectData();

  const handleOpen = (val: boolean) => {
    if (!val) setStep('backup-reminder');
    onOpenChange(val);
  };

  const handleBackupFirst = () => {
    // Navigate to backup page
    window.location.href = '/backup';
    handleOpen(false);
  };

  const handleSkipBackup = () => {
    setStep('confirm');
  };

  const handleFreshStart = async () => {
    setClearing(true);
    try {
      activitiesOps.clearAll();
      boqOps.clearAll();
      inventoryOps.clearAll();
      equipmentOps.clearAll();
      safetyOps.clearAll();
      delaysOps.clearAll();
      poOps.clearAll();
      manpowerOps.clearAll();
      fuelOps.clearAll();
      concreteOps.clearAll();
      dailyQtyOps.clearAll();

      // Clear local caches and IndexedDB
      localStorage.removeItem('buildforge_offline_cache');
      localStorage.removeItem('buildforge_project_data');
      try {
        const { offlineClearAll } = await import('@/lib/offlineStorage');
        await offlineClearAll();
      } catch {}

      toast({
        title: '🧹 Fresh Start Complete',
        description: 'All data has been cleared. You can now start adding new data.',
      });
      handleOpen(false);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to clear data. Please try again.', variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        {step === 'backup-reminder' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database size={20} className="text-primary" />
                Backup Reminder
              </DialogTitle>
              <DialogDescription>
                You are about to clear all project data. Would you like to create a backup first?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Recommended: Backup your data</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      A fresh start will permanently delete all activities, BOQ items, inventory, equipment logs, 
                      manpower records, safety incidents, purchase orders, and all other module data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => handleOpen(false)} className="flex-1">Cancel</Button>
              <Button variant="outline" onClick={handleBackupFirst} className="flex-1">
                <Download size={14} className="mr-1.5" /> Backup First
              </Button>
              <Button variant="destructive" onClick={handleSkipBackup} className="flex-1">
                Skip Backup
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 size={20} />
                Confirm Fresh Start
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. All data across all modules will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <p className="text-sm font-medium text-destructive">The following will be deleted:</p>
                <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>All activities & schedules</li>
                  <li>All BOQ items & quantities</li>
                  <li>All inventory records</li>
                  <li>All equipment & fuel logs</li>
                  <li>All manpower entries</li>
                  <li>All safety incidents</li>
                  <li>All purchase orders & bills</li>
                  <li>All concrete, welding & quality logs</li>
                  <li>All daily quantity records</li>
                </ul>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setStep('backup-reminder')} className="flex-1">Go Back</Button>
              <Button variant="destructive" onClick={handleFreshStart} disabled={clearing} className="flex-1">
                {clearing ? 'Clearing...' : '🧹 Clear Everything & Start Fresh'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
