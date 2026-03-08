import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Download, Upload, FolderOpen, HardDrive, Cloud, CheckCircle, AlertCircle, FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useProjectData } from '@/context/ProjectDataContext';
import * as XLSX from '@e965/xlsx';
import JSZip from 'jszip';

const TABLE_LABELS: Record<string, string> = {
  activities: 'Activities',
  boqItems: 'BOQ Items',
  inventory: 'Inventory',
  equipment: 'Equipment',
  safety: 'Safety Incidents',
  delays: 'Delays',
  purchaseOrders: 'Purchase Orders',
  manpower: 'Manpower',
  fuelLog: 'Fuel Log',
  concretePours: 'Concrete Pours',
  dailyQty: 'Daily Quantity',
};

export default function BackupRestore() {
  const data = useProjectData();
  const [restoring, setRestoring] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(() => localStorage.getItem('buildforge_last_backup'));
  const fileRef = useRef<HTMLInputElement>(null);

  const getAllData = () => ({
    activities: data.activities,
    boqItems: data.boqItems,
    inventory: data.inventory,
    equipment: data.equipment,
    safety: data.safety,
    delays: data.delays,
    purchaseOrders: data.purchaseOrders,
    manpower: data.manpower,
    fuelLog: data.fuelLog,
    concretePours: data.concretePours,
    dailyQty: data.dailyQty,
  });

  const downloadBackup = async () => {
    try {
      const allData = getAllData();
      const zip = new JSZip();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      // JSON backup
      zip.file(`buildforge-backup-${timestamp}.json`, JSON.stringify(allData, null, 2));

      // Excel backup
      const wb = XLSX.utils.book_new();
      for (const [key, rows] of Object.entries(allData)) {
        if (rows.length > 0) {
          const ws = XLSX.utils.json_to_sheet(rows);
          XLSX.utils.book_append_sheet(wb, ws, TABLE_LABELS[key] || key);
        }
      }
      const excelBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file(`buildforge-backup-${timestamp}.xlsx`, excelBuf);

      // Try File System Access API for folder selection
      if ('showDirectoryPicker' in window) {
        try {
          const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const fileHandle = await dirHandle.getFileHandle(`BuildForge-Backup-${timestamp}.zip`, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(zipBlob);
          await writable.close();

          const now = new Date().toLocaleString();
          localStorage.setItem('buildforge_last_backup', now);
          setLastBackup(now);
          toast({ title: 'Backup Saved', description: `Saved to selected folder as BuildForge-Backup-${timestamp}.zip` });
          return;
        } catch (e: any) {
          if (e.name === 'AbortError') return; // user cancelled
          // fallback to download
        }
      }

      // Fallback: regular download
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BuildForge-Backup-${timestamp}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      const now = new Date().toLocaleString();
      localStorage.setItem('buildforge_last_backup', now);
      setLastBackup(now);
      toast({ title: 'Backup Downloaded', description: 'ZIP file with Excel + JSON saved to your Downloads folder' });
    } catch (err) {
      toast({ title: 'Backup Failed', description: String(err), variant: 'destructive' });
    }
  };

  const handleRestore = async (file: File) => {
    setRestoring(true);
    try {
      let jsonData: any;

      if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        const jsonFile = Object.keys(zip.files).find(f => f.endsWith('.json'));
        if (!jsonFile) throw new Error('No JSON backup found in ZIP');
        const content = await zip.files[jsonFile].async('string');
        jsonData = JSON.parse(content);
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        jsonData = JSON.parse(text);
      } else {
        throw new Error('Please select a .zip or .json backup file');
      }

      // Restore each table
      const ops: Record<string, any> = {
        activities: data.activitiesOps,
        boqItems: data.boqOps,
        inventory: data.inventoryOps,
        equipment: data.equipmentOps,
        safety: data.safetyOps,
        delays: data.delaysOps,
        purchaseOrders: data.poOps,
        manpower: data.manpowerOps,
        fuelLog: data.fuelOps,
        concretePours: data.concreteOps,
        dailyQty: data.dailyQtyOps,
      };

      let restoredCount = 0;
      for (const [key, op] of Object.entries(ops)) {
        if (jsonData[key] && Array.isArray(jsonData[key])) {
          op.setAll(jsonData[key]);
          restoredCount += jsonData[key].length;
        }
      }

      toast({ title: 'Restore Complete', description: `${restoredCount} records restored across all modules` });
    } catch (err) {
      toast({ title: 'Restore Failed', description: String(err), variant: 'destructive' });
    } finally {
      setRestoring(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const totalRecords = Object.values(getAllData()).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border shadow-sm p-5 flex items-start gap-3">
          <Cloud size={20} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Cloud Backup</p>
            <p className="text-xs text-muted-foreground mt-0.5">Active — all data syncs automatically to cloud</p>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-green-600">
              <CheckCircle size={12} /> Connected
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-5 flex items-start gap-3">
          <HardDrive size={20} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Local Backup</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lastBackup ? `Last backup: ${lastBackup}` : 'No local backup yet'}
            </p>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              {lastBackup ? <CheckCircle size={12} className="text-green-600" /> : <AlertCircle size={12} className="text-amber-500" />}
              {lastBackup ? 'Backed up' : 'Not backed up'}
            </div>
          </div>
        </div>
      </div>

      {/* Download Backup */}
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <h3 className="text-sm font-semibold mb-1">Download Full Backup</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Export all project data ({totalRecords} records) as a ZIP containing both Excel and JSON files.
          {('showDirectoryPicker' in window) && ' You can choose a folder on your computer to save to.'}
        </p>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <FileSpreadsheet size={14} /> Excel (.xlsx)
          </div>
          <span className="text-xs text-muted-foreground">+</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <FileJson size={14} /> JSON
          </div>
          <span className="text-xs text-muted-foreground">→</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <FolderOpen size={14} /> ZIP archive
          </div>
        </div>

        <Button onClick={downloadBackup}>
          <Download size={14} className="mr-1.5" />
          {('showDirectoryPicker' in window) ? 'Choose Folder & Save Backup' : 'Download Backup ZIP'}
        </Button>
      </div>

      {/* Restore */}
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <h3 className="text-sm font-semibold mb-1">Restore from Backup</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Upload a previously downloaded backup file (.zip or .json) to restore all data. This will replace current data.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".zip,.json"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleRestore(e.target.files[0])}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={restoring}>
          <Upload size={14} className="mr-1.5" />
          {restoring ? 'Restoring...' : 'Select Backup File'}
        </Button>
      </div>

      {/* Data summary */}
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <h3 className="text-sm font-semibold mb-3">Current Data Summary</h3>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(getAllData()).map(([key, arr]) => (
            <div key={key} className="flex justify-between items-center px-3 py-2 bg-muted/30 rounded-md">
              <span className="text-xs text-muted-foreground">{TABLE_LABELS[key]}</span>
              <span className="text-xs font-semibold">{arr.length}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
