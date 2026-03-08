import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Upload, FolderOpen, HardDrive, Cloud, CheckCircle, AlertCircle, FileJson, FileSpreadsheet, Files, FolderUp, File, RotateCcw, X } from 'lucide-react';
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
  const [previewData, setPreviewData] = useState<Record<string, any[] | object> | null>(null);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
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

  const restoreFromJson = (jsonData: any, allowedKeys?: Set<string>) => {
    const ops = getOpsMap();
    let restoredCount = 0;

    // Restore settings
    if ((!allowedKeys || allowedKeys.has('settings')) && jsonData.settings && typeof jsonData.settings === 'object' && Object.keys(jsonData.settings).length > 0) {
      localStorage.setItem('buildforge-settings', JSON.stringify(jsonData.settings));
      restoredCount++;
    }

    // Restore module data
    for (const [key, op] of Object.entries(ops)) {
      if (allowedKeys && !allowedKeys.has(key)) continue;
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

  // Extract available modules from backup data for preview
  const extractModules = (jsonData: any): Record<string, any[] | object> => {
    const modules: Record<string, any[] | object> = {};
    const allKeys = [...Object.keys(TABLE_LABELS), 'settings'];
    for (const key of allKeys) {
      if (jsonData[key]) {
        if (Array.isArray(jsonData[key]) && jsonData[key].length > 0) {
          modules[key] = jsonData[key];
        } else if (key === 'settings' && typeof jsonData[key] === 'object' && Object.keys(jsonData[key]).length > 0) {
          modules[key] = jsonData[key];
        }
      }
    }
    return modules;
  };

  const parseBackupForPreview = async (files: FileList) => {
    try {
      let combined: Record<string, any[] | object> = {};

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.zip')) {
          const zip = await JSZip.loadAsync(file);
          const fullBackup = Object.keys(zip.files).find(f => f.endsWith('.json') && !f.includes('modules/'));
          if (fullBackup) {
            const content = await zip.files[fullBackup].async('string');
            combined = { ...combined, ...extractModules(JSON.parse(content)) };
          } else {
            for (const [path, zipFile] of Object.entries(zip.files)) {
              if (path.startsWith('modules/') && path.endsWith('.json') && !zipFile.dir) {
                const content = await zipFile.async('string');
                const parsed = JSON.parse(content);
                const key = (path.split('/').pop() || '').replace('.json', '');
                if (key && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0)) {
                  combined[key] = parsed;
                }
              }
            }
          }
        } else if (file.name.endsWith('.json')) {
          const text = await file.text();
          const parsed = JSON.parse(text);
          if (parsed._meta || (parsed.activities && parsed.boqItems)) {
            combined = { ...combined, ...extractModules(parsed) };
          } else {
            const key = file.name.replace('.json', '');
            combined[key] = parsed;
          }
        }
      }

      if (Object.keys(combined).length === 0) {
        toast({ title: 'No Data Found', description: 'No valid backup data found in the selected files', variant: 'destructive' });
        return;
      }

      setPreviewData(combined);
      setSelectedModules(new Set(Object.keys(combined)));
    } catch (err) {
      toast({ title: 'Parse Failed', description: String(err), variant: 'destructive' });
    }
  };

  const confirmRestore = async () => {
    if (!previewData || selectedModules.size === 0) return;
    setRestoring(true);
    try {
      const ops = getOpsMap();
      let totalRestored = 0;

      for (const key of selectedModules) {
        const items = previewData[key];
        if (key === 'settings' && typeof items === 'object' && !Array.isArray(items)) {
          localStorage.setItem('buildforge-settings', JSON.stringify(items));
          totalRestored++;
        } else if (key in ops && Array.isArray(items)) {
          (ops as any)[key].setAll(items);
          totalRestored += items.length;
        }
      }

      if (totalRestored === 0) {
        toast({ title: 'No Data Restored', description: 'No valid data in selected modules', variant: 'destructive' });
      } else {
        toast({ title: 'Restore Complete', description: `${totalRestored} records restored from ${selectedModules.size} module(s)` });
      }
    } catch (err) {
      toast({ title: 'Restore Failed', description: String(err), variant: 'destructive' });
    } finally {
      setRestoring(false);
      setPreviewData(null);
      setSelectedModules(new Set());
      [singleFileRef, multiFileRef, folderRef].forEach(ref => {
        if (ref.current) ref.current.value = '';
      });
    }
  };

  const toggleModule = (key: string) => {
    setSelectedModules(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    if (!previewData) return;
    const allKeys = Object.keys(previewData);
    if (selectedModules.size === allKeys.length) {
      setSelectedModules(new Set());
    } else {
      setSelectedModules(new Set(allKeys));
    }
  };

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
          Select a backup file to preview available modules, then choose which ones to restore.
        </p>

        {/* Hidden file inputs */}
        <input ref={singleFileRef} type="file" accept=".zip,.json" className="hidden"
          onChange={e => e.target.files && e.target.files.length > 0 && parseBackupForPreview(e.target.files)} />
        <input ref={multiFileRef} type="file" accept=".zip,.json" multiple className="hidden"
          onChange={e => e.target.files && e.target.files.length > 0 && parseBackupForPreview(e.target.files)} />
        <input ref={folderRef} type="file" className="hidden"
          {...({ webkitdirectory: 'true', directory: 'true' } as any)}
          onChange={e => e.target.files && e.target.files.length > 0 && parseBackupForPreview(e.target.files)} />

        {!previewData ? (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" onClick={() => singleFileRef.current?.click()} disabled={restoring}>
                <File size={14} className="mr-1.5" />
                Single File
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
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Select modules to restore:</p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs h-7 px-2">
                  {selectedModules.size === Object.keys(previewData).length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setPreviewData(null); setSelectedModules(new Set()); }} className="text-xs h-7 px-2">
                  <X size={12} className="mr-1" /> Cancel
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(previewData).map(([key, items]) => {
                const label = key === 'settings' ? 'Settings' : (TABLE_LABELS[key] || key);
                const count = Array.isArray(items) ? items.length : Object.keys(items).length;
                const checked = selectedModules.has(key);
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      checked ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/40'
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleModule(key)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({count} {Array.isArray(items) ? 'records' : 'fields'})
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={confirmRestore} disabled={restoring || selectedModules.size === 0}>
                <RotateCcw size={14} className="mr-1.5" />
                {restoring ? 'Restoring...' : `Restore ${selectedModules.size} Module(s)`}
              </Button>
              <span className="text-xs text-muted-foreground">
                {selectedModules.size} of {Object.keys(previewData).length} modules selected
              </span>
            </div>
          </div>
        )}
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
