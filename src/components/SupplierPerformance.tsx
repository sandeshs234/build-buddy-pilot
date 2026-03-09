import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Users, Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Package, Truck, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as XLSX from '@e965/xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

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

interface SupplierMetrics {
  name: string;
  totalOrders: number;
  deliveredOrders: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  earlyDeliveries: number;
  avgDelayDays: number;
  totalOrderedValue: number;
  totalReceivedValue: number;
  costVariance: number;
  costVariancePercent: number;
  onTimeRate: number;
  fulfillmentRate: number;
  pendingOrders: number;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
  'hsl(200, 70%, 50%)',
  'hsl(120, 50%, 45%)',
  'hsl(45, 90%, 50%)',
];

function daysBetween(dateA: string, dateB: string): number {
  if (!dateA || !dateB) return 0;
  const a = new Date(dateA);
  const b = new Date(dateB);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function SupplierPerformance() {
  const { user } = useAuth();
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'onTimeRate' | 'totalOrderedValue' | 'totalOrders' | 'avgDelayDays'>('totalOrderedValue');

  const fetchItems = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('procurement_tracking')
      .select('*')
      .eq('user_id', user.id);
    if (!error && data) {
      setItems(data as unknown as TrackingItem[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const supplierMetrics = useMemo((): SupplierMetrics[] => {
    const grouped: Record<string, TrackingItem[]> = {};
    items.forEach(item => {
      const name = item.supplier?.trim() || 'Unknown';
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(item);
    });

    return Object.entries(grouped).map(([name, orders]) => {
      const delivered = orders.filter(o => o.status === 'received' && o.actual_delivery);
      const onTime = delivered.filter(o => daysBetween(o.expected_delivery, o.actual_delivery) <= 0);
      const late = delivered.filter(o => daysBetween(o.expected_delivery, o.actual_delivery) > 0);
      const early = delivered.filter(o => daysBetween(o.expected_delivery, o.actual_delivery) < 0);

      const delayDays = delivered.map(o => Math.max(0, daysBetween(o.expected_delivery, o.actual_delivery)));
      const avgDelay = delayDays.length > 0 ? delayDays.reduce((a, b) => a + b, 0) / delayDays.length : 0;

      const totalOrderedValue = orders.reduce((s, o) => s + (o.ordered_qty * o.unit_rate), 0);
      const totalReceivedValue = delivered.reduce((s, o) => s + (o.received_qty * o.unit_rate), 0);
      const costVariance = totalReceivedValue - totalOrderedValue;
      const costVariancePercent = totalOrderedValue > 0 ? (costVariance / totalOrderedValue) * 100 : 0;

      const pending = orders.filter(o => o.status !== 'received').length;
      const fulfillment = orders.length > 0 ? (delivered.length / orders.length) * 100 : 0;

      return {
        name,
        totalOrders: orders.length,
        deliveredOrders: delivered.length,
        onTimeDeliveries: onTime.length,
        lateDeliveries: late.length,
        earlyDeliveries: early.length,
        avgDelayDays: Math.round(avgDelay * 10) / 10,
        totalOrderedValue,
        totalReceivedValue,
        costVariance,
        costVariancePercent: Math.round(costVariancePercent * 10) / 10,
        onTimeRate: delivered.length > 0 ? Math.round((onTime.length / delivered.length) * 100) : 0,
        fulfillmentRate: Math.round(fulfillment),
        pendingOrders: pending,
      };
    }).sort((a, b) => {
      if (sortBy === 'onTimeRate') return b.onTimeRate - a.onTimeRate;
      if (sortBy === 'totalOrderedValue') return b.totalOrderedValue - a.totalOrderedValue;
      if (sortBy === 'totalOrders') return b.totalOrders - a.totalOrders;
      if (sortBy === 'avgDelayDays') return a.avgDelayDays - b.avgDelayDays;
      return 0;
    });
  }, [items, sortBy]);

  const overallStats = useMemo(() => {
    const totalSuppliers = supplierMetrics.length;
    const totalOrders = items.length;
    const delivered = items.filter(i => i.status === 'received').length;
    const onTimeSuppliers = supplierMetrics.filter(s => s.onTimeRate >= 80).length;
    const totalValue = items.reduce((s, i) => s + (i.ordered_qty * i.unit_rate), 0);
    const avgOnTimeRate = supplierMetrics.length > 0
      ? Math.round(supplierMetrics.reduce((s, m) => s + m.onTimeRate, 0) / supplierMetrics.length)
      : 0;
    return { totalSuppliers, totalOrders, delivered, onTimeSuppliers, totalValue, avgOnTimeRate };
  }, [items, supplierMetrics]);

  const timelinesChartData = useMemo(() =>
    supplierMetrics.slice(0, 10).map(s => ({
      name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
      'On-Time': s.onTimeRate,
      'Late': s.lateDeliveries,
      'Orders': s.totalOrders,
    })),
    [supplierMetrics]
  );

  const costChartData = useMemo(() =>
    supplierMetrics.filter(s => s.totalOrderedValue > 0).slice(0, 8).map(s => ({
      name: s.name.length > 15 ? s.name.slice(0, 15) + '…' : s.name,
      'Ordered': Math.round(s.totalOrderedValue),
      'Received': Math.round(s.totalReceivedValue),
    })),
    [supplierMetrics]
  );

  const statusDistribution = useMemo(() => {
    const pending = items.filter(i => i.status === 'pending').length;
    const ordered = items.filter(i => i.status === 'ordered').length;
    const inTransit = items.filter(i => i.status === 'in-transit').length;
    const received = items.filter(i => i.status === 'received').length;
    return [
      { name: 'Pending', value: pending, fill: 'hsl(var(--muted-foreground))' },
      { name: 'Ordered', value: ordered, fill: 'hsl(var(--primary))' },
      { name: 'In Transit', value: inTransit, fill: 'hsl(45, 90%, 50%)' },
      { name: 'Received', value: received, fill: 'hsl(142, 70%, 45%)' },
    ].filter(s => s.value > 0);
  }, [items]);

  const formatNPR = (val: number) =>
    val >= 1_000_000 ? `₹${(val / 1_000_000).toFixed(1)}M` :
    val >= 1_000 ? `₹${(val / 1_000).toFixed(0)}K` :
    `₹${val.toFixed(0)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading supplier data…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="mx-auto mb-3 text-muted-foreground" size={40} />
          <p className="text-muted-foreground">No procurement data yet. Add items in the Procurement Tracker to see supplier performance.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">Total Suppliers</span>
            </div>
            <p className="text-2xl font-bold">{overallStats.totalSuppliers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">Total Orders</span>
            </div>
            <p className="text-2xl font-bold">{overallStats.totalOrders}</p>
            <p className="text-xs text-muted-foreground">{overallStats.delivered} delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">Avg On-Time Rate</span>
            </div>
            <p className="text-2xl font-bold">{overallStats.avgOnTimeRate}%</p>
            <p className="text-xs text-muted-foreground">{overallStats.onTimeSuppliers} suppliers ≥80%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">Total Order Value</span>
            </div>
            <p className="text-2xl font-bold">{formatNPR(overallStats.totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* On-Time Delivery Rate by Supplier */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">On-Time Delivery Rate by Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            {timelinesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={timelinesChartData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} className="text-xs" />
                  <YAxis type="category" dataKey="name" width={100} className="text-xs" />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Bar dataKey="On-Time" radius={[0, 4, 4, 0]}>
                    {timelinesChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No delivery data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Cost Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Cost: Ordered vs Received by Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            {costChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={costChartData} margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" angle={-30} textAnchor="end" height={60} />
                  <YAxis className="text-xs" tickFormatter={v => formatNPR(v)} />
                  <Tooltip formatter={(value: number) => `NPR ${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="Ordered" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Received" fill="hsl(142, 70%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No cost data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Status Distribution */}
      {statusDistribution.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {statusDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Supplier Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-semibold">Supplier Scorecard</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-44 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalOrderedValue">Sort: Order Value</SelectItem>
                  <SelectItem value="onTimeRate">Sort: On-Time Rate</SelectItem>
                  <SelectItem value="totalOrders">Sort: Total Orders</SelectItem>
                  <SelectItem value="avgDelayDays">Sort: Least Delays</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => {
                const rating = (s: SupplierMetrics) =>
                  s.onTimeRate >= 90 ? 'Excellent' : s.onTimeRate >= 70 ? 'Good' : s.onTimeRate >= 50 ? 'Fair' : s.deliveredOrders === 0 ? 'N/A' : 'Poor';

                const rows = supplierMetrics.map(s => ({
                  'Supplier': s.name,
                  'Total Orders': s.totalOrders,
                  'Delivered': s.deliveredOrders,
                  'On-Time': s.onTimeDeliveries,
                  'Late': s.lateDeliveries,
                  'Early': s.earlyDeliveries,
                  'Avg Delay (days)': s.avgDelayDays,
                  'On-Time Rate (%)': s.onTimeRate,
                  'Ordered Value (NPR)': Math.round(s.totalOrderedValue),
                  'Received Value (NPR)': Math.round(s.totalReceivedValue),
                  'Cost Variance (NPR)': Math.round(s.costVariance),
                  'Cost Variance (%)': s.costVariancePercent,
                  'Fulfillment (%)': s.fulfillmentRate,
                  'Pending Orders': s.pendingOrders,
                  'Rating': rating(s),
                }));

                // Summary row
                rows.push({
                  'Supplier': 'TOTALS',
                  'Total Orders': overallStats.totalOrders,
                  'Delivered': overallStats.delivered,
                  'On-Time': supplierMetrics.reduce((s, m) => s + m.onTimeDeliveries, 0),
                  'Late': supplierMetrics.reduce((s, m) => s + m.lateDeliveries, 0),
                  'Early': supplierMetrics.reduce((s, m) => s + m.earlyDeliveries, 0),
                  'Avg Delay (days)': 0,
                  'On-Time Rate (%)': overallStats.avgOnTimeRate,
                  'Ordered Value (NPR)': Math.round(overallStats.totalValue),
                  'Received Value (NPR)': Math.round(supplierMetrics.reduce((s, m) => s + m.totalReceivedValue, 0)),
                  'Cost Variance (NPR)': Math.round(supplierMetrics.reduce((s, m) => s + m.costVariance, 0)),
                  'Cost Variance (%)': 0,
                  'Fulfillment (%)': overallStats.totalOrders > 0 ? Math.round((overallStats.delivered / overallStats.totalOrders) * 100) : 0,
                  'Pending Orders': supplierMetrics.reduce((s, m) => s + m.pendingOrders, 0),
                  'Rating': '',
                });

                const ws = XLSX.utils.json_to_sheet(rows);
                ws['!cols'] = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length + 2, 14) }));
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Supplier Scorecard');
                XLSX.writeFile(wb, 'supplier_performance_scorecard.xlsx');
              }}>
                <Download size={14} className="mr-1" /> Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-center">Delivered</TableHead>
                  <TableHead className="text-center">On-Time</TableHead>
                  <TableHead className="text-center">Late</TableHead>
                  <TableHead className="text-center">Avg Delay</TableHead>
                  <TableHead className="text-right">Ordered Value</TableHead>
                  <TableHead className="text-right">Received Value</TableHead>
                  <TableHead className="text-right">Cost Variance</TableHead>
                  <TableHead className="text-center">Fulfillment</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierMetrics.map((s) => {
                  const rating = s.onTimeRate >= 90 ? 'Excellent' :
                                 s.onTimeRate >= 70 ? 'Good' :
                                 s.onTimeRate >= 50 ? 'Fair' :
                                 s.deliveredOrders === 0 ? 'N/A' : 'Poor';
                  const ratingColor = rating === 'Excellent' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                                      rating === 'Good' ? 'bg-primary/10 text-primary border-primary/30' :
                                      rating === 'Fair' ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' :
                                      rating === 'N/A' ? 'bg-muted text-muted-foreground' :
                                      'bg-destructive/10 text-destructive border-destructive/30';

                  return (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-center">{s.totalOrders}</TableCell>
                      <TableCell className="text-center">{s.deliveredOrders}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {s.onTimeDeliveries > 0 && <CheckCircle2 size={12} className="text-emerald-500" />}
                          {s.onTimeDeliveries}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {s.lateDeliveries > 0 && <AlertTriangle size={12} className="text-destructive" />}
                          {s.lateDeliveries}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {s.avgDelayDays > 0 ? `${s.avgDelayDays}d` : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNPR(s.totalOrderedValue)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNPR(s.totalReceivedValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={s.costVariance > 0 ? 'text-destructive' : s.costVariance < 0 ? 'text-emerald-600' : ''}>
                          {s.costVariance !== 0 ? `${s.costVariancePercent > 0 ? '+' : ''}${s.costVariancePercent}%` : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-1.5">
                          <Progress value={s.fulfillmentRate} className="h-1.5 w-12" />
                          <span className="text-xs">{s.fulfillmentRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-xs ${ratingColor}`}>
                          {rating}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
