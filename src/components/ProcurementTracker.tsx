import { useState, useEffect, useCallback } from 'react';
import ExcelImportExport from '@/components/ExcelImportExport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Package, Truck, CheckCircle2, Clock, Plus, Pencil, Trash2, ArrowDownToLine, RefreshCw, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface TrackingItem {
  id: string;
  material_code: string;
  material_description: string;
  unit: string;
  required_qty: number;
  ordered_qty: number;
  received_qty: number;
  status: string;
  supplier: string;
  po_number: string;
  order_date: string;
  expected_delivery: string;
  actual_delivery: string;
  unit_rate: number;
  total_cost: number;
  remarks: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
  ordered: { label: 'Ordered', icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
  'in-transit': { label: 'In Transit', icon: Truck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  received: { label: 'Received', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
};

const emptyItem: Omit<TrackingItem, 'id'> = {
  material_code: '', material_description: '', unit: '', required_qty: 0,
  ordered_qty: 0, received_qty: 0, status: 'pending', supplier: '',
  po_number: '', order_date: '', expected_delivery: '', actual_delivery: '',
  unit_rate: 0, total_cost: 0, remarks: '',
};

interface ProcurementTrackerProps {
  materials?: { code: string; description: string; unit: string; totalWithWaste: number; unitRate?: number; suggestedSuppliers?: string[] }[];
}

export default function ProcurementTracker({ materials = [] }: ProcurementTrackerProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TrackingItem | null>(null);
  const [form, setForm] = useState<Omit<TrackingItem, 'id'> & { id?: string }>(emptyItem);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('procurement_tracking')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setItems(data as unknown as TrackingItem[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const u = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyItem });
    setDialogOpen(true);
  };

  const openEdit = (item: TrackingItem) => {
    setEditing(item);
    setForm(item);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    const payload = {
      ...form,
      user_id: user.id,
      total_cost: (form.ordered_qty || 0) * (form.unit_rate || 0),
    };

    if (editing) {
      const { error } = await supabase
        .from('procurement_tracking')
        .update(payload as any)
        .eq('id', editing.id);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase
        .from('procurement_tracking')
        .insert(payload as any);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
    }
    toast({ title: editing ? 'Updated' : 'Added', description: `${form.material_description} tracking ${editing ? 'updated' : 'created'}` });
    setDialogOpen(false);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('procurement_tracking').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Deleted', description: 'Tracking entry removed' });
      fetchItems();
    }
  };

  const clearAll = async () => {
    if (!user || items.length === 0) return;
    const ids = items.map(i => i.id);
    const { error } = await supabase.from('procurement_tracking').delete().in('id', ids);
    if (!error) {
      toast({ title: 'Cleared', description: `All ${ids.length} tracking entries removed` });
      setItems([]);
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (item: TrackingItem, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'received') {
      updates.received_qty = item.ordered_qty;
      updates.actual_delivery = new Date().toISOString().split('T')[0];
    }
    const { error } = await supabase
      .from('procurement_tracking')
      .update(updates)
      .eq('id', item.id);
    if (!error) {
      toast({ title: 'Status Updated', description: `${item.material_description} → ${STATUS_CONFIG[newStatus]?.label}` });
      fetchItems();
    }
  };

  const importFromAnalysis = async () => {
    if (!user || materials.length === 0) return;
    const existingCodes = new Set(items.map(i => i.material_code));
    const newItems = materials
      .filter(m => !existingCodes.has(m.code))
      .map(m => ({
        user_id: user.id,
        material_code: m.code,
        material_description: m.description,
        unit: m.unit,
        required_qty: Math.ceil(m.totalWithWaste || 0),
        ordered_qty: 0,
        received_qty: 0,
        status: 'pending',
        supplier: m.suggestedSuppliers?.[0] || '',
        po_number: '',
        order_date: '',
        expected_delivery: '',
        actual_delivery: '',
        unit_rate: m.unitRate || 0,
        total_cost: 0,
        remarks: '',
      }));

    if (newItems.length === 0) {
      toast({ title: 'Up to date', description: 'All materials already in tracking' });
      return;
    }

    const { error } = await supabase.from('procurement_tracking').insert(newItems as any);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Imported', description: `${newItems.length} materials added to tracking` });
      fetchItems();
    }
  };

  // Stats
  const statusCounts = items.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalOrdered = items.reduce((s, i) => s + (i.ordered_qty * i.unit_rate), 0);
  const totalReceived = items.filter(i => i.status === 'received').length;
  const overallProgress = items.length > 0 ? Math.round((totalReceived / items.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <Card key={key}>
              <CardContent className="pt-3 pb-2 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${cfg.bg}`}>
                  <Icon size={16} className={cfg.color} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  <p className="text-lg font-bold">{statusCounts[key] || 0}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card>
          <CardContent className="pt-3 pb-2">
            <p className="text-xs text-muted-foreground mb-1">Overall Progress</p>
            <p className="text-lg font-bold mb-1">{overallProgress}%</p>
            <Progress value={overallProgress} className="h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {materials.length > 0 && (
          <Button variant="outline" size="sm" onClick={importFromAnalysis}>
            <ArrowDownToLine size={14} className="mr-1" /> Import from Analysis
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={fetchItems}>
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
        <Button size="sm" onClick={openAdd}>
          <Plus size={14} className="mr-1" /> Add Material
        </Button>
        <ExcelImportExport
          data={items}
          columns={[
            { key: 'material_code', label: 'Material Code' },
            { key: 'material_description', label: 'Description' },
            { key: 'unit', label: 'Unit' },
            { key: 'required_qty', label: 'Required Qty' },
            { key: 'ordered_qty', label: 'Ordered Qty' },
            { key: 'received_qty', label: 'Received Qty' },
            { key: 'status', label: 'Status' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'po_number', label: 'PO Number' },
            { key: 'order_date', label: 'Order Date' },
            { key: 'expected_delivery', label: 'Expected Delivery' },
            { key: 'actual_delivery', label: 'Actual Delivery' },
            { key: 'unit_rate', label: 'Unit Rate' },
            { key: 'total_cost', label: 'Total Cost' },
            { key: 'remarks', label: 'Remarks' },
          ]}
          fileName="procurement_tracking"
          onImport={async (rows) => {
            if (!user) return;
            const inserts = rows.map(r => ({
              user_id: user.id,
              material_code: r.material_code || '',
              material_description: r.material_description || r.description || '',
              unit: r.unit || '',
              required_qty: Number(r.required_qty) || 0,
              ordered_qty: Number(r.ordered_qty) || 0,
              received_qty: Number(r.received_qty) || 0,
              status: r.status || 'pending',
              supplier: r.supplier || '',
              po_number: r.po_number || '',
              order_date: r.order_date || '',
              expected_delivery: r.expected_delivery || '',
              actual_delivery: r.actual_delivery || '',
              unit_rate: Number(r.unit_rate) || 0,
              total_cost: Number(r.total_cost) || (Number(r.ordered_qty) || 0) * (Number(r.unit_rate) || 0),
              remarks: r.remarks || '',
            }));
            const { error } = await supabase.from('procurement_tracking').insert(inserts as any);
            if (error) {
              toast({ title: 'Import Error', description: error.message, variant: 'destructive' });
            } else {
              toast({ title: 'Imported', description: `${inserts.length} items imported` });
              fetchItems();
            }
          }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading tracking data...</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package size={48} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium mb-1">No materials being tracked</p>
            <p className="text-sm text-muted-foreground mb-4">
              {materials.length > 0
                ? 'Click "Import from Analysis" to add materials from BOQ analysis.'
                : 'Add materials manually or run BOQ analysis first.'}
            </p>
            {materials.length > 0 && (
              <Button onClick={importFromAnalysis}>
                <ArrowDownToLine size={14} className="mr-1" /> Import {materials.length} Materials
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Material</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Required</th>
                <th className="text-right p-3 font-medium">Ordered</th>
                <th className="text-right p-3 font-medium">Received</th>
                <th className="p-3 font-medium">Progress</th>
                <th className="text-left p-3 font-medium">Supplier</th>
                <th className="text-left p-3 font-medium">PO #</th>
                <th className="text-left p-3 font-medium">Expected</th>
                <th className="text-right p-3 font-medium">Cost (NPR)</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                const deliveryPct = item.required_qty > 0
                  ? Math.min(100, Math.round((item.received_qty / item.required_qty) * 100))
                  : 0;
                const isOverdue = item.expected_delivery && item.status !== 'received' &&
                  new Date(item.expected_delivery) < new Date();

                return (
                  <tr key={item.id} className={`border-b hover:bg-muted/30 ${isOverdue ? 'bg-destructive/5' : ''}`}>
                    <td className="p-3">
                      <div className="font-medium">{item.material_description}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{item.material_code}</div>
                    </td>
                    <td className="p-3 text-center">
                      <Select value={item.status} onValueChange={v => handleStatusChange(item, v)}>
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Icon size={12} className={cfg.color} />
                            <span>{cfg.label}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_CONFIG).map(([k, c]) => {
                            const I = c.icon;
                            return (
                              <SelectItem key={k} value={k}>
                                <div className="flex items-center gap-1.5">
                                  <I size={12} className={c.color} /> {c.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 text-right font-mono">{item.required_qty.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">{item.ordered_qty.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono">{item.received_qty.toLocaleString()}</td>
                    <td className="p-3 w-28">
                      <div className="flex items-center gap-2">
                        <Progress value={deliveryPct} className="h-2 flex-1" />
                        <span className="text-[10px] text-muted-foreground w-8">{deliveryPct}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{item.supplier || '—'}</td>
                    <td className="p-3 font-mono text-xs">{item.po_number || '—'}</td>
                    <td className="p-3 text-xs">
                      {item.expected_delivery ? (
                        <span className={isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                          {item.expected_delivery} {isOverdue && '⚠️'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-3 text-right font-mono">{(item.ordered_qty * item.unit_rate).toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}>
                          <Pencil size={13} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 font-medium">
                <td colSpan={9} className="p-3 text-right">Total Ordered Value:</td>
                <td className="p-3 text-right font-mono font-bold">NPR {totalOrdered.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Procurement Entry</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label>Material Code</Label>
              <Input value={form.material_code} onChange={e => u('material_code', e.target.value)} placeholder="MAT-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input value={form.unit} onChange={e => u('unit', e.target.value)} placeholder="bags, MT, m³" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Input value={form.material_description} onChange={e => u('material_description', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Required Qty</Label>
              <Input type="number" value={form.required_qty} onChange={e => u('required_qty', +e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ordered Qty</Label>
              <Input type="number" value={form.ordered_qty} onChange={e => u('ordered_qty', +e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Received Qty</Label>
              <Input type="number" value={form.received_qty} onChange={e => u('received_qty', +e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit Rate (NPR)</Label>
              <Input type="number" value={form.unit_rate} onChange={e => u('unit_rate', +e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => u('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, c]) => (
                    <SelectItem key={k} value={k}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Input value={form.supplier} onChange={e => u('supplier', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>PO Number</Label>
              <Input value={form.po_number} onChange={e => u('po_number', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Order Date</Label>
              <Input type="date" value={form.order_date} onChange={e => u('order_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Expected Delivery</Label>
              <Input type="date" value={form.expected_delivery} onChange={e => u('expected_delivery', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Actual Delivery</Label>
              <Input type="date" value={form.actual_delivery} onChange={e => u('actual_delivery', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Remarks</Label>
              <Textarea value={form.remarks} onChange={e => u('remarks', e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Save Changes' : 'Add Entry'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
