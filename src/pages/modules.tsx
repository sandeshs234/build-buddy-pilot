import { useState, useRef } from 'react';
import { useProjectData } from '@/context/ProjectDataContext';
import ModulePage from '@/components/ModulePage';
import PrintableReport from '@/components/PrintableReport';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Undo2, Trash2, ImagePlus, X, HelpCircle, ChevronDown, Printer } from 'lucide-react';
import { EquipmentEntry } from '@/types/construction';
import { cn } from '@/lib/utils';

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

// ─── Shared toolbar ───
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
  const { inventory: data, inventoryOps: ops } = useProjectData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <>
      <ModulePage
        title="Inventory"
        description={`Track stock levels, receipts, and issues · ${data.length} items`}
        columns={[
          { key: 'code', label: 'Code', render: i => <span className="font-mono text-xs font-medium">{i.code}</span> },
          { key: 'description', label: 'Description', render: i => <span className="font-medium">{i.description}</span> },
          { key: 'unit', label: 'Unit' },
          { key: 'requiredQty', label: 'Required', render: i => (
            <span className="text-right font-mono block font-medium text-primary">{i.requiredQty ? i.requiredQty.toLocaleString() : '—'}</span>
          )},
          { key: 'opening', label: 'Opening', render: i => <span className="text-right font-mono block">{i.opening}</span> },
          { key: 'receipts', label: 'Receipts', render: i => <span className="text-right font-mono block">{i.receipts}</span> },
          { key: 'issues', label: 'Issues', render: i => <span className="text-right font-mono block">{i.issues}</span> },
          { key: 'balance', label: 'Balance', render: i => (
            <span className={`text-right font-mono font-medium block ${i.balance <= i.minLevel ? 'text-destructive' : ''}`}>{i.balance}</span>
          )},
          { key: 'shortage', label: 'Shortage', render: i => {
            const shortage = (i.requiredQty || 0) - i.balance;
            return shortage > 0
              ? <span className="text-right font-mono font-medium block text-destructive">{shortage.toLocaleString()}</span>
              : <span className="text-right font-mono block text-muted-foreground">—</span>;
          }},
          { key: 'minLevel', label: 'Min Level', render: i => <span className="text-right font-mono block">{i.minLevel}</span> },
          { key: 'status', label: 'Status', render: i => {
            const shortage = (i.requiredQty || 0) - i.balance;
            if (shortage > 0) return <span className="badge-critical">Short {Math.round((shortage / (i.requiredQty || 1)) * 100)}%</span>;
            if (i.balance <= i.minLevel) return <span className="badge-warning">Low Stock</span>;
            return <span className="badge-success">OK</span>;
          }},
          { key: 'location', label: 'Location' },
        ]}
        data={data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), code: '', description: '', unit: '', opening: 0, receipts: 0, issues: 0, balance: 0, minLevel: 0, location: '' }); setEditing(null); setDialogOpen(true); }}
        onEdit={item => { setForm(item); setEditing(item); setDialogOpen(true); }}
        onDelete={item => ops.remove(item.id)}
        fileName="Inventory"
        extraToolbar={
          <CrudToolbar canUndo={ops.canUndo} onUndo={ops.undo} onClear={ops.clearAll} dataLength={data.length}
            printBtn={<PrintableReport title="Inventory" columns={[
              { key: 'code', label: 'Code' }, { key: 'description', label: 'Description' }, { key: 'unit', label: 'Unit' },
              { key: 'opening', label: 'Opening' }, { key: 'receipts', label: 'Receipts' }, { key: 'issues', label: 'Issues' },
              { key: 'balance', label: 'Balance' }, { key: 'minLevel', label: 'Min Level' }, { key: 'location', label: 'Location' },
            ]} data={data} />}
          />
        }
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Inventory Item</DialogTitle></DialogHeader>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { const bal = (form.opening || 0) + (form.receipts || 0) - (form.issues || 0); ops.save({ ...form, balance: bal }); setDialogOpen(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Manpower ───
export function ManpowerPage() {
  const { manpower: data, manpowerOps: ops } = useProjectData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const addTradeRow = () => u('trades', [...(form.trades || []), { trade: '', count: 0 }]);
  const updateTrade = (idx: number, field: string, val: any) => {
    const trades = [...(form.trades || [])];
    trades[idx] = { ...trades[idx], [field]: val };
    u('trades', trades);
  };
  const removeTrade = (idx: number) => u('trades', (form.trades || []).filter((_: any, i: number) => i !== idx));
  const totalWorkers = (item: any) => (item.trades || []).reduce((s: number, t: any) => s + (t.count || 0), 0);

  return (
    <>
      <ModulePage
        title="Daily Manpower"
        description={`Track labor by trade and location · ${data.length} entries`}
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
        data={data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], location: '', trades: [{ trade: '', count: 0 }], supervisor: '' }); setEditing(null); setDialogOpen(true); }}
        onEdit={item => { setForm(item); setEditing(item); setDialogOpen(true); }}
        onDelete={item => ops.remove(item.id)}
        fileName="Manpower"
        extraToolbar={
          <CrudToolbar canUndo={ops.canUndo} onUndo={ops.undo} onClear={ops.clearAll} dataLength={data.length}
            printBtn={<PrintableReport title="Daily Manpower" columns={[
              { key: 'date', label: 'Date' }, { key: 'location', label: 'Location' },
              { key: 'tradesText', label: 'Trades & Count' }, { key: 'total', label: 'Total' }, { key: 'supervisor', label: 'Supervisor' },
            ]} data={data.map(i => ({
              ...i, tradesText: (i.trades || []).map((t: any) => `${t.trade}: ${t.count}`).join(', '), total: totalWorkers(i),
            }))} />}
          />
        }
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Manpower Entry</DialogTitle></DialogHeader>
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
                      <SelectContent>{MANPOWER_TRADES.map(tr => <SelectItem key={tr} value={tr}>{tr}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" className="w-20" value={t.count || 0} onChange={e => updateTrade(idx, 'count', +e.target.value)} />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeTrade(idx)}><X size={14} /></Button>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm font-medium text-muted-foreground">Total: <span className="text-foreground font-bold">{totalWorkers(form)}</span> workers</div>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>Supervisor</Label><Input value={form.supervisor || ''} onChange={e => u('supervisor', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { ops.save(form); setDialogOpen(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Equipment ───
export function EquipmentPage() {
  const { equipment: data, equipmentOps: ops } = useProjectData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const totalCost = (i: any) => {
    const rate = i.rate || 0;
    if (i.billingBasis === 'daily' || i.billingBasis === 'monthly') return rate;
    return rate * (i.hours || 0);
  };

  return (
    <>
      <ModulePage
        title="Equipment Log"
        description={`Record equipment usage, hours, fuel · ${data.length} entries`}
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
        data={data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], eqId: '', equipmentName: '', description: '', operator: '', ownership: 'owned', billingBasis: 'hourly', rate: 0, hours: 0, fuel: 0, activity: '', issues: '' }); setEditing(null); setDialogOpen(true); }}
        onEdit={item => { setForm(item); setEditing(item); setDialogOpen(true); }}
        onDelete={item => ops.remove(item.id)}
        fileName="Equipment"
        extraToolbar={
          <CrudToolbar canUndo={ops.canUndo} onUndo={ops.undo} onClear={ops.clearAll} dataLength={data.length}
            printBtn={<PrintableReport title="Equipment Log" columns={[
              { key: 'date', label: 'Date' }, { key: 'eqId', label: 'Eq ID' }, { key: 'equipmentName', label: 'Equipment' },
              { key: 'operator', label: 'Operator' }, { key: 'ownership', label: 'Ownership' },
              { key: 'billingBasis', label: 'Billing' }, { key: 'rate', label: 'Rate' },
              { key: 'hours', label: 'Hours' }, { key: 'fuel', label: 'Fuel (L)' }, { key: 'activity', label: 'Activity' },
            ]} data={data} />}
          />
        }
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Equipment Entry</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date || ''} onChange={e => u('date', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Equipment ID</Label><Input value={form.eqId || ''} onChange={e => u('eqId', e.target.value)} placeholder="e.g. EQ-005" /></div>
            <div className="col-span-2 space-y-1.5">
              <Label>Equipment Type</Label>
              <Select value={form.equipmentName || ''} onValueChange={v => u('equipmentName', v)}>
                <SelectTrigger><SelectValue placeholder="Select equipment type" /></SelectTrigger>
                <SelectContent className="max-h-60">{EQUIPMENT_TYPES.map(eq => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}</SelectContent>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { ops.save(form); setDialogOpen(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Safety ───
export function SafetyPage() {
  const { safety: data, safetyOps: ops } = useProjectData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <>
      <ModulePage
        title="Safety Incidents"
        description={`Record incidents, near-misses, and observations · ${data.length} records`}
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
        data={data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], type: 'observation', location: '', description: '', injured: '', cause: '', preventive: '', reporter: '' }); setEditing(null); setDialogOpen(true); }}
        onEdit={item => { setForm(item); setEditing(item); setDialogOpen(true); }}
        onDelete={item => ops.remove(item.id)}
        fileName="Safety"
        extraToolbar={
          <CrudToolbar canUndo={ops.canUndo} onUndo={ops.undo} onClear={ops.clearAll} dataLength={data.length}
            printBtn={<PrintableReport title="Safety Incidents" columns={[
              { key: 'date', label: 'Date' }, { key: 'type', label: 'Type' }, { key: 'location', label: 'Location' },
              { key: 'description', label: 'Description' }, { key: 'cause', label: 'Root Cause' },
              { key: 'preventive', label: 'Preventive Action' }, { key: 'reporter', label: 'Reporter' },
            ]} data={data} />}
          />
        }
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Safety Record</DialogTitle></DialogHeader>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { ops.save(form); setDialogOpen(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Delays ───
export function DelaysPage() {
  const { delays: data, delaysOps: ops } = useProjectData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <>
      <ModulePage
        title="Delays Register"
        description={`Track delays, causes, and recovery · ${data.length} entries`}
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
        data={data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], activity: '', description: '', cause: '', duration: 0, impact: '', recovery: '', status: 'open' }); setEditing(null); setDialogOpen(true); }}
        onEdit={item => { setForm(item); setEditing(item); setDialogOpen(true); }}
        onDelete={item => ops.remove(item.id)}
        fileName="Delays"
        extraToolbar={
          <CrudToolbar canUndo={ops.canUndo} onUndo={ops.undo} onClear={ops.clearAll} dataLength={data.length}
            printBtn={<PrintableReport title="Delays Register" columns={[
              { key: 'date', label: 'Date' }, { key: 'activity', label: 'Activity' }, { key: 'description', label: 'Description' },
              { key: 'cause', label: 'Cause' }, { key: 'duration', label: 'Days' }, { key: 'impact', label: 'Impact' },
              { key: 'recovery', label: 'Recovery' }, { key: 'status', label: 'Status' },
            ]} data={data} />}
          />
        }
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Delay Entry</DialogTitle></DialogHeader>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { ops.save(form); setDialogOpen(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Purchase Orders (linked to BOQ) ───
export function PurchaseOrdersPage() {
  const { purchaseOrders: data, poOps: ops, boqItems, inventory } = useProjectData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const [generating, setGenerating] = useState(false);

  const generateFromShortages = async () => {
    setGenerating(true);
    try {
      // Find inventory items with shortages (requiredQty > balance)
      const shortages = inventory.filter(item => {
        const required = (item as any).requiredQty || item.minLevel || 0;
        const shortage = required - item.balance;
        return shortage > 0;
      });

      if (shortages.length === 0) {
        toast({ title: 'No Shortages', description: 'All inventory items have sufficient stock. Run AI analysis on BOQ first to populate required quantities.' });
        setGenerating(false);
        return;
      }

      // Fetch procurement tracking data for supplier info
      const { data: procData } = await supabase.from('procurement_tracking').select('*');
      const procMap: Record<string, { supplier: string; unit_rate: number }> = {};
      (procData || []).forEach((p: any) => {
        procMap[p.material_code] = { supplier: p.supplier, unit_rate: p.unit_rate };
      });

      const existingCodes = new Set(data.map(po => po.itemCode));
      const newPOs: any[] = [];
      let poCounter = data.length + 1;

      shortages.forEach(item => {
        // Skip if PO already exists for this item code
        if (existingCodes.has(item.code)) return;

        const required = (item as any).requiredQty || item.minLevel || 0;
        const shortage = Math.max(0, required - item.balance);
        if (shortage <= 0) return;

        const procInfo = procMap[item.code];
        const supplier = procInfo?.supplier || '';
        const unitRate = procInfo?.unit_rate || 0;

        newPOs.push({
          id: crypto.randomUUID(),
          poNo: `PO-AUTO-${String(poCounter++).padStart(4, '0')}`,
          supplier,
          date: new Date().toISOString().split('T')[0],
          itemCode: item.code,
          qty: shortage,
          price: shortage * unitRate,
          status: 'draft' as const,
          remarks: `Auto-generated from shortage: Need ${required}, Have ${item.balance}, Short ${shortage} ${item.unit}`,
        });
      });

      if (newPOs.length === 0) {
        toast({ title: 'No New POs', description: 'POs already exist for all shortage items.' });
      } else {
        newPOs.forEach(po => ops.save(po));
        toast({ title: 'POs Generated', description: `${newPOs.length} purchase orders created from inventory shortages.` });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to generate POs.', variant: 'destructive' });
    }
    setGenerating(false);
  };

  return (
    <>
      <ModulePage
        title="Purchase Orders"
        description={`Track POs, suppliers, and delivery · ${data.length} orders`}
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
        data={data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), poNo: '', supplier: '', date: new Date().toISOString().split('T')[0], itemCode: '', qty: 0, price: 0, status: 'draft', remarks: '' }); setEditing(null); setDialogOpen(true); }}
        onEdit={item => { setForm(item); setEditing(item); setDialogOpen(true); }}
        onDelete={item => ops.remove(item.id)}
        fileName="PurchaseOrders"
        extraToolbar={
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={generateFromShortages} disabled={generating} className="border-primary/30 text-primary hover:bg-primary/10">
              {generating ? <><RefreshCw size={14} className="mr-1 animate-spin" /> Generating...</> : <><ArrowDownToLine size={14} className="mr-1" /> Generate from Shortages</>}
            </Button>
            <CrudToolbar canUndo={ops.canUndo} onUndo={ops.undo} onClear={ops.clearAll} dataLength={data.length}
              printBtn={<PrintableReport title="Purchase Orders" columns={[
                { key: 'poNo', label: 'PO No.' }, { key: 'date', label: 'Date' }, { key: 'supplier', label: 'Supplier' },
                { key: 'itemCode', label: 'Item Code' }, { key: 'qty', label: 'Qty' }, { key: 'price', label: 'Amount' },
                { key: 'status', label: 'Status' }, { key: 'remarks', label: 'Remarks' },
              ]} data={data} />}
            />
          </div>
        }
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Purchase Order</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5"><Label>PO Number</Label><Input value={form.poNo || ''} onChange={e => u('poNo', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date || ''} onChange={e => u('date', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Supplier</Label><Input value={form.supplier || ''} onChange={e => u('supplier', e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>BOQ Item Code</Label>
              <Select value={form.itemCode || ''} onValueChange={v => u('itemCode', v)}>
                <SelectTrigger><SelectValue placeholder="Select BOQ item" /></SelectTrigger>
                <SelectContent>{boqItems.map(b => (
                  <SelectItem key={b.id} value={b.code}>{b.code} – {b.description}</SelectItem>
                ))}</SelectContent>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { ops.save(form); setDialogOpen(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Generic Module (for remaining tabs) ───
function GenericModule({ title, description, fields }: { title: string; description: string; fields: { key: string; label: string; type?: string; options?: { value: string; label: string }[] }[] }) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [history, setHistory] = useState<Record<string, any>[][]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const pushHistory = (current: Record<string, any>[]) => setHistory(prev => [...prev.slice(-20), current]);
  const openAdd = () => { setEditing(null); setForm({ id: crypto.randomUUID(), ...Object.fromEntries(fields.map(f => [f.key, ''])) }); setDialogOpen(true); };
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
    toast({ title: 'Undone' });
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
                    <SelectContent className="max-h-60">{f.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
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

// ─── Daily Quantity (linked to BOQ) ───
export function DailyQuantityPage() {
  const { boqItems } = useProjectData();
  return <GenericModule title="Daily Quantity" description="Enter executed quantities per BOQ item" fields={[
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'boqCode', label: 'BOQ Code', options: boqItems.map(b => ({ value: b.code, label: `${b.code} – ${b.description}` })) },
    { key: 'description', label: 'Description' },
    { key: 'quantity', label: 'Quantity', type: 'number' },
    { key: 'unit', label: 'Unit' },
    { key: 'location', label: 'Location' },
    { key: 'remarks', label: 'Remarks' },
  ]} />;
}

// ─── Fuel Log (linked to Equipment) ───
export function FuelLogPage() {
  const { equipment } = useProjectData();
  const equipmentOptions = equipment.map(e => ({ value: `${e.eqId} - ${e.equipmentName}`, label: `${e.eqId} - ${e.equipmentName}` }));

  return <GenericModule title="Fuel Log" description="Track fuel receipts, issues, and balance" fields={[
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'type', label: 'Fuel Type', options: [{ value: 'diesel', label: 'Diesel' }, { value: 'petrol', label: 'Petrol' }, { value: 'lpg', label: 'LPG' }] },
    { key: 'receipt', label: 'Receipt (L)', type: 'number' },
    { key: 'issued', label: 'Issued (L)', type: 'number' },
    { key: 'issuedTo', label: 'Issued To (Equipment)', options: equipmentOptions },
    { key: 'balance', label: 'Balance', type: 'number' },
    { key: 'remarks', label: 'Remarks' },
  ]} />;
}

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

export const QualityPage = () => <GenericModule title="Quality (ITP/NCR)" description="Inspection test plans and non-conformance reports" fields={[
  { key: 'testId', label: 'Test ID' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'location', label: 'Location' },
  { key: 'type', label: 'Type', options: [{ value: 'ITP', label: 'ITP' }, { value: 'NCR', label: 'NCR' }, { value: 'MIR', label: 'MIR' }] },
  { key: 'spec', label: 'Specification' },
  { key: 'result', label: 'Result', options: [{ value: 'pass', label: 'Pass' }, { value: 'fail', label: 'Fail' }, { value: 'pending', label: 'Pending' }] },
  { key: 'status', label: 'Status', options: [{ value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }] },
  { key: 'testedBy', label: 'Tested By' },
]} />;

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

// ─── Photos ───
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
          id: crypto.randomUUID(), fileName: file.name,
          date: new Date().toISOString().split('T')[0],
          size: (file.size / 1024).toFixed(1) + ' KB',
          location: '', description: '', takenBy: '',
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
    toast({ title: 'Cleared' });
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
          <Button size="sm" onClick={() => fileRef.current?.click()}><ImagePlus size={14} className="mr-1" /> Upload Photos</Button>
        </div>
      </div>
      {photos.length === 0 ? (
        <div className="bg-card rounded-xl border shadow-sm p-12 text-center text-muted-foreground">No photos uploaded yet.</div>
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
                  onClick={() => { pushHistory(); setPhotos(prev => prev.filter(x => x.id !== p.id)); }}>Remove</Button>
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

export function ReportsPage() {
  const { activities, boqItems, inventory, equipment, safety, delays, purchaseOrders, manpower, fuelLog, concretePours, dailyQty } = useProjectData();
  const [selectedReports, setSelectedReports] = useState<Record<string, boolean>>({});

  const totalWorkers = (item: any) => (item.trades || []).reduce((s: number, t: any) => s + (t.count || 0), 0);

  const reportSections = [
    {
      title: 'Activities Schedule',
      columns: [
        { key: 'wbs', label: 'WBS' }, { key: 'name', label: 'Activity' }, { key: 'plannedStart', label: 'Plan Start' },
        { key: 'plannedEnd', label: 'Plan End' }, { key: 'percentComplete', label: 'Progress %' }, { key: 'status', label: 'Status' },
      ],
      data: activities.map(a => ({ ...a, critical: a.critical ? 'Yes' : 'No', actualStart: a.actualStart || '—', actualEnd: a.actualEnd || '—' })),
    },
    {
      title: 'BOQ / Item Master',
      columns: [
        { key: 'code', label: 'Code' }, { key: 'description', label: 'Description' }, { key: 'unit', label: 'Unit' },
        { key: 'totalQty', label: 'Total Qty' }, { key: 'executedQty', label: 'Executed' }, { key: 'rate', label: 'Rate' },
        { key: 'amount', label: 'Amount' },
      ],
      data: boqItems.map(b => ({ ...b, amount: (b.totalQty * b.rate).toLocaleString() })),
    },
    {
      title: 'Inventory',
      columns: [
        { key: 'code', label: 'Code' }, { key: 'description', label: 'Description' }, { key: 'unit', label: 'Unit' },
        { key: 'opening', label: 'Opening' }, { key: 'receipts', label: 'Receipts' }, { key: 'issues', label: 'Issues' },
        { key: 'balance', label: 'Balance' }, { key: 'location', label: 'Location' },
      ],
      data: inventory,
    },
    {
      title: 'Equipment Log',
      columns: [
        { key: 'date', label: 'Date' }, { key: 'eqId', label: 'Eq ID' }, { key: 'equipmentName', label: 'Equipment' },
        { key: 'operator', label: 'Operator' }, { key: 'hours', label: 'Hours' }, { key: 'fuel', label: 'Fuel (L)' },
        { key: 'activity', label: 'Activity' },
      ],
      data: equipment,
    },
    {
      title: 'Daily Manpower',
      columns: [
        { key: 'date', label: 'Date' }, { key: 'location', label: 'Location' },
        { key: 'tradesText', label: 'Trades' }, { key: 'total', label: 'Total' }, { key: 'supervisor', label: 'Supervisor' },
      ],
      data: manpower.map((i: any) => ({
        ...i,
        tradesText: (i.trades || []).map((t: any) => `${t.trade}: ${t.count}`).join(', '),
        total: totalWorkers(i),
      })),
    },
    {
      title: 'Safety Incidents',
      columns: [
        { key: 'date', label: 'Date' }, { key: 'type', label: 'Type' }, { key: 'location', label: 'Location' },
        { key: 'description', label: 'Description' }, { key: 'cause', label: 'Root Cause' }, { key: 'preventive', label: 'Preventive Action' },
      ],
      data: safety,
    },
    {
      title: 'Delays Register',
      columns: [
        { key: 'date', label: 'Date' }, { key: 'activity', label: 'Activity' }, { key: 'description', label: 'Description' },
        { key: 'cause', label: 'Cause' }, { key: 'duration', label: 'Days' }, { key: 'status', label: 'Status' },
      ],
      data: delays,
    },
    {
      title: 'Purchase Orders',
      columns: [
        { key: 'poNo', label: 'PO No.' }, { key: 'date', label: 'Date' }, { key: 'supplier', label: 'Supplier' },
        { key: 'itemCode', label: 'Item' }, { key: 'qty', label: 'Qty' }, { key: 'price', label: 'Amount' }, { key: 'status', label: 'Status' },
      ],
      data: purchaseOrders,
    },
    {
      title: 'Daily Quantity',
      columns: [
        { key: 'date', label: 'Date' }, { key: 'boqCode', label: 'BOQ Code' }, { key: 'description', label: 'Description' },
        { key: 'qty', label: 'Qty' }, { key: 'unit', label: 'Unit' }, { key: 'location', label: 'Location' },
      ],
      data: dailyQty,
    },
    {
      title: 'Fuel Log',
      columns: [
        { key: 'date', label: 'Date' }, { key: 'equipment', label: 'Equipment' }, { key: 'liters', label: 'Liters' },
        { key: 'cost', label: 'Cost' }, { key: 'odometer', label: 'Odometer' }, { key: 'remarks', label: 'Remarks' },
      ],
      data: fuelLog,
    },
    {
      title: 'Concrete Pours',
      columns: [
        { key: 'date', label: 'Date' }, { key: 'location', label: 'Location' }, { key: 'grade', label: 'Grade' },
        { key: 'volume', label: 'Volume (m³)' }, { key: 'supplier', label: 'Supplier' }, { key: 'slump', label: 'Slump' },
      ],
      data: concretePours,
    },
  ];

  const selectedCount = Object.values(selectedReports).filter(Boolean).length;
  const allSelected = selectedCount === reportSections.length;

  const toggleReport = (title: string) => {
    setSelectedReports(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedReports({});
    } else {
      const all: Record<string, boolean> = {};
      reportSections.forEach(s => { all[s.title] = true; });
      setSelectedReports(all);
    }
  };

  const handlePrintSelected = () => {
    const sections = reportSections.filter(s => selectedReports[s.title] && s.data.length > 0);
    if (sections.length === 0) {
      toast({ title: 'No reports selected', description: 'Please select at least one report with data to print.', variant: 'destructive' });
      return;
    }

    const settings = JSON.parse(localStorage.getItem('buildforge-settings') || '{}');
    const logo = localStorage.getItem('buildforge-logo') || '';
    const stamp = localStorage.getItem('buildforge-stamp') || '';
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const docRef = `COMPILED-${Date.now().toString(36).toUpperCase()}`;

    const buildTable = (section: typeof sections[0]) => `
      <div class="report-section" style="page-break-before: always;">
        <div class="report-title">${section.title}</div>
        <div class="report-subtitle">Total Records: ${section.data.length} · Generated: ${new Date().toLocaleString('en-GB')}</div>
        <table>
          <thead><tr><th style="width:30px">#</th>${section.columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
          <tbody>${section.data.map((row, i) => `<tr><td style="text-align:center;color:#888;font-size:7pt">${i + 1}</td>${section.columns.map(c => `<td>${row[c.key] ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        <div class="summary-row"><span>End of ${section.title} — ${section.data.length} record(s)</span></div>
      </div>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Compiled Reports</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; padding: 12mm 15mm; font-size: 9pt; }
  .header { text-align: center; padding-bottom: 10px; margin-bottom: 8px; }
  .header-logo img { max-height: 60px; max-width: 160px; }
  .company-name { font-size: 20pt; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #1a1a2e; }
  .company-tagline { font-size: 9pt; font-weight: 600; color: #444; letter-spacing: 1px; margin-top: 2px; }
  .company-contact { font-size: 7.5pt; color: #666; margin-top: 4px; }
  .header-line { height: 2px; background: linear-gradient(90deg, transparent, #1a1a2e, transparent); margin: 8px 0; }
  .project-info { display: flex; justify-content: space-between; font-size: 8pt; color: #444; margin-bottom: 6px; padding: 6px 0; }
  .project-info .left, .project-info .right { display: flex; flex-direction: column; gap: 2px; }
  .project-info .right { text-align: right; }
  .project-info strong { color: #1a1a2e; font-weight: 700; }
  .report-title { font-size: 13pt; font-weight: 800; text-align: center; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; margin: 6px 0 4px; }
  .report-subtitle { text-align: center; font-size: 8pt; color: #666; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { background: #1a1a2e; color: #fff; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 5px 6px; text-align: left; }
  th:first-child { border-radius: 3px 0 0 0; } th:last-child { border-radius: 0 3px 0 0; }
  td { padding: 4px 6px; font-size: 8pt; border-bottom: 0.5px solid #e8e8e8; }
  tr:nth-child(even) { background: #f9fafb; }
  .summary-row { margin-top: 8px; font-size: 8pt; color: #555; display: flex; justify-content: space-between; }
  .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding: 0 20px; }
  .sig-block { text-align: center; min-width: 120px; }
  .sig-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 4px; font-size: 7.5pt; font-weight: 600; color: #444; text-transform: uppercase; }
  .sig-role { font-size: 7pt; color: #888; margin-top: 1px; }
  .footer { margin-top: 20px; padding-top: 8px; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-size: 7pt; color: #888; }
  .footer-stamp img { max-height: 55px; opacity: 0.6; }
  .report-section:first-of-type { page-break-before: avoid; }
  @media print { body { padding: 8mm 12mm; } @page { size: A4 landscape; margin: 8mm; } }
</style></head><body>
  <div class="header">
    ${logo ? `<div class="header-logo"><img src="${logo}" /></div>` : ''}
    <div class="company-name">${settings.companyName || 'BuildForge Engineering'}</div>
    <div class="company-tagline">${settings.companyTagline || 'Construction Project Management'}</div>
    <div class="company-contact">${[settings.companyAddress, settings.companyPhone, settings.companyEmail].filter(Boolean).join('  ·  ')}</div>
    <div class="header-line"></div>
  </div>
  <div class="project-info">
    <div class="left">
      <div><strong>Project:</strong> ${settings.projectName || 'Construction Project'}</div>
      <div><strong>Client:</strong> ${settings.clientName || '—'}</div>
      <div><strong>Contractor:</strong> ${settings.contractorName || settings.companyName || '—'}</div>
    </div>
    <div class="right">
      <div><strong>Contract No:</strong> ${settings.contractNo || '—'}</div>
      <div><strong>Report Date:</strong> ${today}</div>
      <div><strong>Doc Ref:</strong> ${docRef}</div>
      <div><strong>Reports:</strong> ${sections.length} of ${reportSections.length}</div>
    </div>
  </div>
  ${sections.map(s => buildTable(s)).join('')}
  <div class="signatures" style="page-break-before: always; margin-top: 60px;">
    <div class="sig-block"><div class="sig-line">Prepared By</div><div class="sig-role">Name / Date / Signature</div></div>
    <div class="sig-block"><div class="sig-line">Checked By</div><div class="sig-role">Name / Date / Signature</div></div>
    <div class="sig-block"><div class="sig-line">Approved By</div><div class="sig-role">Name / Date / Signature</div></div>
  </div>
  <div class="footer">
    <div class="footer-left">
      <div>${settings.companyName || 'BuildForge Engineering'} — Confidential</div>
      <div>${docRef}</div>
    </div>
    ${stamp ? `<div class="footer-stamp"><img src="${stamp}" /></div>` : ''}
  </div>
</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  return (
    <div>
      <div className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📊 Compiled Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Select reports and print individually or as a combined document</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {allSelected ? 'Deselect All' : 'Select All'}
          </Button>
          <Button size="sm" onClick={handlePrintSelected} disabled={selectedCount === 0}>
            <Printer size={14} className="mr-1.5" />
            {selectedCount === 0 ? 'Print Selected' : selectedCount === reportSections.length ? 'Print All Reports' : `Print ${selectedCount} Report${selectedCount > 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportSections.map(section => (
          <div
            key={section.title}
            className={cn(
              'bg-card rounded-xl border shadow-sm p-5 flex flex-col justify-between cursor-pointer transition-all',
              selectedReports[section.title] ? 'ring-2 ring-primary border-primary' : 'hover:border-muted-foreground/30'
            )}
            onClick={() => toggleReport(section.title)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">{section.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{section.data.length} records available</p>
              </div>
              <div className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                selectedReports[section.title] ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'
              )}>
                {selectedReports[section.title] && <span className="text-xs font-bold">✓</span>}
              </div>
            </div>
            <div className="mt-4" onClick={(e) => e.stopPropagation()}>
              <PrintableReport title={section.title} columns={section.columns} data={section.data} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-muted/50 rounded-xl border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">Report Format</h3>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <strong>A4 Landscape</strong> – International standard print format</li>
          <li>• <strong>Bold Centered Letterhead</strong> – Company name, logo, contact details</li>
          <li>• <strong>Project Details</strong> – Client, contractor, contract number, report date</li>
          <li>• <strong>Signature Blocks</strong> – Prepared By / Checked By / Approved By</li>
          <li>• <strong>Company Stamp</strong> – Configure in Settings → Upload stamp image</li>
          <li>• Go to <strong>Settings</strong> to configure company logo, stamp, and project details</li>
        </ul>
      </div>
    </div>
  );
}

export const BackupPage = () => <GenericModule title="Backup / Restore" description="Export and import project data" fields={[
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'type', label: 'Type', options: [{ value: 'full', label: 'Full Backup' }, { value: 'partial', label: 'Partial' }] },
  { key: 'size', label: 'Size' },
  { key: 'status', label: 'Status', options: [{ value: 'success', label: 'Success' }, { value: 'failed', label: 'Failed' }] },
  { key: 'notes', label: 'Notes' },
]} />;

// ─── Help Page (Interactive) ───
const HELP_SECTIONS: { tab: string; sections: { title: string; content: string }[] }[] = [
  {
    tab: 'Dashboard',
    sections: [
      { title: 'Overview', content: 'The Dashboard shows real-time KPI cards for overall progress, manpower, critical activities, and open delays. All data auto-updates as you add/edit entries in other modules.' },
      { title: 'Charts', content: 'BOQ Progress chart shows executed vs remaining quantities. Activity Status pie chart breaks down task completion. Both update automatically from your data.' },
      { title: 'Budget Summary', content: 'Displays total budget (from BOQ), executed value, and equipment cost. All calculated from your actual entries.' },
    ],
  },
  {
    tab: 'Activities (CPM)',
    sections: [
      { title: 'Views', content: 'Switch between Gantt chart, Primavera P6 style schedule, CPM network diagram, and Table view using the toolbar buttons.' },
      { title: 'Gantt Chart', content: 'Shows planned bars with progress fill. Critical path items are highlighted in red. Click any bar to edit. Dependency arrows show predecessor relationships.' },
      { title: 'Primavera P6 View', content: 'Displays planned vs actual bars side by side, with variance calculation showing schedule performance. Data Date line marks today.' },
      { title: 'CPM Diagram', content: 'Network diagram calculating Early/Late Start & Finish, Total Float. Zero-float activities are on the critical path (highlighted red). Warnings appear for delays.' },
      { title: 'AI Assistant', content: 'Click "AI Assist" to analyze critical path, optimize schedule, or get recommendations. AI can auto-apply critical flags and dependencies.' },
      { title: 'Import/Export', content: 'Download the Activities template from Templates, fill your data, then use Import XLS. Export creates a formatted Excel file of your schedule.' },
    ],
  },
  {
    tab: 'BOQ / Items',
    sections: [
      { title: 'Adding Items', content: 'Click "Add Item" to enter code, description, unit, measure type, rate, total and executed quantities. The progress bar and budget auto-calculate.' },
      { title: 'Cross-Linking', content: 'BOQ items appear as dropdown options in Purchase Orders and Daily Quantity, preventing duplicate entry and maintaining data consistency.' },
      { title: 'Clear / Undo', content: 'Use "Clear All" to remove all items (with Undo support). Use Undo to revert the last 20 actions.' },
      { title: 'Budget Tracking', content: 'Footer shows total budget. Dashboard budget summary auto-updates from BOQ data.' },
    ],
  },
  {
    tab: 'Daily Manpower',
    sections: [
      { title: 'Adding Entries', content: 'Select date, location, then add trades from 35+ construction trade types using dropdown. Enter count per trade. Total calculates automatically.' },
      { title: 'Trade Dropdown', content: 'Includes: Mason, Carpenter, Steel Fixer, Welder, Electrician, Plumber, Crane Operator, Surveyor, HVAC Technician, and 25+ more. Staff roles are excluded.' },
      { title: 'Dashboard Link', content: 'Total manpower count appears on Dashboard KPI card, auto-updating as you add entries.' },
    ],
  },
  {
    tab: 'Equipment',
    sections: [
      { title: 'Equipment Types', content: '45+ equipment types including Excavator, Crane, Piling Rig, Concrete Pump, Forklift, Boom Lift, Asphalt Paver, TBM, and more.' },
      { title: 'Ownership & Billing', content: 'Select Owned/Leased/Rented for each equipment. Choose billing basis: Hourly, Daily, or Monthly. Enter rate for cost tracking.' },
      { title: 'Fuel Link', content: 'Equipment entries automatically appear as dropdown options in the Fuel Log for fuel issue tracking.' },
      { title: 'Cost Calculation', content: 'Cost = Rate × Hours (hourly) or just Rate (daily/monthly). Equipment costs appear on Dashboard.' },
    ],
  },
  {
    tab: 'Fuel Log',
    sections: [
      { title: 'Tracking', content: 'Record fuel receipts and issues. Select equipment from your Equipment Log entries for accurate allocation tracking.' },
      { title: 'Equipment Link', content: 'The "Issued To" dropdown dynamically shows all equipment from your Equipment tab. Add equipment first, then log fuel.' },
    ],
  },
  {
    tab: 'Concrete Pour',
    sections: [
      { title: 'Concrete Grades', content: '30+ international grades from C7/8 (M10) to C100 (M100), plus special types: Lean, Mass, SCC, Fiber Reinforced, Shotcrete, Underwater.' },
      { title: 'Pour Details', content: 'Record location, supplier, volume, slump, temperature, weather, test cubes, pour method, and structural element.' },
    ],
  },
  {
    tab: 'Purchase Orders',
    sections: [
      { title: 'BOQ Link', content: 'Select BOQ item code from dropdown when creating POs. Items come from your BOQ/Items tab.' },
      { title: 'Status Tracking', content: 'Track PO lifecycle: Draft → Issued → Delivered → Closed. Each status shows with color-coded badges.' },
    ],
  },
  {
    tab: 'Inventory',
    sections: [
      { title: 'Stock Management', content: 'Track opening balance, receipts, issues, and calculated balance. Low stock alerts when balance drops below minimum level.' },
      { title: 'Auto Balance', content: 'Balance = Opening + Receipts - Issues. Calculated automatically when saving.' },
    ],
  },
  {
    tab: 'Safety',
    sections: [
      { title: 'Recording', content: 'Log incidents, near-misses, and observations with location, root cause, and preventive actions.' },
      { title: 'Reporting', content: 'Print formatted safety reports with incident details for HSE compliance.' },
    ],
  },
  {
    tab: 'Delays Register',
    sections: [
      { title: 'Delay Tracking', content: 'Record delays with cause, duration, impact assessment, and recovery actions. Dashboard shows open delay count.' },
      { title: 'Status', content: 'Track delay status: Open → Mitigated → Closed.' },
    ],
  },
  {
    tab: 'Print Reports',
    sections: [
      { title: 'Format', content: 'International A4 landscape format with company logo, project details, numbered rows, and signature blocks (Prepared/Checked/Approved).' },
      { title: 'Setup', content: 'Go to Settings to upload company logo and stamp. These appear on all printed reports.' },
    ],
  },
  {
    tab: 'Templates',
    sections: [
      { title: 'Download', content: 'Pre-formatted Excel templates with correct headers and sample data for every module. Download, fill your data, then import.' },
      { title: 'Format', content: 'Keep headers exactly as shown. Use YYYY-MM-DD for dates. Follow sample data format for best results.' },
    ],
  },
  {
    tab: 'Settings',
    sections: [
      { title: 'Company Info', content: 'Enter company name, client, contractor, project details. This information appears on printed reports.' },
      { title: 'Logo & Stamp', content: 'Upload company logo and authorized stamp. These appear on report headers and footers.' },
    ],
  },
];

export function HelpPage() {
  const [selectedTab, setSelectedTab] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const tabData = HELP_SECTIONS.find(h => h.tab === selectedTab);
  const sectionData = tabData?.sections.find(s => s.title === selectedSection);

  return (
    <div>
      <div className="page-header">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <HelpCircle className="text-primary" size={24} /> Help & User Guide
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Select a module and section to learn how it works</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Select Tab */}
        <div className="bg-card rounded-xl border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">① Select Module</h2>
          <div className="space-y-1">
            {HELP_SECTIONS.map(h => (
              <button
                key={h.tab}
                onClick={() => { setSelectedTab(h.tab); setSelectedSection(''); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedTab === h.tab ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted text-foreground'
                }`}
              >
                {h.tab}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Section */}
        <div className="bg-card rounded-xl border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">② Select Section</h2>
          {!tabData ? (
            <p className="text-sm text-muted-foreground">← Select a module first</p>
          ) : (
            <div className="space-y-1">
              {tabData.sections.map(s => (
                <button
                  key={s.title}
                  onClick={() => setSelectedSection(s.title)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedSection === s.title ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted text-foreground'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Help Content */}
        <div className="bg-card rounded-xl border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">③ Help Details</h2>
          {!sectionData ? (
            <p className="text-sm text-muted-foreground">← Select a section to view help</p>
          ) : (
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">{selectedTab} → {sectionData.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{sectionData.content}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Reference */}
      <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-primary mb-3">Quick Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="text-xs text-muted-foreground"><strong className="text-foreground">Undo:</strong> Reverts the last action (up to 20 steps)</div>
          <div className="text-xs text-muted-foreground"><strong className="text-foreground">Clear All:</strong> Removes all data from the current tab</div>
          <div className="text-xs text-muted-foreground"><strong className="text-foreground">Import XLS:</strong> Upload Excel file to bulk-add records</div>
          <div className="text-xs text-muted-foreground"><strong className="text-foreground">Export XLS:</strong> Download current data as Excel file</div>
          <div className="text-xs text-muted-foreground"><strong className="text-foreground">Print:</strong> Generate formatted A4 report with letterhead</div>
          <div className="text-xs text-muted-foreground"><strong className="text-foreground">Templates:</strong> Download sample Excel files from sidebar</div>
        </div>
      </div>
    </div>
  );
}
