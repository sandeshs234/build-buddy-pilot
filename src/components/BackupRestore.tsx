import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, FolderOpen, HardDrive, Cloud, CheckCircle, AlertCircle, FileJson, FileSpreadsheet, Files, FolderUp, File } from 'lucide-react';
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
  const singleFileRef = useRef<HTMLInputElement>(null);
  const multiFileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const getAllData = () => {
    // Include project settings from localStorage
    const settings = localStorage.getItem('buildforge-settings');
    return {
      _meta: {
        version: '1.0',
        exportDate: new Date().toISOString(),
        app: 'BuildForge',
      },
      settings: settings ? JSON.parse(settings) : {},
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
    };
  };

  const downloadBackup = async () => {
    try {
      const allData = getAllData();
      const zip = new JSZip();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      // JSON backup (full data including settings + meta)
      zip.file(`buildforge-backup-${timestamp}.json`, JSON.stringify(allData, null, 2));

      // Excel backup — each module as a sheet
      const wb = XLSX.utils.book_new();

      // Settings sheet
      if (allData.settings && Object.keys(allData.settings).length > 0) {
        const settingsRows = Object.entries(allData.settings).map(([key, value]) => ({ Field: key, Value: value }));
        const settingsWs = XLSX.utils.json_to_sheet(settingsRows);
        XLSX.utils.book_append_sheet(wb, settingsWs, 'Settings');
      }

      // Data sheets
      const dataKeys = Object.keys(TABLE_LABELS);
      for (const key of dataKeys) {
        const rows = (allData as any)[key];
        if (rows && rows.length > 0) {
          const ws = XLSX.utils.json_to_sheet(rows);
          XLSX.utils.book_append_sheet(wb, ws, TABLE_LABELS[key] || key);
        }
      }

      const excelBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file(`buildforge-backup-${timestamp}.xlsx`, excelBuf);

      // Also add individual JSON files per module for granular restore
      const moduleFolder = zip.folder('modules');
      for (const key of dataKeys) {
        const rows = (allData as any)[key];
        if (rows && rows.length > 0) {
          moduleFolder?.file(`${key}.json`, JSON.stringify(rows, null, 2));
        }
      }
      moduleFolder?.file('settings.json', JSON.stringify(allData.settings, null, 2));

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
          if (e.name === 'AbortError') return;
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
      toast({ title: 'Backup Downloaded', description: 'ZIP file with Excel + JSON + individual module files saved' });
    } catch (err) {
      toast({ title: 'Backup Failed', description: String(err), variant: 'destructive' });
    }
  };

  const getOpsMap = () => ({
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
  });

  const restoreFromJson = (jsonData: any) => {
    const ops = getOpsMap();
    let restoredCount = 0;

    // Restore settings
    if (jsonData.settings && typeof jsonData.settings === 'object' && Object.keys(jsonData.settings).length > 0) {
      localStorage.setItem('buildforge-settings', JSON.stringify(jsonData.settings));
      restoredCount++;
    }

    // Restore module data
    for (const [key, op] of Object.entries(ops)) {
      if (jsonData[key] && Array.isArray(jsonData[key])) {
        (op as any).setAll(jsonData[key]);
        restoredCount += jsonData[key].length;
      }
    }
    return restoredCount;
  };

  const restoreModuleFile = (filename: string, items: any[]) => {
    const ops = getOpsMap();
    const key = filename.replace('.json', '');

    if (key === 'settings') {
      if (typeof items === 'object') {
        localStorage.setItem('buildforge-settings', JSON.stringify(items));
        return 1;
      }
      return 0;
    }

    if (key in ops && Array.isArray(items)) {
      (ops as any)[key].setAll(items);
      return items.length;
    }
    return 0;
  };

  const processFile = async (file: File): Promise<number> => {
    if (file.name.endsWith('.zip')) {
      const zip = await JSZip.loadAsync(file);

      // Try full backup JSON first
      const fullBackup = Object.keys(zip.files).find(f => f.endsWith('.json') && !f.includes('modules/'));
      if (fullBackup) {
        const content = await zip.files[fullBackup].async('string');
        return restoreFromJson(JSON.parse(content));
      }

      // Try individual module files
      let total = 0;
      for (const [path, zipFile] of Object.entries(zip.files)) {
        if (path.startsWith('modules/') && path.endsWith('.json') && !zipFile.dir) {
          const content = await zipFile.async('string');
          const parsed = JSON.parse(content);
          const fname = path.split('/').pop() || '';
          total += restoreModuleFile(fname, parsed);
        }
      }
      return total;
    }

    if (file.name.endsWith('.json')) {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // Check if it's a full backup (has _meta or multiple known keys)
      if (parsed._meta || (parsed.activities && parsed.boqItems)) {
        return restoreFromJson(parsed);
      }

      // Single module file
      return restoreModuleFile(file.name, parsed);
    }

    return 0;
  };

  const handleRestore = async (files: FileList) => {
    setRestoring(true);
    try {
      let totalRestored = 0;
      for (let i = 0; i < files.length; i++) {
        totalRestored += await processFile(files[i]);
      }

      if (totalRestored === 0) {
        toast({ title: 'No Data Found', description: 'No valid backup data found in the selected files', variant: 'destructive' });
      } else {
        toast({ title: 'Restore Complete', description: `${totalRestored} records restored successfully` });
      }
    } catch (err) {
      toast({ title: 'Restore Failed', description: String(err), variant: 'destructive' });
    } finally {
      setRestoring(false);
      [singleFileRef, multiFileRef, folderRef].forEach(ref => {
        if (ref.current) ref.current.value = '';
      });
    }
  };

  const totalRecords = data.activities.length + data.boqItems.length + data.inventory.length +
    data.equipment.length + data.safety.length + data.delays.length + data.purchaseOrders.length +
    data.manpower.length + data.fuelLog.length + data.concretePours.length + data.dailyQty.length;

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border shadow-sm p-5 flex items-start gap-3">
          <Cloud size={20} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Cloud Backup</p>
            <p className="text-xs text-muted-foreground mt-0.5">Active — all data syncs automatically to cloud</p>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={12} /> Connected
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border shadow-sm p-5 flex items-start gap-3">
          <HardDrive size={20} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Local Backup</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lastBackup ? `Last: ${lastBackup}` : 'No local backup yet'}
            </p>
            <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
              {lastBackup
                ? <><CheckCircle size={12} className="text-emerald-600 dark:text-emerald-400" /> Backed up</>
                : <><AlertCircle size={12} className="text-destructive" /> Not backed up</>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Download Backup */}
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <h3 className="text-sm font-semibold mb-1">Download Full Backup</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Export all project data ({totalRecords} records) + settings as a ZIP containing Excel, JSON, and individual module files.
          {('showDirectoryPicker' in window) && ' You can choose a folder on your computer.'}
        </p>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <FileSpreadsheet size={14} /> Excel (.xlsx)
          </div>
          <span className="text-xs text-muted-foreground">+</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <FileJson size={14} /> Full JSON
          </div>
          <span className="text-xs text-muted-foreground">+</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <Files size={14} /> Module files
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
          Restore data from a backup file (.zip or .json). Choose single file, multiple files, or an entire folder.
        </p>

        {/* Hidden file inputs */}
        <input ref={singleFileRef} type="file" accept=".zip,.json" className="hidden"
          onChange={e => e.target.files && e.target.files.length > 0 && handleRestore(e.target.files)} />
        <input ref={multiFileRef} type="file" accept=".zip,.json" multiple className="hidden"
          onChange={e => e.target.files && e.target.files.length > 0 && handleRestore(e.target.files)} />
        <input ref={folderRef} type="file" className="hidden"
          {...({ webkitdirectory: 'true', directory: 'true' } as any)}
          onChange={e => e.target.files && e.target.files.length > 0 && handleRestore(e.target.files)} />

        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" onClick={() => singleFileRef.current?.click()} disabled={restoring}>
            <File size={14} className="mr-1.5" />
            {restoring ? 'Restoring...' : 'Single File'}
          </Button>
          <Button variant="outline" onClick={() => multiFileRef.current?.click()} disabled={restoring}>
            <Files size={14} className="mr-1.5" />
            Multiple Files
          </Button>
          <Button variant="outline" onClick={() => folderRef.current?.click()} disabled={restoring}>
            <FolderUp size={14} className="mr-1.5" />
            Upload Folder
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          <strong>Single File:</strong> Upload one .zip or .json backup &nbsp;·&nbsp;
          <strong>Multiple Files:</strong> Select several module .json files &nbsp;·&nbsp;
          <strong>Folder:</strong> Select a folder containing backup files
        </p>
      </div>

      {/* Data summary */}
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <h3 className="text-sm font-semibold mb-3">Current Data Summary</h3>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(TABLE_LABELS).map(([key, label]) => {
            const count = ((data as any)[key] || []).length;
            return (
              <div key={key} className="flex justify-between items-center px-3 py-2 bg-muted/30 rounded-md">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-semibold">{count}</span>
              </div>
            );
          })}
          <div className="flex justify-between items-center px-3 py-2 bg-primary/10 rounded-md col-span-3">
            <span className="text-xs font-medium">Total Records</span>
            <span className="text-xs font-bold">{totalRecords}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
