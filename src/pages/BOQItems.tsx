import { useState, useCallback } from 'react';
import { useProjectData } from '@/context/ProjectDataContext';
import { BOQItem } from '@/types/construction';
import PrintableReport from '@/components/PrintableReport';
import ExcelImportExport from '@/components/ExcelImportExport';
import MaterialAnalysis from '@/components/MaterialAnalysis';
import { useModuleSync } from '@/hooks/useModuleSync';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Undo2, Trash, FolderPlus, Sparkles, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

export default function BOQItems() {
  const { boqItems: items, boqOps } = useProjectData();
  const { syncing: aiAnalyzing, fullSync, applyActivities, applyMaterials } = useModuleSync();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BOQItem | null>(null);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [materialAnalysisOpen, setMaterialAnalysisOpen] = useState(false);
  const [autoAnalysisRunning, setAutoAnalysisRunning] = useState(false);

  const totalBudget = items.reduce((sum, i) => sum + i.totalQty * i.rate, 0);
  const totalExecuted = items.reduce((sum, i) => sum + i.executedQty * i.rate, 0);

  const emptyItem: BOQItem = { id: '', code: '', description: '', unit: '', measureType: 'direct', totalQty: 0, executedQty: 0, rate: 0 };
  const [form, setForm] = useState<BOQItem>(emptyItem);

  const openAdd = () => { setEditing(null); setForm({ ...emptyItem, id: crypto.randomUUID() }); setDialogOpen(true); };
  const openEdit = (item: BOQItem) => { setEditing(item); setForm(item); setDialogOpen(true); };

  const handleSave = () => { boqOps.save(form); setDialogOpen(false); };
  const handleDelete = (id: string) => boqOps.remove(id);

  const handleImport = (data: Record<string, any>[]) => {
    const mapped: BOQItem[] = data.map(row => ({
      id: crypto.randomUUID(),
      code: row.code || row.Code || row['Item Code'] || '',
      description: row.description || row.Description || '',
      unit: row.unit || row.Unit || '',
      measureType: (row.measureType || row.Method || row['Measure Type (direct/rectangular/trapezoidal/rebar)'] || 'direct') as BOQItem['measureType'],
      totalQty: Number(row.totalQty || row['Total Qty'] || 0),
      executedQty: Number(row.executedQty || row['Executed Qty'] || 0),
      rate: Number(row.rate || row.Rate || row['Unit Rate'] || 0),
    }));
    boqOps.bulkAdd(mapped);
  };

  const excelColumns = [
    { key: 'code', label: 'Code' }, { key: 'description', label: 'Description' }, { key: 'unit', label: 'Unit' },
    { key: 'measureType', label: 'Method' }, { key: 'totalQty', label: 'Total Qty' },
    { key: 'executedQty', label: 'Executed Qty' }, { key: 'rate', label: 'Rate' },
  ];

  const handleStartNewProject = () => {
    boqOps.clearAll();
    setNewProjectDialogOpen(false);
    toast({ title: 'Fresh Start', description: 'Default data cleared. You can now add your own BOQ items or import from Excel.' });
  };

  const update = (field: keyof BOQItem, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">BOQ / Item Master</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} items · Budget: AED {(totalBudget / 1000000).toFixed(1)}M · Executed: AED {(totalExecuted / 1000000).toFixed(1)}M
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExcelImportExport
            data={items}
            columns={excelColumns}
            fileName="BOQ_Items"
            onImport={handleImport}
          />
          <PrintableReport title="BOQ / Item Master" columns={excelColumns} data={items} />
          <Button variant="ghost" size="sm" onClick={boqOps.undo} disabled={!boqOps.canUndo} title="Undo">
            <Undo2 size={14} className="mr-1" /> Undo
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setNewProjectDialogOpen(true)} disabled={items.length === 0} className="text-destructive" title="Start fresh">
            <FolderPlus size={14} className="mr-1" /> New Project
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMaterialAnalysisOpen(true)} disabled={items.length === 0}>
            <Sparkles size={14} className="mr-1" /> AI Analysis
          </Button>
          <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Add Item</Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No BOQ items</p>
            <p className="text-sm">Click "Add Item" to add manually or use "Import XLS" to upload your Excel sheet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th><th>Description</th><th>Unit</th><th>Method</th>
                  <th className="text-right">Total Qty</th><th className="text-right">Executed</th>
                  <th>Progress</th><th className="text-right">Rate</th><th className="text-right">Amount</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const pct = item.totalQty > 0 ? Math.round((item.executedQty / item.totalQty) * 100) : 0;
                  return (
                    <tr key={item.id}>
                      <td className="font-mono text-xs font-medium">{item.code}</td>
                      <td className="font-medium">{item.description}</td>
                      <td className="text-muted-foreground">{item.unit}</td>
                      <td className="text-xs text-muted-foreground capitalize">{item.measureType}</td>
                      <td className="text-right font-mono">{item.totalQty.toLocaleString()}</td>
                      <td className="text-right font-mono">{item.executedQty.toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                        </div>
                      </td>
                      <td className="text-right font-mono">{item.rate.toLocaleString()}</td>
                      <td className="text-right font-mono font-medium">{(item.totalQty * item.rate).toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Pencil size={13} /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 size={13} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50">
                  <td colSpan={8} className="px-4 py-3 font-semibold text-sm">Total</td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{totalBudget.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit BOQ Item' : 'Add BOQ Item'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5"><Label>Item Code</Label><Input value={form.code} onChange={e => update('code', e.target.value)} placeholder="e.g. RC-001" /></div>
            <div className="space-y-1.5"><Label>Unit</Label><Input value={form.unit} onChange={e => update('unit', e.target.value)} placeholder="m³, ton, m²" /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Input value={form.description} onChange={e => update('description', e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Measure Type</Label>
              <Select value={form.measureType} onValueChange={v => update('measureType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="rectangular">Rectangular</SelectItem>
                  <SelectItem value="trapezoidal">Trapezoidal</SelectItem>
                  <SelectItem value="rebar">Rebar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Rate</Label><Input type="number" value={form.rate} onChange={e => update('rate', Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Total Qty</Label><Input type="number" value={form.totalQty} onChange={e => update('totalQty', Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Executed Qty</Label><Input type="number" value={form.executedQty} onChange={e => update('executedQty', Number(e.target.value))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Save Changes' : 'Add Item'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Project Confirmation Dialog */}
      <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Start New Project?</DialogTitle>
            <DialogDescription>
              This will clear all existing BOQ data including any default/sample items. You can then add your own items manually or import from an Excel sheet.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
            ⚠️ This action will remove {items.length} items. Use "Undo" immediately after if needed.
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setNewProjectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleStartNewProject}>Clear & Start Fresh</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <MaterialAnalysis open={materialAnalysisOpen} onOpenChange={setMaterialAnalysisOpen} />
    </div>
  );
}
