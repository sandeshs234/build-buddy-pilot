import { useState } from 'react';
import ModulePage from '@/components/ModulePage';
import { sampleInventory, sampleManpower, sampleEquipment, sampleSafety, sampleDelays, samplePOs } from '@/data/sampleData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

// ─── Generic CRUD wrapper ───
function useCrudState<T extends { id: string }>(initial: T[]) {
  const [data, setData] = useState<T[]>(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (item: T) => { setEditing(item); setDialogOpen(true); };
  const handleDelete = (item: T) => setData(prev => prev.filter(i => i.id !== item.id));
  const save = (item: T) => {
    setData(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = item; return copy; }
      return [...prev, item];
    });
    setDialogOpen(false);
  };
  const handleImport = (rows: Record<string, any>[], mapper: (row: Record<string, any>) => T) => {
    const mapped = rows.map(mapper);
    setData(prev => [...prev, ...mapped]);
  };

  return { data, dialogOpen, setDialogOpen, editing, openAdd, openEdit, handleDelete, save, handleImport };
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

// ─── Manpower ───
export function ManpowerPage() {
  const crud = useCrudState(sampleManpower);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <>
      <ModulePage
        title="Daily Manpower"
        description={`Track labor by trade and location · ${crud.data.length} entries`}
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'location', label: 'Location', render: i => <span className="font-medium">{i.location}</span> },
          { key: 'mason', label: 'Mason', render: i => <span className="text-center block font-mono">{i.mason}</span> },
          { key: 'carpenter', label: 'Carp.', render: i => <span className="text-center block font-mono">{i.carpenter}</span> },
          { key: 'steel', label: 'Steel', render: i => <span className="text-center block font-mono">{i.steel}</span> },
          { key: 'welder', label: 'Welder', render: i => <span className="text-center block font-mono">{i.welder}</span> },
          { key: 'operator', label: 'Opr.', render: i => <span className="text-center block font-mono">{i.operator}</span> },
          { key: 'skilled', label: 'Skilled', render: i => <span className="text-center block font-mono font-medium">{i.skilled}</span> },
          { key: 'unskilled', label: 'Unskilled', render: i => <span className="text-center block font-mono font-medium">{i.unskilled}</span> },
          { key: 'total', label: 'Total', render: i => <span className="text-center block font-mono font-bold">{i.skilled + i.unskilled}</span> },
          { key: 'supervisor', label: 'Supervisor' },
        ]}
        data={crud.data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], location: '', mason: 0, carpenter: 0, steel: 0, welder: 0, fitter: 0, electrician: 0, operator: 0, skilled: 0, unskilled: 0, supervisor: '' }); crud.openAdd(); }}
        onEdit={item => { setForm(item); crud.openEdit(item); }}
        onDelete={crud.handleDelete}
        onImport={rows => crud.handleImport(rows, r => ({
          id: crypto.randomUUID(), date: r.Date || r.date || '', location: r.Location || r.location || '',
          mason: +r.Mason || 0, carpenter: +r.Carpenter || 0, steel: +r.Steel || 0, welder: +r.Welder || 0,
          fitter: +r.Fitter || 0, electrician: +r.Electrician || 0, operator: +r.Operator || 0,
          skilled: +r.Skilled || 0, unskilled: +r.Unskilled || 0, supervisor: r.Supervisor || r.supervisor || '',
        }))}
        fileName="Manpower"
      />
      <Dialog open={crud.dialogOpen} onOpenChange={crud.setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{crud.editing ? 'Edit' : 'Add'} Manpower Entry</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date || ''} onChange={e => u('date', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location || ''} onChange={e => u('location', e.target.value)} /></div>
            {['mason', 'carpenter', 'steel', 'welder', 'fitter', 'electrician', 'operator'].map(f => (
              <div key={f} className="space-y-1.5"><Label className="capitalize">{f}</Label><Input type="number" value={form[f] || 0} onChange={e => u(f, +e.target.value)} /></div>
            ))}
            <div className="space-y-1.5"><Label>Skilled Total</Label><Input type="number" value={form.skilled || 0} onChange={e => u('skilled', +e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Unskilled Total</Label><Input type="number" value={form.unskilled || 0} onChange={e => u('unskilled', +e.target.value)} /></div>
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

// ─── Equipment ───
export function EquipmentPage() {
  const crud = useCrudState(sampleEquipment);
  const [form, setForm] = useState<any>({});
  const u = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  return (
    <>
      <ModulePage
        title="Equipment Log"
        description={`Record equipment usage, hours, fuel · ${crud.data.length} entries`}
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'eqId', label: 'Eq. ID', render: i => <span className="font-mono text-xs font-medium">{i.eqId}</span> },
          { key: 'description', label: 'Equipment', render: i => <span className="font-medium">{i.description}</span> },
          { key: 'operator', label: 'Operator' },
          { key: 'hours', label: 'Hours', render: i => <span className="font-mono">{i.hours}</span> },
          { key: 'fuel', label: 'Fuel (L)', render: i => <span className="font-mono">{i.fuel}</span> },
          { key: 'activity', label: 'Activity' },
          { key: 'issues', label: 'Issues', render: i => i.issues ? <span className="badge-warning">{i.issues}</span> : <span className="text-muted-foreground">—</span> },
        ]}
        data={crud.data}
        onAdd={() => { setForm({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], eqId: '', description: '', operator: '', hours: 0, fuel: 0, activity: '', issues: '' }); crud.openAdd(); }}
        onEdit={item => { setForm(item); crud.openEdit(item); }}
        onDelete={crud.handleDelete}
        onImport={rows => crud.handleImport(rows, r => ({
          id: crypto.randomUUID(), date: r.Date || '', eqId: r['Eq. ID'] || '', description: r.Equipment || r.description || '',
          operator: r.Operator || '', hours: +r.Hours || 0, fuel: +r['Fuel (L)'] || +r.fuel || 0,
          activity: r.Activity || '', issues: r.Issues || '',
        }))}
        fileName="Equipment"
      />
      <Dialog open={crud.dialogOpen} onOpenChange={crud.setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{crud.editing ? 'Edit' : 'Add'} Equipment Entry</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date || ''} onChange={e => u('date', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Equipment ID</Label><Input value={form.eqId || ''} onChange={e => u('eqId', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Description</Label><Input value={form.description || ''} onChange={e => u('description', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Operator</Label><Input value={form.operator || ''} onChange={e => u('operator', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Hours</Label><Input type="number" step="0.5" value={form.hours || 0} onChange={e => u('hours', +e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Fuel (L)</Label><Input type="number" value={form.fuel || 0} onChange={e => u('fuel', +e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Activity</Label><Input value={form.activity || ''} onChange={e => u('activity', e.target.value)} /></div>
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
      />
      <Dialog open={crud.dialogOpen} onOpenChange={crud.setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{crud.editing ? 'Edit' : 'Add'} Safety Record</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date || ''} onChange={e => u('date', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Type</Label><Input value={form.type || ''} onChange={e => u('type', e.target.value)} placeholder="incident / near-miss / observation" /></div>
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
            <div className="space-y-1.5"><Label>Status</Label><Input value={form.status || ''} onChange={e => u('status', e.target.value)} placeholder="open / mitigated / closed" /></div>
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

// ─── Purchase Orders ───
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
      />
      <Dialog open={crud.dialogOpen} onOpenChange={crud.setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{crud.editing ? 'Edit' : 'Add'} Purchase Order</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5"><Label>PO Number</Label><Input value={form.poNo || ''} onChange={e => u('poNo', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date || ''} onChange={e => u('date', e.target.value)} /></div>
            <div className="col-span-2 space-y-1.5"><Label>Supplier</Label><Input value={form.supplier || ''} onChange={e => u('supplier', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Item Code</Label><Input value={form.itemCode || ''} onChange={e => u('itemCode', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" value={form.qty || 0} onChange={e => u('qty', +e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Price</Label><Input type="number" value={form.price || 0} onChange={e => u('price', +e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Status</Label><Input value={form.status || ''} onChange={e => u('status', e.target.value)} placeholder="draft / issued / delivered / closed" /></div>
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
function GenericModule({ title, description, fields }: { title: string; description: string; fields: { key: string; label: string }[] }) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => {
    setEditing(null);
    setForm({ id: crypto.randomUUID(), ...Object.fromEntries(fields.map(f => [f.key, ''])) });
    setDialogOpen(true);
  };

  const openEdit = (item: Record<string, any>) => { setEditing(item); setForm(item); setDialogOpen(true); };

  const save = () => {
    setData(prev => {
      const idx = prev.findIndex(i => i.id === form.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = form; return copy; }
      return [...prev, form];
    });
    setDialogOpen(false);
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
        onDelete={item => setData(prev => prev.filter(i => i.id !== item.id))}
        onImport={rows => {
          const mapped = rows.map(r => ({ id: crypto.randomUUID(), ...r }));
          setData(prev => [...prev, ...mapped]);
        }}
        fileName={title.replace(/\s+/g, '_')}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} {title}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {fields.map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                <Input value={form[f.key] || ''} onChange={e => u(f.key, e.target.value)} />
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

export const DailyQuantityPage = () => <GenericModule title="Daily Quantity" description="Enter executed quantities per BOQ item" fields={[
  { key: 'date', label: 'Date' }, { key: 'boqCode', label: 'BOQ Code' }, { key: 'description', label: 'Description' },
  { key: 'quantity', label: 'Quantity' }, { key: 'unit', label: 'Unit' }, { key: 'location', label: 'Location' }, { key: 'remarks', label: 'Remarks' },
]} />;

export const BillsPage = () => <GenericModule title="Bills" description="Record supplier bills with payment status" fields={[
  { key: 'billNo', label: 'Bill No.' }, { key: 'date', label: 'Date' }, { key: 'supplier', label: 'Supplier' },
  { key: 'poRef', label: 'PO Ref' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }, { key: 'remarks', label: 'Remarks' },
]} />;

export const StaffPage = () => <GenericModule title="Key Staff" description="Project personnel – engineers, managers, accountants" fields={[
  { key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'contact', label: 'Contact' },
  { key: 'department', label: 'Department' }, { key: 'responsibility', label: 'Responsibility' }, { key: 'joinDate', label: 'Join Date' },
]} />;

export const FuelLogPage = () => <GenericModule title="Fuel Log" description="Track fuel receipts, issues, and balance" fields={[
  { key: 'date', label: 'Date' }, { key: 'type', label: 'Fuel Type' }, { key: 'receipt', label: 'Receipt (L)' },
  { key: 'issued', label: 'Issued (L)' }, { key: 'issuedTo', label: 'Issued To' }, { key: 'balance', label: 'Balance' }, { key: 'remarks', label: 'Remarks' },
]} />;

export const QualityPage = () => <GenericModule title="Quality (ITP/NCR)" description="Inspection test plans and non-conformance reports" fields={[
  { key: 'testId', label: 'Test ID' }, { key: 'date', label: 'Date' }, { key: 'location', label: 'Location' },
  { key: 'type', label: 'Type' }, { key: 'spec', label: 'Specification' }, { key: 'result', label: 'Result' },
  { key: 'status', label: 'Status' }, { key: 'testedBy', label: 'Tested By' },
]} />;

export const ConcreteLogPage = () => <GenericModule title="Concrete Pour" description="Daily pour cards with slump, cubes, weather" fields={[
  { key: 'date', label: 'Date' }, { key: 'location', label: 'Location' }, { key: 'grade', label: 'Grade' },
  { key: 'volume', label: 'Volume (m³)' }, { key: 'slump', label: 'Slump (mm)' }, { key: 'temp', label: 'Temp (°C)' },
  { key: 'weather', label: 'Weather' }, { key: 'cubes', label: 'Cubes' }, { key: 'supervisor', label: 'Supervisor' },
]} />;

export const WeldingPage = () => <GenericModule title="Welding Log" description="Daily welding reports with NDT results" fields={[
  { key: 'date', label: 'Date' }, { key: 'location', label: 'Location' }, { key: 'welderName', label: 'Welder' },
  { key: 'welderId', label: 'Welder ID' }, { key: 'joints', label: 'Joint Type' }, { key: 'numJoints', label: 'No. Joints' },
  { key: 'ndtReq', label: 'NDT Required' }, { key: 'ndtRes', label: 'NDT Result' }, { key: 'inspector', label: 'Inspector' },
]} />;

export const ToolsPage = () => <GenericModule title="Tools" description="Tool issuance, return tracking, and condition" fields={[
  { key: 'toolId', label: 'Tool ID' }, { key: 'description', label: 'Description' }, { key: 'issuedTo', label: 'Issued To' },
  { key: 'dateIssued', label: 'Date Issued' }, { key: 'expReturn', label: 'Expected Return' }, { key: 'actReturn', label: 'Actual Return' },
  { key: 'condition', label: 'Condition' },
]} />;

export const SubcontractorsPage = () => <GenericModule title="Subcontractors" description="Track daily progress and cumulative completion" fields={[
  { key: 'name', label: 'Name' }, { key: 'scope', label: 'Scope' }, { key: 'contractValue', label: 'Contract Value' },
  { key: 'date', label: 'Date' }, { key: 'manpower', label: 'Manpower' }, { key: 'progress', label: 'Daily Progress' },
  { key: 'cumulative', label: 'Cumulative %' }, { key: 'supervisor', label: 'Supervisor' },
]} />;

export const PhotosPage = () => <GenericModule title="Photos" description="Photo records with location and description" fields={[
  { key: 'date', label: 'Date' }, { key: 'fileName', label: 'File Name' }, { key: 'location', label: 'Location' },
  { key: 'description', label: 'Description' }, { key: 'takenBy', label: 'Taken By' },
]} />;

export const ChangeOrdersPage = () => <GenericModule title="Change Orders" description="Track change requests with cost and schedule impact" fields={[
  { key: 'coNo', label: 'CO No.' }, { key: 'date', label: 'Date' }, { key: 'description', label: 'Description' },
  { key: 'costImpact', label: 'Cost Impact' }, { key: 'scheduleImpact', label: 'Schedule Impact' },
  { key: 'status', label: 'Status' }, { key: 'approvedDate', label: 'Approved Date' },
]} />;

export const DocumentsPage = () => <GenericModule title="Documents" description="Upload and manage project documents" fields={[
  { key: 'filename', label: 'Filename' }, { key: 'version', label: 'Version' }, { key: 'dateUploaded', label: 'Date Uploaded' },
  { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }, { key: 'linkedTo', label: 'Linked To' },
]} />;

export const ReportsPage = () => <GenericModule title="Reports" description="Generate printable reports for each module" fields={[
  { key: 'reportName', label: 'Report Name' }, { key: 'date', label: 'Date' }, { key: 'module', label: 'Module' },
  { key: 'generatedBy', label: 'Generated By' }, { key: 'status', label: 'Status' },
]} />;

export const BackupPage = () => <GenericModule title="Backup / Restore" description="Export and import project data" fields={[
  { key: 'date', label: 'Date' }, { key: 'type', label: 'Type' }, { key: 'size', label: 'Size' },
  { key: 'status', label: 'Status' }, { key: 'notes', label: 'Notes' },
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
          <li><strong>Activities (CPM)</strong> – Gantt chart with critical path visualization, WBS breakdown, and timeline</li>
          <li><strong>BOQ / Items</strong> – Bill of quantities with progress tracking and budget analysis</li>
          <li><strong>Excel Import/Export</strong> – Import data from .xlsx/.csv files and export to Excel</li>
          <li><strong>All modules</strong> – Full CRUD (Add/Edit/Delete) with inline editing dialogs</li>
          <li><strong>Dashboard</strong> – KPI overview with charts and project health indicators</li>
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">Import Instructions</h2>
        <p className="text-sm text-muted-foreground">Click "Import XLS" on any module. Your spreadsheet headers should match the column names shown in the table. The system will attempt to map common header variations automatically.</p>
      </div>
    </div>
  </div>
);

// Settings page moved to src/components/SettingsPage.tsx
