import { useState, useCallback, useRef } from 'react';
import ModulePage from '@/components/ModulePage';
import PrintableReport from '@/components/PrintableReport';
import { sampleInventory, sampleManpower, sampleEquipment, sampleSafety, sampleDelays, samplePOs, sampleBOQ } from '@/data/sampleData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Undo2, Trash2, Printer, ImagePlus, X } from 'lucide-react';
import { EquipmentEntry, BOQItem } from '@/types/construction';

// ─── Constants ───

const MANPOWER_TRADES = [
  'Mason', 'Carpenter', 'Steel Fixer / Rebar', 'Welder', 'Pipe Fitter', 'Electrician',
  'Plumber', 'Painter', 'Plasterer', 'Tiler', 'Scaffolder', 'Rigger',
  'Crane Operator', 'Excavator Operator', 'Loader Operator', 'Roller Operator',
  'Concrete Pump Operator', 'Tower Crane Operator', 'Forklift Operator',
  'Surveyor', 'Chainman', 'Rod Man',
  'Insulator', 'Waterproofer', 'Roofer', 'Glazier', 'Curtain Wall Installer',
  'HVAC Technician', 'Fire Fighting Technician', 'ELV Technician',
  'Shuttering Carpenter', 'Form Worker', 'Concrete Finisher',
  'Skilled Labour', 'Semi-Skilled Labour', 'Unskilled Labour / Helper',
  'Flagman / Banksman', 'Store Keeper', 'Watchman / Security Guard',
];

const EQUIPMENT_TYPES = [
  'Excavator', 'Backhoe Loader', 'Wheel Loader', 'Bulldozer', 'Motor Grader',
  'Roller / Compactor', 'Dump Truck', 'Tipper Truck', 'Flatbed Truck', 'Water Tanker',
  'Tower Crane', 'Mobile Crane (25T)', 'Mobile Crane (50T)', 'Mobile Crane (100T+)',
  'Rough Terrain Crane', 'Crawler Crane',
  'Concrete Mixer Truck', 'Concrete Pump (Boom)', 'Concrete Pump (Line)', 'Batching Plant',
  'Piling Rig (CFA)', 'Piling Rig (Bored)', 'Sheet Piling Machine',
  'Generator (Small)', 'Generator (Large)', 'Air Compressor',
  'Welding Machine', 'Bar Bending Machine', 'Bar Cutting Machine',
  'Forklift', 'Telehandler', 'Boom Lift', 'Scissor Lift', 'Man Lift',
  'Concrete Vibrator', 'Plate Compactor', 'Jack Hammer / Breaker',
  'Dewatering Pump', 'Submersible Pump',
  'Asphalt Paver', 'Asphalt Distributor', 'Milling Machine',
  'Surveying Equipment (Total Station)', 'Laser Level',
  'Shotcrete Machine', 'Grouting Machine', 'Tunnel Boring Machine',
];

const CONCRETE_GRADES = [
  'C7/8 (M10)', 'C10 (M10)', 'C12/15', 'C15 (M15)', 'C16/20',
  'C20 (M20)', 'C20/25', 'C25 (M25)', 'C25/30',
  'C28/35', 'C30 (M30)', 'C30/37', 'C32/40',
  'C35 (M35)', 'C35/45', 'C40 (M40)', 'C40/50',
  'C45 (M45)', 'C50 (M50)', 'C50/60',
  'C55 (M55)', 'C60 (M60)', 'C60/75',
  'C70 (M70)', 'C80 (M80)', 'C90 (M90)', 'C100 (M100)',
  'Lean Concrete', 'Mass Concrete', 'Self-Compacting (SCC)',
  'Fiber Reinforced', 'Shotcrete', 'Underwater Concrete',
  'Flowable Fill', 'Grout',
];

// ─── Generic CRUD wrapper with undo ───
function useCrudState<T extends { id: string }>(initial: T[]) {
  const [data, setData] = useState<T[]>(initial);
  const [history, setHistory] = useState<T[][]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pushHistory = (current: T[]) => setHistory(prev => [...prev.slice(-20), current]);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (item: T) => { setEditing(item); setDialogOpen(true); };
  const handleDelete = (item: T) => { pushHistory(data); setData(prev => prev.filter(i => i.id !== item.id)); };
  const save = (item: T) => {
    pushHistory(data);
    setData(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = item; return copy; }
      return [...prev, item];
    });
    setDialogOpen(false);
  };
  const handleImport = (rows: Record<string, any>[], mapper: (row: Record<string, any>) => T) => {
    pushHistory(data);
    const mapped = rows.map(mapper);
    setData(prev => [...prev, ...mapped]);
  };
  const undo = () => {
    if (history.length === 0) return;
    setData(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
    toast({ title: 'Undone', description: 'Last action reverted' });
  };
  const clearAll = () => {
    if (data.length === 0) return;
    pushHistory(data);
    setData([]);
    toast({ title: 'Cleared', description: 'All data cleared. Use Undo to restore.' });
  };
  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll = () => {
    if (selected.size === data.length) setSelected(new Set());
    else setSelected(new Set(data.map(d => d.id)));
  };
  const deleteSelected = () => {
    if (selected.size === 0) return;
    pushHistory(data);
    setData(prev => prev.filter(i => !selected.has(i.id)));
    setSelected(new Set());
    toast({ title: 'Deleted', description: `${selected.size} items removed` });
  };

  return { data, dialogOpen, setDialogOpen, editing, openAdd, openEdit, handleDelete, save, handleImport, undo, clearAll, canUndo: history.length > 0, selected, toggleSelect, selectAll, deleteSelected };
}

// ─── Shared toolbar buttons ───
function CrudToolbar({ canUndo, onUndo, onClear, dataLength, selectedCount, onDeleteSelected, printBtn }: {
  canUndo: boolean; onUndo: () => void; onClear: () => void; dataLength: number;
  selectedCount?: number; onDeleteSelected?: () => void; printBtn?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {printBtn}
      {selectedCount && selectedCount > 0 && onDeleteSelected && (
        <Button variant="outline" size="sm" onClick={onDeleteSelected} className="text-destructive border-destructive/30">
          <Trash2 size={14} className="mr-1" /> Delete ({selectedCount})
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} title="Undo last action">
        <Undo2 size={14} className="mr-1" /> Undo
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear} disabled={dataLength === 0} className="text-destructive" title="Clear all data">
        <Trash2 size={14} className="mr-1" /> Clear All
      </Button>
    </div>
  );
}

// ─── Inventory ───
export function InventoryPage() {
  const crud = useCrudState(sampleInventory);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <>
      <ModulePage
        title="Inventory"
        description={`Track stock levels, receipts, and issues · ${crud.data.length} items`}
        columns={[
          { key: 'code', label: 'Code', render: i => <span className="font-mono text-xs font-medium">{i.code}</span> },
          { key: 'description', label: 'Description', render: i => <span className="font-medium">{i.description}</span> },
          { key: 'unit', label: 'Unit' },
          { key: 'opening', label: 'Opening', render: i => <span className="text-right font-mono block">{i.opening}</span> },
          { key: 'receipts', label: 'Receipts', render: i => <span className="text-right font-mono block">{i.receipts}</span> },
          { key: 'issues', label: 'Issues', render: i => <span className="text-right font-mono block">{i.issues}</span> },
          { key: 'balance', label: 'Balance', render: i => (
            <span className={`text-right font-mono font-medium block ${i.balance <= i.minLevel ? 'text-destructive' : ''}`}>{i.balance}</span>
          )},
          { key: 'minLevel', label: 'Min Level', render: i => <span className="text-right font-mono block">{i.minLevel}</span> },
          { key: 'status', label: 'Status', render: i => (
            i.balance <= i.minLevel ? <span className="badge-critical">Low Stock</span> : <span className="badge-success">OK</span>
          )},
          { key: 'location', label: 'Location' },
        ]}
        data={crud.data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), code: '', description: '', unit: '', opening: 0, receipts: 0, issues: 0, balance: 0, minLevel: 0, location: '' }); crud.openAdd(); }}
        onEdit={item => { setForm(item); crud.openEdit(item); }}
        onDelete={crud.handleDelete}
        onImport={rows => crud.handleImport(rows, r => ({
          id: crypto.randomUUID(), code: r.Code || r.code || '', description: r.Description || r.description || '',
          unit: r.Unit || r.unit || '', opening: Number(r.Opening || r.opening || 0), receipts: Number(r.Receipts || r.receipts || 0),
          issues: Number(r.Issues || r.issues || 0), balance: Number(r.Balance || r.balance || 0),
          minLevel: Number(r['Min Level'] || r.minLevel || 0), location: r.Location || r.location || '',
        }))}
        fileName="Inventory"
        extraToolbar={
          <CrudToolbar canUndo={crud.canUndo} onUndo={crud.undo} onClear={crud.clearAll} dataLength={crud.data.length}
            printBtn={<PrintableReport title="Inventory" columns={[
              { key: 'code', label: 'Code' }, { key: 'description', label: 'Description' }, { key: 'unit', label: 'Unit' },
              { key: 'opening', label: 'Opening' }, { key: 'receipts', label: 'Receipts' }, { key: 'issues', label: 'Issues' },
              { key: 'balance', label: 'Balance' }, { key: 'minLevel', label: 'Min Level' }, { key: 'location', label: 'Location' },
            ]} data={crud.data} />}
          />
        }
      />
      <Dialog open={crud.dialogOpen} onOpenChange={crud.setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{crud.editing ? 'Edit' : 'Add'} Inventory Item</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5"><Label>Code</Label><Input value={form.code || ''} onChange={e => u('code', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Unit</Label><Input value={form.unit || ''} onChange={e => u('unit', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Input value={form.description || ''} onChange={e => u('description', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Opening</Label><Input type="number" value={form.opening || 0} onChange={e => u('opening', +e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Receipts</Label><Input type="number" value={form.receipts || 0} onChange={e => u('receipts', +e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Issues</Label><Input type="number" value={form.issues || 0} onChange={e => u('issues', +e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Min Level</Label><Input type="number" value={form.minLevel || 0} onChange={e => u('minLevel', +e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={e => u('location', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => crud.setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { const bal = (form.opening || 0) + (form.receipts || 0) - (form.issues || 0); crud.save({ ...form, balance: bal }); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Manpower (Enhanced with comprehensive trade dropdowns) ───
export function ManpowerPage() {
  const crud = useCrudState<any>([]);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const addTradeRow = () => {
    const trades = form.trades || [];
    u('trades', [...trades, { trade: '', count: 0 }]);
  };
  const updateTrade = (idx: number, field: string, val: any) => {
    const trades = [...(form.trades || [])];
    trades[idx] = { ...trades[idx], [field]: val };
    u('trades', trades);
  };
  const removeTrade = (idx: number) => {
    u('trades', (form.trades || []).filter((_: any, i: number) => i !== idx));
  };

  const totalWorkers = (item: any) => (item.trades || []).reduce((s: number, t: any) => s + (t.count || 0), 0);

  return (
    <>
      <ModulePage
        title="Daily Manpower"
        description={`Track labor by trade and location · ${crud.data.length} entries`}
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'location', label: 'Location', render: i => <span className="font-medium">{i.location}</span> },
          { key: 'trades', label: 'Trades', render: i => (
            <div className="space-y-0.5">
              {(i.trades || []).slice(0, 3).map((t: any, idx: number) => (
                <span key={idx} className="inline-block text-xs bg-muted px-1.5 py-0.5 rounded mr-1">{t.trade}: {t.count}</span>
              ))}
              {(i.trades || []).length > 3 && <span className="text-xs text-muted-foreground">+{(i.trades || []).length - 3} more</span>}
            </div>
          )},
          { key: 'total', label: 'Total', render: i => <span className="font-mono font-bold">{totalWorkers(i)}</span> },
          { key: 'supervisor', label: 'Supervisor' },
        ]}
        data={crud.data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], location: '', trades: [{ trade: '', count: 0 }], supervisor: '' }); crud.openAdd(); }}
        onEdit={item => { setForm(item); crud.openEdit(item); }}
        onDelete={crud.handleDelete}
        onImport={rows => crud.handleImport(rows, r => ({
          id: crypto.randomUUID(), date: r.Date || '', location: r.Location || '',
          trades: MANPOWER_TRADES.filter(t => r[t] && +r[t] > 0).map(t => ({ trade: t, count: +r[t] })),
          supervisor: r.Supervisor || '',
        }))}
        fileName="Manpower"
        extraToolbar={
          <CrudToolbar canUndo={crud.canUndo} onUndo={crud.undo} onClear={crud.clearAll} dataLength={crud.data.length}
            selectedCount={crud.selected.size} onDeleteSelected={crud.deleteSelected}
            printBtn={<PrintableReport title="Daily Manpower" columns={[
              { key: 'date', label: 'Date' }, { key: 'location', label: 'Location' },
              { key: 'tradesText', label: 'Trades & Count' }, { key: 'total', label: 'Total' }, { key: 'supervisor', label: 'Supervisor' },
            ]} data={crud.data.map(i => ({
              ...i, tradesText: (i.trades || []).map((t: any) => `${t.trade}: ${t.count}`).join(', '), total: totalWorkers(i),
            }))} />}
          />
        }
      />
      <Dialog open={crud.dialogOpen} onOpenChange={crud.setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{crud.editing ? 'Edit' : 'Add'} Manpower Entry</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date || ''} onChange={e => u('date', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={e => u('location', e.target.value)} /></div>
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Trades</Label>
                <Button variant="outline" size="sm" onClick={addTradeRow}><span className="mr-1">+</span> Add Trade</Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(form.trades || []).map((t: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select value={t.trade} onValueChange={v => updateTrade(idx, 'trade', v)}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select trade" /></SelectTrigger>
                      <SelectContent>
                        {MANPOWER_TRADES.map(tr => <SelectItem key={tr} value={tr}>{tr}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="number" className="w-20" value={t.count || 0} onChange={e => updateTrade(idx, 'count', +e.target.value)} placeholder="Count" />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeTrade(idx)}>
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm font-medium text-muted-foreground">
                Total: <span className="text-foreground font-bold">{totalWorkers(form)}</span> workers
              </div>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Supervisor</Label><Input value={form.supervisor || ''} onChange={e => u('supervisor', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => crud.setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => crud.save(form)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Equipment (Enhanced with type dropdown, billing basis, rate) ───
export function EquipmentPage() {
  const crud = useCrudState(sampleEquipment);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const totalCost = (i: any) => {
    const rate = i.rate || 0;
    const hrs = i.hours || 0;
    if (i.billingBasis === 'daily') return rate;
    if (i.billingBasis === 'monthly') return rate;
    return rate * hrs; // hourly
  };

  return (
    <>
      <ModulePage
        title="Equipment Log"
        description={`Record equipment usage, hours, fuel · ${crud.data.length} entries`}
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'eqId', label: 'Eq. ID', render: i => <span className="font-mono text-xs font-medium">{i.eqId}</span> },
          { key: 'equipmentName', label: 'Equipment', render: i => <span className="font-medium">{i.equipmentName}</span> },
          { key: 'operator', label: 'Operator' },
          { key: 'ownership', label: 'Ownership', render: (i: EquipmentEntry) => (
            i.ownership === 'owned' ? <span className="badge-success">Owned</span> :
            i.ownership === 'leased' ? <span className="badge-info">Leased</span> :
            <span className="badge-warning">Rented</span>
          )},
          { key: 'billingBasis', label: 'Billing', render: (i: any) => <span className="text-xs uppercase">{i.billingBasis || 'hourly'}</span> },
          { key: 'rate', label: 'Rate', render: (i: any) => <span className="font-mono">{(i.rate || 0).toLocaleString()}</span> },
          { key: 'hours', label: 'Hours', render: i => <span className="font-mono">{i.hours}</span> },
          { key: 'fuel', label: 'Fuel (L)', render: i => <span className="font-mono">{i.fuel}</span> },
          { key: 'cost', label: 'Cost', render: (i: any) => <span className="font-mono font-medium">{totalCost(i).toLocaleString()}</span> },
          { key: 'activity', label: 'Activity' },
          { key: 'issues', label: 'Issues', render: i => i.issues ? <span className="badge-warning">{i.issues}</span> : <span className="text-muted-foreground">—</span> },
        ]}
        data={crud.data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], eqId: '', equipmentName: '', description: '', operator: '', ownership: 'owned', billingBasis: 'hourly', rate: 0, hours: 0, fuel: 0, activity: '', issues: '' }); crud.openAdd(); }}
        onEdit={item => { setForm(item); crud.openEdit(item); }}
        onDelete={crud.handleDelete}
        onImport={rows => crud.handleImport(rows, r => ({
          id: crypto.randomUUID(), date: r.Date || '', eqId: r['Eq. ID'] || '', equipmentName: r.Equipment || r.equipmentName || '',
          description: r.Description || r.description || '',
          operator: r.Operator || '', ownership: (r.Ownership || 'owned').toLowerCase() as 'owned' | 'leased' | 'rented',
          billingBasis: r.Billing || 'hourly', rate: +r.Rate || 0,
          hours: +r.Hours || 0, fuel: +r['Fuel (L)'] || +r.fuel || 0,
          activity: r.Activity || '', issues: r.Issues || '',
        }))}
        fileName="Equipment"
        extraToolbar={
          <CrudToolbar canUndo={crud.canUndo} onUndo={crud.undo} onClear={crud.clearAll} dataLength={crud.data.length}
            selectedCount={crud.selected.size} onDeleteSelected={crud.deleteSelected}
            printBtn={<PrintableReport title="Equipment Log" columns={[
              { key: 'date', label: 'Date' }, { key: 'eqId', label: 'Eq ID' }, { key: 'equipmentName', label: 'Equipment' },
              { key: 'operator', label: 'Operator' }, { key: 'ownership', label: 'Ownership' },
              { key: 'billingBasis', label: 'Billing' }, { key: 'rate', label: 'Rate' },
              { key: 'hours', label: 'Hours' }, { key: 'fuel', label: 'Fuel (L)' }, { key: 'activity', label: 'Activity' },
            ]} data={crud.data} />}
          />
        }
      />
      <Dialog open={crud.dialogOpen} onOpenChange={crud.setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{crud.editing ? 'Edit' : 'Add'} Equipment Entry</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date || ''} onChange={e => u('date', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Equipment ID</Label><Input value={form.eqId || ''} onChange={e => u('eqId', e.target.value)} placeholder="e.g. EQ-005" /></div>
            <div className="col-span-2 space-y-1.5">
              <Label>Equipment Type</Label>
              <Select value={form.equipmentName || ''} onValueChange={v => u('equipmentName', v)}>
                <SelectTrigger><SelectValue placeholder="Select equipment type" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {EQUIPMENT_TYPES.map(eq => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ownership</Label>
              <Select value={form.ownership || 'owned'} onValueChange={v => u('ownership', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">Owned</SelectItem>
                  <SelectItem value="leased">Leased</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Billing Basis</Label>
              <Select value={form.billingBasis || 'hourly'} onValueChange={v => u('billingBasis', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Rate</Label><Input type="number" value={form.rate || 0} onChange={e => u('rate', +e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Operator Name</Label><Input value={form.operator || ''} onChange={e => u('operator', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Hours Worked</Label><Input type="number" step="0.5" value={form.hours || 0} onChange={e => u('hours', +e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Fuel (L)</Label><Input type="number" value={form.fuel || 0} onChange={e => u('fuel', +e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Activity</Label><Input value={form.activity || ''} onChange={e => u('activity', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Issues</Label><Input value={form.issues || ''} onChange={e => u('issues', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => crud.setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => crud.save(form)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Safety ───
export function SafetyPage() {
  const crud = useCrudState(sampleSafety);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <>
      <ModulePage
        title="Safety Incidents"
        description={`Record incidents, near-misses, and observations · ${crud.data.length} records`}
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'type', label: 'Type', render: i => (
            i.type === 'incident' ? <span className="badge-critical">Incident</span> :
            i.type === 'near-miss' ? <span className="badge-warning">Near Miss</span> :
            <span className="badge-info">Observation</span>
          )},
          { key: 'location', label: 'Location' },
          { key: 'description', label: 'Description', render: i => <span className="font-medium">{i.description}</span> },
          { key: 'cause', label: 'Root Cause' },
          { key: 'preventive', label: 'Preventive Action' },
          { key: 'reporter', label: 'Reporter' },
        ]}
        data={crud.data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], type: 'observation', location: '', description: '', injured: '', cause: '', preventive: '', reporter: '' }); crud.openAdd(); }}
        onEdit={item => { setForm(item); crud.openEdit(item); }}
        onDelete={crud.handleDelete}
        onImport={rows => crud.handleImport(rows, r => ({
          id: crypto.randomUUID(), date: r.Date || '', type: (r.Type || 'observation').toLowerCase(),
          location: r.Location || '', description: r.Description || '', injured: r.Injured || '',
          cause: r['Root Cause'] || r.cause || '', preventive: r['Preventive Action'] || r.preventive || '',
          reporter: r.Reporter || '',
        }))}
        fileName="Safety"
        extraToolbar={
          <CrudToolbar canUndo={crud.canUndo} onUndo={crud.undo} onClear={crud.clearAll} dataLength={crud.data.length}
            printBtn={<PrintableReport title="Safety Incidents" columns={[
              { key: 'date', label: 'Date' }, { key: 'type', label: 'Type' }, { key: 'location', label: 'Location' },
              { key: 'description', label: 'Description' }, { key: 'cause', label: 'Root Cause' },
              { key: 'preventive', label: 'Preventive Action' }, { key: 'reporter', label: 'Reporter' },
            ]} data={crud.data} />}
          />
        }
      />
      <Dialog open={crud.dialogOpen} onOpenChange={crud.setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{crud.editing ? 'Edit' : 'Add'} Safety Record</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date || ''} onChange={e => u('date', e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type || 'observation'} onValueChange={v => u('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="near-miss">Near Miss</SelectItem>
                  <SelectItem value="observation">Observation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={e => u('location', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Reporter</Label><Input value={form.reporter || ''} onChange={e => u('reporter', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Input value={form.description || ''} onChange={e => u('description', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Root Cause</Label><Input value={form.cause || ''} onChange={e => u('cause', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Preventive Action</Label><Input value={form.preventive || ''} onChange={e => u('preventive', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => crud.setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => crud.save(form)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Delays ───
export function DelaysPage() {
  const crud = useCrudState(sampleDelays);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <>
      <ModulePage
        title="Delays Register"
        description={`Track delays, causes, and recovery · ${crud.data.length} entries`}
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'activity', label: 'Activity', render: i => <span className="font-medium">{i.activity}</span> },
          { key: 'description', label: 'Description' },
          { key: 'cause', label: 'Cause' },
          { key: 'duration', label: 'Days', render: i => <span className="font-mono font-medium">{i.duration}</span> },
          { key: 'impact', label: 'Impact' },
          { key: 'recovery', label: 'Recovery Action' },
          { key: 'status', label: 'Status', render: i => (
            i.status === 'open' ? <span className="badge-critical">Open</span> :
            i.status === 'mitigated' ? <span className="badge-warning">Mitigated</span> :
            <span className="badge-success">Closed</span>
          )},
        ]}
        data={crud.data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], activity: '', description: '', cause: '', duration: 0, impact: '', recovery: '', status: 'open' }); crud.openAdd(); }}
        onEdit={item => { setForm(item); crud.openEdit(item); }}
        onDelete={crud.handleDelete}
        onImport={rows => crud.handleImport(rows, r => ({
          id: crypto.randomUUID(), date: r.Date || '', activity: r.Activity || '', description: r.Description || '',
          cause: r.Cause || '', duration: +r.Days || +r.duration || 0, impact: r.Impact || '',
          recovery: r['Recovery Action'] || r.recovery || '', status: (r.Status || 'open').toLowerCase(),
        }))}
        fileName="Delays"
        extraToolbar={
          <CrudToolbar canUndo={crud.canUndo} onUndo={crud.undo} onClear={crud.clearAll} dataLength={crud.data.length}
            printBtn={<PrintableReport title="Delays Register" columns={[
              { key: 'date', label: 'Date' }, { key: 'activity', label: 'Activity' }, { key: 'description', label: 'Description' },
              { key: 'cause', label: 'Cause' }, { key: 'duration', label: 'Days' }, { key: 'impact', label: 'Impact' },
              { key: 'recovery', label: 'Recovery' }, { key: 'status', label: 'Status' },
            ]} data={crud.data} />}
          />
        }
      />
      <Dialog open={crud.dialogOpen} onOpenChange={crud.setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{crud.editing ? 'Edit' : 'Add'} Delay Entry</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date || ''} onChange={e => u('date', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Activity</Label><Input value={form.activity || ''} onChange={e => u('activity', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Input value={form.description || ''} onChange={e => u('description', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Cause</Label><Input value={form.cause || ''} onChange={e => u('cause', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Duration (days)</Label><Input type="number" value={form.duration || 0} onChange={e => u('duration', +e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Impact</Label><Input value={form.impact || ''} onChange={e => u('impact', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Recovery</Label><Input value={form.recovery || ''} onChange={e => u('recovery', e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status || 'open'} onValueChange={v => u('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="mitigated">Mitigated</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => crud.setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => crud.save(form)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Purchase Orders (with BOQ item dropdown) ───
export function PurchaseOrdersPage() {
  const crud = useCrudState(samplePOs);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <>
      <ModulePage
        title="Purchase Orders"
        description={`Track POs, suppliers, and delivery · ${crud.data.length} orders`}
        columns={[
          { key: 'poNo', label: 'PO No.', render: i => <span className="font-mono text-xs font-medium">{i.poNo}</span> },
          { key: 'date', label: 'Date' },
          { key: 'supplier', label: 'Supplier', render: i => <span className="font-medium">{i.supplier}</span> },
          { key: 'itemCode', label: 'Item Code', render: i => <span className="font-mono text-xs">{i.itemCode}</span> },
          { key: 'qty', label: 'Qty', render: i => <span className="font-mono">{i.qty}</span> },
          { key: 'price', label: 'Amount', render: i => <span className="font-mono font-medium">{i.price.toLocaleString()}</span> },
          { key: 'status', label: 'Status', render: i => (
            i.status === 'delivered' ? <span className="badge-success">Delivered</span> :
            i.status === 'issued' ? <span className="badge-info">Issued</span> :
            i.status === 'closed' ? <span className="badge-success">Closed</span> :
            <span className="text-xs text-muted-foreground">Draft</span>
          )},
          { key: 'remarks', label: 'Remarks' },
        ]}
        data={crud.data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), poNo: '', supplier: '', date: new Date().toISOString().split('T')[0], itemCode: '', qty: 0, price: 0, status: 'draft', remarks: '' }); crud.openAdd(); }}
        onEdit={item => { setForm(item); crud.openEdit(item); }}
        onDelete={crud.handleDelete}
        onImport={rows => crud.handleImport(rows, r => ({
          id: crypto.randomUUID(), poNo: r['PO No.'] || r.poNo || '', supplier: r.Supplier || '',
          date: r.Date || '', itemCode: r['Item Code'] || '', qty: +r.Qty || 0, price: +r.Amount || +r.price || 0,
          status: (r.Status || 'draft').toLowerCase(), remarks: r.Remarks || '',
        }))}
        fileName="PurchaseOrders"
        extraToolbar={
          <CrudToolbar canUndo={crud.canUndo} onUndo={crud.undo} onClear={crud.clearAll} dataLength={crud.data.length}
            printBtn={<PrintableReport title="Purchase Orders" columns={[
              { key: 'poNo', label: 'PO No.' }, { key: 'date', label: 'Date' }, { key: 'supplier', label: 'Supplier' },
              { key: 'itemCode', label: 'Item Code' }, { key: 'qty', label: 'Qty' }, { key: 'price', label: 'Amount' },
              { key: 'status', label: 'Status' }, { key: 'remarks', label: 'Remarks' },
            ]} data={crud.data} />}
          />
        }
      />
      <Dialog open={crud.dialogOpen} onOpenChange={crud.setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{crud.editing ? 'Edit' : 'Add'} Purchase Order</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5"><Label>PO Number</Label><Input value={form.poNo || ''} onChange={e => u('poNo', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date || ''} onChange={e => u('date', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Supplier</Label><Input value={form.supplier || ''} onChange={e => u('supplier', e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>BOQ Item Code</Label>
              <Select value={form.itemCode || ''} onValueChange={v => u('itemCode', v)}>
                <SelectTrigger><SelectValue placeholder="Select BOQ item" /></SelectTrigger>
                <SelectContent>
                  {sampleBOQ.map(b => (
                    <SelectItem key={b.id} value={b.code}>{b.code} – {b.description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" value={form.qty || 0} onChange={e => u('qty', +e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Price</Label><Input type="number" value={form.price || 0} onChange={e => u('price', +e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status || 'draft'} onValueChange={v => u('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Remarks</Label><Input value={form.remarks || ''} onChange={e => u('remarks', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => crud.setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => crud.save(form)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Remaining modules with Add/Edit/Export ───
function GenericModule({ title, description, fields, extraToolbar }: { title: string; description: string; fields: { key: string; label: string; type?: string; options?: { value: string; label: string }[] }[]; extraToolbar?: React.ReactNode }) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [history, setHistory] = useState<Record<string, any>[][]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const pushHistory = (current: Record<string, any>[]) => setHistory(prev => [...prev.slice(-20), current]);

  const openAdd = () => {
    setEditing(null);
    setForm({ id: crypto.randomUUID(), ...Object.fromEntries(fields.map(f => [f.key, ''])) });
    setDialogOpen(true);
  };

  const openEdit = (item: Record<string, any>) => { setEditing(item); setForm(item); setDialogOpen(true); };

  const save = () => {
    pushHistory(data);
    setData(prev => {
      const idx = prev.findIndex(i => i.id === form.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = form; return copy; }
      return [...prev, form];
    });
    setDialogOpen(false);
  };

  const undo = () => {
    if (history.length === 0) return;
    setData(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
    toast({ title: 'Undone', description: 'Last action reverted' });
  };

  const clearAll = () => {
    if (data.length === 0) return;
    pushHistory(data);
    setData([]);
    toast({ title: 'Cleared', description: 'All data cleared. Use Undo to restore.' });
  };

  return (
    <>
      <ModulePage
        title={title}
        description={`${description} · ${data.length} records`}
        columns={fields.map(f => ({ key: f.key, label: f.label }))}
        data={data as { id: string }[]}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={item => { pushHistory(data); setData(prev => prev.filter(i => i.id !== item.id)); }}
        onImport={rows => {
          pushHistory(data);
          const mapped = rows.map(r => ({ id: crypto.randomUUID(), ...r }));
          setData(prev => [...prev, ...mapped]);
        }}
        fileName={title.replace(/\s+/g, '_')}
        extraToolbar={
          <CrudToolbar canUndo={history.length > 0} onUndo={undo} onClear={clearAll} dataLength={data.length}
            printBtn={<PrintableReport title={title} columns={fields.map(f => ({ key: f.key, label: f.label }))} data={data} />}
          />
        }
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} {title}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {fields.map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                {f.options ? (
                  <Select value={form[f.key] || ''} onValueChange={v => u(f.key, v)}>
                    <SelectTrigger><SelectValue placeholder={`Select ${f.label}`} /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {f.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => u(f.key, e.target.value)} />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Equipment options for fuel log dropdown (dynamic from sample + any added)
const equipmentOptions = sampleEquipment.map(e => ({ value: `${e.eqId} - ${e.equipmentName}`, label: `${e.eqId} - ${e.equipmentName}` }));

export const DailyQuantityPage = () => <GenericModule title="Daily Quantity" description="Enter executed quantities per BOQ item" fields={[
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'boqCode', label: 'BOQ Code', options: sampleBOQ.map(b => ({ value: b.code, label: `${b.code} – ${b.description}` })) },
  { key: 'description', label: 'Description' },
  { key: 'quantity', label: 'Quantity', type: 'number' },
  { key: 'unit', label: 'Unit' },
  { key: 'location', label: 'Location' },
  { key: 'remarks', label: 'Remarks' },
]} />;

export const BillsPage = () => <GenericModule title="Bills" description="Record supplier bills with payment status" fields={[
  { key: 'billNo', label: 'Bill No.' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'supplier', label: 'Supplier' },
  { key: 'poRef', label: 'PO Ref' }, { key: 'amount', label: 'Amount', type: 'number' },
  { key: 'status', label: 'Status', options: [{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'paid', label: 'Paid' }, { value: 'rejected', label: 'Rejected' }] },
  { key: 'remarks', label: 'Remarks' },
]} />;

export const StaffPage = () => <GenericModule title="Key Staff" description="Project personnel – engineers, managers, accountants" fields={[
  { key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'contact', label: 'Contact' },
  { key: 'department', label: 'Department' }, { key: 'responsibility', label: 'Responsibility' }, { key: 'joinDate', label: 'Join Date', type: 'date' },
]} />;

export const FuelLogPage = () => <GenericModule title="Fuel Log" description="Track fuel receipts, issues, and balance" fields={[
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'type', label: 'Fuel Type', options: [{ value: 'diesel', label: 'Diesel' }, { value: 'petrol', label: 'Petrol' }, { value: 'lpg', label: 'LPG' }] },
  { key: 'receipt', label: 'Receipt (L)', type: 'number' },
  { key: 'issued', label: 'Issued (L)', type: 'number' },
  { key: 'issuedTo', label: 'Issued To (Equipment)', options: equipmentOptions },
  { key: 'balance', label: 'Balance', type: 'number' },
  { key: 'remarks', label: 'Remarks' },
]} />;

export const QualityPage = () => <GenericModule title="Quality (ITP/NCR)" description="Inspection test plans and non-conformance reports" fields={[
  { key: 'testId', label: 'Test ID' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'location', label: 'Location' },
  { key: 'type', label: 'Type', options: [{ value: 'ITP', label: 'ITP' }, { value: 'NCR', label: 'NCR' }, { value: 'MIR', label: 'MIR' }] },
  { key: 'spec', label: 'Specification' },
  { key: 'result', label: 'Result', options: [{ value: 'pass', label: 'Pass' }, { value: 'fail', label: 'Fail' }, { value: 'pending', label: 'Pending' }] },
  { key: 'status', label: 'Status', options: [{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }] },
  { key: 'testedBy', label: 'Tested By' },
]} />;

// ─── Concrete Pour (Enhanced with comprehensive grades) ───
export const ConcreteLogPage = () => <GenericModule title="Concrete Pour" description="Daily pour cards with slump, cubes, weather" fields={[
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'location', label: 'Location' },
  { key: 'grade', label: 'Concrete Grade', options: CONCRETE_GRADES.map(g => ({ value: g, label: g })) },
  { key: 'supplier', label: 'Supplier / Batch Plant' },
  { key: 'volume', label: 'Volume (m³)', type: 'number' },
  { key: 'slump', label: 'Slump (mm)', type: 'number' },
  { key: 'temp', label: 'Temp (°C)', type: 'number' },
  { key: 'weather', label: 'Weather', options: [
    { value: 'sunny', label: 'Sunny' }, { value: 'cloudy', label: 'Cloudy' },
    { value: 'rainy', label: 'Rainy' }, { value: 'windy', label: 'Windy' },
    { value: 'hot', label: 'Hot (>35°C)' }, { value: 'cold', label: 'Cold (<5°C)' },
  ]},
  { key: 'cubes', label: 'Test Cubes', type: 'number' },
  { key: 'pourMethod', label: 'Pour Method', options: [
    { value: 'pump', label: 'Pump' }, { value: 'skip', label: 'Skip / Bucket' },
    { value: 'chute', label: 'Chute' }, { value: 'tremie', label: 'Tremie' },
  ]},
  { key: 'element', label: 'Structural Element' },
  { key: 'supervisor', label: 'Supervisor' },
]} />;

export const WeldingPage = () => <GenericModule title="Welding Log" description="Daily welding reports with NDT results" fields={[
  { key: 'date', label: 'Date', type: 'date' }, { key: 'location', label: 'Location' }, { key: 'welderName', label: 'Welder' },
  { key: 'welderId', label: 'Welder ID' }, { key: 'joints', label: 'Joint Type' }, { key: 'numJoints', label: 'No. Joints', type: 'number' },
  { key: 'ndtReq', label: 'NDT Required', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
  { key: 'ndtRes', label: 'NDT Result', options: [{ value: 'pass', label: 'Pass' }, { value: 'fail', label: 'Fail' }, { value: 'pending', label: 'Pending' }] },
  { key: 'inspector', label: 'Inspector' },
]} />;

export const ToolsPage = () => <GenericModule title="Tools" description="Tool issuance, return tracking, and condition" fields={[
  { key: 'toolId', label: 'Tool ID' }, { key: 'description', label: 'Description' }, { key: 'issuedTo', label: 'Issued To' },
  { key: 'dateIssued', label: 'Date Issued', type: 'date' }, { key: 'expReturn', label: 'Expected Return', type: 'date' }, { key: 'actReturn', label: 'Actual Return', type: 'date' },
  { key: 'condition', label: 'Condition', options: [{ value: 'good', label: 'Good' }, { value: 'fair', label: 'Fair' }, { value: 'poor', label: 'Poor' }, { value: 'damaged', label: 'Damaged' }] },
]} />;

export const SubcontractorsPage = () => <GenericModule title="Subcontractors" description="Track daily progress and cumulative completion" fields={[
  { key: 'name', label: 'Name' }, { key: 'scope', label: 'Scope' }, { key: 'contractValue', label: 'Contract Value', type: 'number' },
  { key: 'date', label: 'Date', type: 'date' }, { key: 'manpower', label: 'Manpower', type: 'number' }, { key: 'progress', label: 'Daily Progress' },
  { key: 'cumulative', label: 'Cumulative %', type: 'number' }, { key: 'supervisor', label: 'Supervisor' },
]} />;

// ─── Photos (Enhanced with local file upload) ───
export function PhotosPage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [history, setHistory] = useState<any[][]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const pushHistory = () => setHistory(prev => [...prev.slice(-20), photos]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    pushHistory();
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setPhotos(prev => [...prev, {
          id: crypto.randomUUID(),
          fileName: file.name,
          date: new Date().toISOString().split('T')[0],
          size: (file.size / 1024).toFixed(1) + ' KB',
          location: '',
          description: '',
          takenBy: '',
          dataUrl: evt.target?.result as string,
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = '';
    toast({ title: 'Uploaded', description: `${files.length} photo(s) added` });
  };

  const undo = () => {
    if (history.length === 0) return;
    setPhotos(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
    toast({ title: 'Undone' });
  };

  const clearAll = () => {
    if (photos.length === 0) return;
    pushHistory();
    setPhotos([]);
    toast({ title: 'Cleared', description: 'All photos removed. Use Undo to restore.' });
  };

  return (
    <div>
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Site Photos</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload and manage site photographs · {photos.length} photos</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PrintableReport title="Site Photos" columns={[
            { key: 'date', label: 'Date' }, { key: 'fileName', label: 'File Name' },
            { key: 'location', label: 'Location' }, { key: 'description', label: 'Description' }, { key: 'takenBy', label: 'Taken By' },
          ]} data={photos} />
          <Button variant="ghost" size="sm" onClick={undo} disabled={history.length === 0}><Undo2 size={14} className="mr-1" /> Undo</Button>
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={photos.length === 0} className="text-destructive"><Trash2 size={14} className="mr-1" /> Clear All</Button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={14} className="mr-1" /> Upload Photos
          </Button>
        </div>
      </div>
      {photos.length === 0 ? (
        <div className="bg-card rounded-xl border shadow-sm p-12 text-center text-muted-foreground">
          No photos uploaded yet. Click "Upload Photos" to add site images from your computer.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map(p => (
            <div key={p.id} className="bg-card rounded-xl border shadow-sm overflow-hidden group">
              <div className="aspect-video bg-muted overflow-hidden">
                <img src={p.dataUrl} alt={p.fileName} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{p.fileName}</p>
                <p className="text-xs text-muted-foreground">{p.date} · {p.size}</p>
                <Input className="mt-2 h-7 text-xs" placeholder="Location" value={p.location}
                  onChange={e => setPhotos(prev => prev.map(x => x.id === p.id ? { ...x, location: e.target.value } : x))} />
                <Input className="mt-1 h-7 text-xs" placeholder="Description" value={p.description}
                  onChange={e => setPhotos(prev => prev.map(x => x.id === p.id ? { ...x, description: e.target.value } : x))} />
                <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs text-destructive w-full"
                  onClick={() => { pushHistory(); setPhotos(prev => prev.filter(x => x.id !== p.id)); }}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const ChangeOrdersPage = () => <GenericModule title="Change Orders" description="Track change requests with cost and schedule impact" fields={[
  { key: 'coNo', label: 'CO No.' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'description', label: 'Description' },
  { key: 'costImpact', label: 'Cost Impact', type: 'number' }, { key: 'scheduleImpact', label: 'Schedule Impact' },
  { key: 'status', label: 'Status', options: [{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }] },
  { key: 'approvedDate', label: 'Approved Date', type: 'date' },
]} />;

export const DocumentsPage = () => <GenericModule title="Documents" description="Upload and manage project documents" fields={[
  { key: 'filename', label: 'Filename' }, { key: 'version', label: 'Version' }, { key: 'dateUploaded', label: 'Date Uploaded', type: 'date' },
  { key: 'type', label: 'Type', options: [{ value: 'drawing', label: 'Drawing' }, { value: 'spec', label: 'Specification' }, { value: 'report', label: 'Report' }, { value: 'letter', label: 'Letter' }] },
  { key: 'status', label: 'Status', options: [{ value: 'draft', label: 'Draft' }, { value: 'approved', label: 'Approved' }, { value: 'superseded', label: 'Superseded' }] },
  { key: 'linkedTo', label: 'Linked To' },
]} />;

export const ReportsPage = () => <GenericModule title="Reports" description="Generate printable reports for each module" fields={[
  { key: 'reportName', label: 'Report Name' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'module', label: 'Module' },
  { key: 'generatedBy', label: 'Generated By' },
  { key: 'status', label: 'Status', options: [{ value: 'draft', label: 'Draft' }, { value: 'final', label: 'Final' }] },
]} />;

export const BackupPage = () => <GenericModule title="Backup / Restore" description="Export and import project data" fields={[
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'type', label: 'Type', options: [{ value: 'full', label: 'Full Backup' }, { value: 'partial', label: 'Partial' }] },
  { key: 'size', label: 'Size' },
  { key: 'status', label: 'Status', options: [{ value: 'success', label: 'Success' }, { value: 'failed', label: 'Failed' }] },
  { key: 'notes', label: 'Notes' },
]} />;

export const HelpPage = () => (
  <div>
    <div className="page-header">
      <h1 className="text-2xl font-bold text-foreground">User Manual</h1>
      <p className="text-sm text-muted-foreground mt-1">Built-in help and documentation</p>
    </div>
    <div className="bg-card rounded-xl border shadow-sm p-8 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Getting Started</h2>
        <p className="text-sm text-muted-foreground">BuildForge is a comprehensive construction project management tool. Use the sidebar to navigate between modules. Each module supports Add, Edit, Delete operations and Excel Import/Export.</p>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Key Features</h2>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          <li><strong>Activities (CPM)</strong> – Gantt chart + CPM network diagram with critical path, float, and warnings</li>
          <li><strong>AI Assistant</strong> – Automated critical path analysis, schedule optimization</li>
          <li><strong>BOQ / Items</strong> – Bill of quantities with progress tracking and budget analysis</li>
          <li><strong>Manpower</strong> – Dropdown selection for 35+ construction trades with per-trade counts</li>
          <li><strong>Equipment</strong> – 45+ equipment types with hourly/daily/monthly billing and cost tracking</li>
          <li><strong>Concrete Pour</strong> – 30+ international concrete grades (BS/EN/IS standards)</li>
          <li><strong>Photos</strong> – Direct upload from local PC with grid gallery view</li>
          <li><strong>Print Reports</strong> – International standard format with letterhead, signatures, and stamp</li>
          <li><strong>Cross-module linking</strong> – BOQ items linked in POs, Daily Qty; Equipment linked in Fuel Log</li>
          <li><strong>Undo / Clear / Select</strong> – Every module has Undo, Clear All, and batch delete</li>
          <li><strong>Excel Import/Export</strong> – Import data from .xlsx/.csv files and export to Excel</li>
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Print Reports</h2>
        <p className="text-sm text-muted-foreground">Click the Print Report button on any major module to generate a professional A4 landscape report with your company letterhead, project details, signature blocks, and company stamp. Configure these in Settings.</p>
      </div>
    </div>
  </div>
);

// Settings page moved to src/components/SettingsPage.tsx
