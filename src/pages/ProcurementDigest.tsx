import { useState, useEffect, useMemo } from 'react';
import { esc } from '@/lib/htmlEscape';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Printer, AlertTriangle, Package, Truck, CheckCircle2, Clock, CalendarDays, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProjectData } from '@/context/ProjectDataContext';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, isBefore, parseISO, differenceInDays } from 'date-fns';

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

export default function ProcurementDigest() {
  const { purchaseOrders } = useProjectData();
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('procurement_tracking').select('*');
      setItems((data as TrackingItem[]) || []);
      setLoading(false);
    })();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueItems = useMemo(() =>
    items.filter(i => i.expected_delivery && !i.actual_delivery && i.status !== 'received' && isBefore(parseISO(i.expected_delivery), today)),
  [items]);

  const upcomingThisWeek = useMemo(() =>
    items.filter(i => i.expected_delivery && !i.actual_delivery && i.status !== 'received' &&
      isWithinInterval(parseISO(i.expected_delivery), { start: weekStart, end: weekEnd })),
  [items, weekStart, weekEnd]);

  const receivedThisWeek = useMemo(() =>
    items.filter(i => i.actual_delivery &&
      isWithinInterval(parseISO(i.actual_delivery), { start: weekStart, end: weekEnd })),
  [items, weekStart, weekEnd]);

  const pendingOrders = useMemo(() => items.filter(i => i.status === 'pending' || i.status === 'ordered'), [items]);
  const inTransit = useMemo(() => items.filter(i => i.status === 'in-transit'), [items]);
  const totalValue = useMemo(() => items.reduce((s, i) => s + (i.total_cost || 0), 0), [items]);
  const receivedValue = useMemo(() => items.filter(i => i.status === 'received').reduce((s, i) => s + (i.total_cost || 0), 0), [items]);
  const fulfillmentPct = totalValue > 0 ? Math.round((receivedValue / totalValue) * 100) : 0;

  // PO stats
  const draftPOs = purchaseOrders.filter(po => po.status === 'draft').length;
  const issuedPOs = purchaseOrders.filter(po => po.status === 'issued').length;
  const totalPOValue = purchaseOrders.reduce((s, po) => s + (po.price || 0), 0);

  const handlePrint = () => {
    const settings = JSON.parse(localStorage.getItem('buildforge-settings') || '{}');
    const logo = localStorage.getItem('buildforge-logo') || '';
    const stamp = localStorage.getItem('buildforge-stamp') || '';
    const dateStr = format(new Date(), 'dd MMM yyyy');
    const weekLabel = `${format(weekStart, 'dd MMM')} – ${format(weekEnd, 'dd MMM yyyy')}`;
    const docRef = `PROC-DIGEST-${Date.now().toString(36).toUpperCase()}`;

    const pw = window.open('', '_blank');
    if (!pw) return;

     const makeTable = (title: string, rows: TrackingItem[], showOverdue = false) => {
      if (rows.length === 0) return `<p style="color:#888;font-size:8pt;margin:6px 0">No items</p>`;
      return `<h3 style="font-size:10pt;font-weight:700;margin:10px 0 4px;color:#1a1a2e">${esc(title)} (${rows.length})</h3>
      <table><thead><tr><th>Material</th><th>Supplier</th><th>PO #</th><th>Qty</th><th>Expected</th>${showOverdue ? '<th>Days Overdue</th>' : '<th>Status</th>'}<th>Cost (NPR)</th></tr></thead>
      <tbody>${rows.map(r => {
        const days = showOverdue ? differenceInDays(today, parseISO(r.expected_delivery)) : 0;
        return `<tr><td>${esc(r.material_description)}</td><td>${esc(r.supplier || '—')}</td><td style="font-family:monospace;font-size:7pt">${esc(r.po_number || '—')}</td>
        <td style="text-align:right">${r.required_qty}</td><td>${esc(r.expected_delivery || '—')}</td>
        ${showOverdue ? `<td style="text-align:center;color:#dc2626;font-weight:700">${days}d</td>` : `<td style="text-align:center">${esc(r.status)}</td>`}
        <td style="text-align:right;font-family:monospace">${(r.total_cost || 0).toLocaleString()}</td></tr>`;
      }).join('')}</tbody></table>`;
    };

    pw.document.write(`<!DOCTYPE html><html><head><title>Procurement Digest</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;padding:12mm 15mm;font-size:9pt}
  .header{text-align:center;margin-bottom:8px}
  .header-logo img{max-height:60px;margin-bottom:6px}
  .company-name{font-size:18pt;font-weight:900;text-transform:uppercase;letter-spacing:3px}
  .company-tagline{font-size:9pt;font-weight:600;color:#444;margin-top:2px}
  .header-line{height:2px;background:linear-gradient(90deg,transparent,#1a1a2e,transparent);margin:8px 0}
  .title{font-size:14pt;font-weight:800;text-align:center;text-transform:uppercase;letter-spacing:2px;margin:4px 0}
  .subtitle{text-align:center;font-size:8pt;color:#666;margin-bottom:10px}
  .cards{display:flex;gap:10px;margin-bottom:10px}
  .card{flex:1;border:1px solid #ddd;border-radius:6px;padding:8px 10px;text-align:center}
  .card .label{font-size:7pt;color:#888;text-transform:uppercase;letter-spacing:0.5px}
  .card .val{font-size:13pt;font-weight:800;margin-top:2px}
  .card .val.warn{color:#dc2626}
  table{width:100%;border-collapse:collapse;margin-bottom:8px}
  th{background:#1a1a2e;color:#fff;font-size:7pt;font-weight:700;text-transform:uppercase;padding:4px 5px;text-align:left}
  th:first-child{border-radius:3px 0 0 0}th:last-child{border-radius:0 3px 0 0}
  td{padding:3px 5px;font-size:7.5pt;border-bottom:0.5px solid #e8e8e8}
  tr:nth-child(even){background:#f9fafb}
  .sigs{display:flex;justify-content:space-between;margin-top:30px;padding:0 20px}
  .sig{text-align:center;min-width:120px}
  .sig-line{border-top:1px solid #333;margin-top:40px;padding-top:4px;font-size:7.5pt;font-weight:600;text-transform:uppercase}
  .sig-role{font-size:7pt;color:#888;margin-top:1px}
  .footer{margin-top:16px;display:flex;justify-content:space-between;align-items:flex-end}
  .footer-left{font-size:7pt;color:#888}
  .footer-stamp img{max-height:55px;opacity:0.6}
  @media print{body{padding:8mm 12mm}@page{size:A4 portrait;margin:8mm}}
</style></head><body>
  <div class="header">
    ${logo ? `<div class="header-logo"><img src="${logo}" /></div>` : ''}
    <div class="company-name">${settings.companyName || 'BuildForge Engineering'}</div>
    <div class="company-tagline">${settings.companyTagline || 'Construction Project Management'}</div>
    <div class="header-line"></div>
  </div>
  <div class="title">Weekly Procurement Digest</div>
  <div class="subtitle">Week: ${weekLabel} · Generated: ${dateStr} · Ref: ${docRef}</div>
  <div class="cards">
    <div class="card"><div class="label">Overdue</div><div class="val warn">${overdueItems.length}</div></div>
    <div class="card"><div class="label">Upcoming</div><div class="val">${upcomingThisWeek.length}</div></div>
    <div class="card"><div class="label">In Transit</div><div class="val">${inTransit.length}</div></div>
    <div class="card"><div class="label">Fulfillment</div><div class="val">${fulfillmentPct}%</div></div>
    <div class="card"><div class="label">PO Value</div><div class="val">NPR ${totalPOValue.toLocaleString()}</div></div>
  </div>
  ${makeTable('⚠️ Overdue Items', overdueItems, true)}
  ${makeTable('📦 Upcoming Deliveries This Week', upcomingThisWeek)}
  ${makeTable('✅ Received This Week', receivedThisWeek)}
  ${makeTable('🔄 Pending & In-Transit', [...pendingOrders, ...inTransit])}
  <div class="sigs">
    <div class="sig"><div class="sig-line">Procurement Manager</div><div class="sig-role">Name / Date</div></div>
    <div class="sig"><div class="sig-line">Project Manager</div><div class="sig-role">Name / Date</div></div>
    <div class="sig"><div class="sig-line">Approved By</div><div class="sig-role">Name / Date</div></div>
  </div>
  <div class="footer">
    <div class="footer-left"><div>${settings.companyName || 'BuildForge Engineering'} — Confidential</div><div>${docRef}</div></div>
    ${stamp ? `<div class="footer-stamp"><img src="${stamp}" /></div>` : ''}
  </div>
</body></html>`);
    pw.document.close();
    setTimeout(() => pw.print(), 300);
  };

  if (loading) return <div className="p-12 text-center text-muted-foreground">Loading digest...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Weekly Procurement Digest</h1>
          <p className="text-muted-foreground text-sm">
            {format(weekStart, 'dd MMM')} – {format(weekEnd, 'dd MMM yyyy')} · {items.length} tracked materials
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(o => o - 1)}>
            <ChevronLeft size={14} className="mr-1" /> Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
            This Week
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(o => o + 1)}>
            Next <ChevronRight size={14} className="ml-1" />
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer size={14} className="mr-1" /> Print Digest
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><AlertTriangle size={14} /> Overdue</div>
            <p className={`text-xl font-bold ${overdueItems.length > 0 ? 'text-destructive' : 'text-foreground'}`}>{overdueItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><CalendarDays size={14} /> Upcoming</div>
            <p className="text-xl font-bold">{upcomingThisWeek.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Truck size={14} /> In Transit</div>
            <p className="text-xl font-bold">{inTransit.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><TrendingUp size={14} /> Fulfillment</div>
            <p className="text-xl font-bold">{fulfillmentPct}%</p>
            <Progress value={fulfillmentPct} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Package size={14} /> POs</div>
            <p className="text-xl font-bold">{purchaseOrders.length}</p>
            <p className="text-[10px] text-muted-foreground">{draftPOs} draft · {issuedPOs} issued</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Items */}
      {overdueItems.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle size={16} /> Overdue Items ({overdueItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-destructive/5">
                    <th className="text-left p-2.5 font-medium text-xs">Material</th>
                    <th className="text-left p-2.5 font-medium text-xs">Supplier</th>
                    <th className="text-left p-2.5 font-medium text-xs">PO #</th>
                    <th className="text-right p-2.5 font-medium text-xs">Qty</th>
                    <th className="text-left p-2.5 font-medium text-xs">Expected</th>
                    <th className="text-center p-2.5 font-medium text-xs">Days Overdue</th>
                    <th className="text-right p-2.5 font-medium text-xs">Cost (NPR)</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueItems.map(item => {
                    const days = differenceInDays(today, parseISO(item.expected_delivery));
                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/30">
                        <td className="p-2.5 font-medium">{item.material_description}</td>
                        <td className="p-2.5 text-muted-foreground">{item.supplier || '—'}</td>
                        <td className="p-2.5 font-mono text-xs">{item.po_number || '—'}</td>
                        <td className="p-2.5 text-right font-mono">{item.required_qty}</td>
                        <td className="p-2.5">{item.expected_delivery}</td>
                        <td className="p-2.5 text-center">
                          <Badge variant="destructive" className="text-[10px]">{days}d</Badge>
                        </td>
                        <td className="p-2.5 text-right font-mono">{(item.total_cost || 0).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deliveries */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" /> Upcoming Deliveries This Week ({upcomingThisWeek.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingThisWeek.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No deliveries expected this week</p>
          ) : (
            <div className="space-y-2">
              {upcomingThisWeek.map(item => {
                const daysUntil = differenceInDays(parseISO(item.expected_delivery), today);
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-3">
                      <Package size={16} className="text-primary" />
                      <div>
                        <span className="font-medium text-sm">{item.material_description}</span>
                        <span className="text-xs text-muted-foreground ml-2">from {item.supplier || 'TBD'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground text-xs">{item.required_qty} {item.unit}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {daysUntil === 0 ? 'Today' : `${daysUntil}d`}
                      </Badge>
                      <span className="font-mono text-xs">NPR {(item.total_cost || 0).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Received This Week */}
      {receivedThisWeek.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> Received This Week ({receivedThisWeek.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {receivedThisWeek.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-sm font-medium">{item.material_description}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-muted-foreground">{item.actual_delivery}</span>
                    <span className="font-mono text-xs">NPR {(item.total_cost || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending & In-Transit Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" /> Pending & In-Transit ({pendingOrders.length + inTransit.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOrders.length + inTransit.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No pending items</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2.5 font-medium text-xs">Material</th>
                    <th className="text-left p-2.5 font-medium text-xs">Supplier</th>
                    <th className="text-center p-2.5 font-medium text-xs">Status</th>
                    <th className="text-left p-2.5 font-medium text-xs">Expected</th>
                    <th className="text-right p-2.5 font-medium text-xs">Cost (NPR)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...pendingOrders, ...inTransit].map(item => (
                    <tr key={item.id} className="border-b hover:bg-muted/30">
                      <td className="p-2.5 font-medium">{item.material_description}</td>
                      <td className="p-2.5 text-muted-foreground">{item.supplier || '—'}</td>
                      <td className="p-2.5 text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {item.status === 'in-transit' ? '🚚 In Transit' : item.status === 'ordered' ? '📦 Ordered' : '⏳ Pending'}
                        </Badge>
                      </td>
                      <td className="p-2.5">{item.expected_delivery || '—'}</td>
                      <td className="p-2.5 text-right font-mono">{(item.total_cost || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
