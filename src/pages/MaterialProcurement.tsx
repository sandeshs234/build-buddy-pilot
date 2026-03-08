import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, RefreshCw, Package, TrendingUp, AlertTriangle, Clock, ShoppingCart, IndianRupee, Download, Printer } from 'lucide-react';
import * as XLSX from '@e965/xlsx';
import ProcurementTracker from '@/components/ProcurementTracker';
import { useModuleSync } from '@/hooks/useModuleSync';
import { useProjectData } from '@/context/ProjectDataContext';

interface ProcurementMaterial {
  code: string;
  description: string;
  category: string;
  unit: string;
  requiredQty: number;
  totalWithWaste: number;
  nepalStandard?: string;
  unitRate?: number;
  totalCost?: number;
  leadTimeDays?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  suggestedSuppliers?: string[];
  procurementWeek?: number;
}

const NEPAL_MATERIAL_RATES: Record<string, { rate: number; unit: string; suppliers: string[]; leadDays: number }> = {
  'Cement': { rate: 720, unit: 'bag', suppliers: ['Hetauda Cement', 'Udayapur Cement', 'Maruti Cement', 'Shivam Cement'], leadDays: 3 },
  'OPC 53 Grade Cement': { rate: 750, unit: 'bag', suppliers: ['Hetauda Cement', 'Hongshi Cement', 'Maruti Cement'], leadDays: 3 },
  'PPC Cement': { rate: 700, unit: 'bag', suppliers: ['Udayapur Cement', 'Shivam Cement', 'Hongshi Cement'], leadDays: 3 },
  'TMT Steel Bar': { rate: 95000, unit: 'MT', suppliers: ['Jagdamba Steel', 'Himal Iron & Steel', 'Panchakanya Steel'], leadDays: 7 },
  'Steel Reinforcement': { rate: 95, unit: 'kg', suppliers: ['Jagdamba Steel', 'Himal Iron & Steel', 'Panchakanya Steel'], leadDays: 7 },
  'Sand': { rate: 3500, unit: 'cu.m', suppliers: ['Local River Quarry', 'Crusher Sand Supplier'], leadDays: 2 },
  'Fine Aggregate': { rate: 3500, unit: 'cu.m', suppliers: ['Local River Quarry', 'Crusher Sand Supplier'], leadDays: 2 },
  'Coarse Aggregate': { rate: 2800, unit: 'cu.m', suppliers: ['Local Crusher Plant', 'Aggregate Depot'], leadDays: 2 },
  'Gravel': { rate: 2800, unit: 'cu.m', suppliers: ['Local Crusher Plant', 'Stone Quarry'], leadDays: 2 },
  'Brick': { rate: 14, unit: 'piece', suppliers: ['Local Brick Kiln', 'Bhaktapur Bricks'], leadDays: 5 },
  'AAC Block': { rate: 4500, unit: 'cu.m', suppliers: ['CG Paints & Blocks', 'Laxmi AAC'], leadDays: 7 },
  'Timber': { rate: 2200, unit: 'cu.ft', suppliers: ['Timber Depot Kathmandu', 'Birgunj Timber Market'], leadDays: 10 },
  'Plywood': { rate: 2800, unit: 'sheet', suppliers: ['Ply Point', 'Srijana Plywood'], leadDays: 5 },
  'MS Pipe': { rate: 180, unit: 'kg', suppliers: ['Panchakanya Steel', 'Nepal Lube Oil'], leadDays: 7 },
  'GI Pipe': { rate: 220, unit: 'kg', suppliers: ['Panchakanya Steel', 'Triveni Byapar'], leadDays: 7 },
  'PVC Pipe': { rate: 85, unit: 'meter', suppliers: ['Supreme Pipe', 'Prince Pipe', 'Astral Pipe'], leadDays: 3 },
  'HDPE Pipe': { rate: 120, unit: 'meter', suppliers: ['Supreme Pipe', 'Panchakanya Pipe'], leadDays: 5 },
  'Electric Wire': { rate: 45, unit: 'meter', suppliers: ['Trishakti Cable', 'Jagdamba Cable', 'Nepal Wire'], leadDays: 3 },
  'Copper Wire': { rate: 65, unit: 'meter', suppliers: ['Trishakti Cable', 'CG Wires'], leadDays: 5 },
  'Paint': { rate: 450, unit: 'liter', suppliers: ['Asian Paints Nepal', 'CG Paints', 'Berger Paints'], leadDays: 3 },
  'Bitumen': { rate: 85000, unit: 'MT', suppliers: ['Nepal Oil Corporation', 'Indian Oil'], leadDays: 14 },
  'Waterproofing': { rate: 350, unit: 'sq.m', suppliers: ['Dr. Fixit', 'Sika Nepal'], leadDays: 7 },
  'Tiles': { rate: 950, unit: 'sq.m', suppliers: ['Shree Ram Tiles', 'Kajaria Nepal', 'Johnson Nepal'], leadDays: 7 },
  'Glass': { rate: 2500, unit: 'sq.m', suppliers: ['Nepal Glass House', 'Saint-Gobain Nepal'], leadDays: 10 },
  'Ready Mix Concrete': { rate: 8500, unit: 'cu.m', suppliers: ['Unicon RMC', 'Pioneer RMC', 'ACC RMC'], leadDays: 1 },
  'Formwork Material': { rate: 450, unit: 'sq.m', suppliers: ['Local Formwork Supplier', 'PERI Formwork'], leadDays: 5 },
};

function findRate(desc: string, category: string) {
  const key = Object.keys(NEPAL_MATERIAL_RATES).find(k =>
    desc.toLowerCase().includes(k.toLowerCase()) || category.toLowerCase().includes(k.toLowerCase())
  );
  return key ? NEPAL_MATERIAL_RATES[key] : null;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
  medium: 'bg-primary/20 text-primary',
  low: 'bg-muted text-muted-foreground',
};

export default function MaterialProcurement() {
  const { syncing, lastSyncResult, fullSync } = useModuleSync();
  const { inventory, boqItems } = useProjectData();
  const [materials, setMaterials] = useState<ProcurementMaterial[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const enrichMaterials = (raw: any[]): ProcurementMaterial[] => {
    return (raw || []).map((m, idx) => {
      const rateInfo = findRate(m.description || '', m.category || '');
      const unitRate = rateInfo?.rate || m.unitRate || 0;
      const totalCost = unitRate * (m.totalWithWaste || m.requiredQty || 0);
      const leadTimeDays = rateInfo?.leadDays || 7;
      const invItem = inventory.find(i => i.code === m.code);
      const shortage = (m.totalWithWaste || 0) - (invItem?.balance || 0);
      const priority: ProcurementMaterial['priority'] =
        shortage > (m.totalWithWaste || 0) * 0.8 ? 'critical' :
        shortage > (m.totalWithWaste || 0) * 0.5 ? 'high' :
        shortage > 0 ? 'medium' : 'low';

      return {
        ...m,
        unitRate,
        totalCost,
        leadTimeDays,
        priority,
        suggestedSuppliers: rateInfo?.suppliers || ['Contact local supplier'],
        procurementWeek: Math.max(1, Math.ceil((idx + 1) / 5)),
      };
    });
  };

  useEffect(() => {
    if (lastSyncResult?.materials) {
      setMaterials(enrichMaterials(lastSyncResult.materials));
    }
  }, [lastSyncResult, inventory]);

  const runAnalysis = async () => {
    const data = await fullSync();
    if (data?.materials) {
      setMaterials(enrichMaterials(data.materials));
    }
  };

  const totalBudget = useMemo(() => materials.reduce((s, m) => s + (m.totalCost || 0), 0), [materials]);
  const criticalCount = useMemo(() => materials.filter(m => m.priority === 'critical').length, [materials]);
  const highCount = useMemo(() => materials.filter(m => m.priority === 'high').length, [materials]);
  const categories = useMemo(() => {
    const map: Record<string, { count: number; cost: number }> = {};
    materials.forEach(m => {
      const cat = m.category || 'Other';
      if (!map[cat]) map[cat] = { count: 0, cost: 0 };
      map[cat].count++;
      map[cat].cost += m.totalCost || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].cost - a[1].cost);
  }, [materials]);

  const weekGroups = useMemo(() => {
    const map: Record<number, ProcurementMaterial[]> = {};
    materials.forEach(m => {
      const w = m.procurementWeek || 1;
      if (!map[w]) map[w] = [];
      map[w].push(m);
    });
    return Object.entries(map).sort((a, b) => +a[0] - +b[0]);
  }, [materials]);

  if (materials.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Material Procurement Plan</h1>
          <p className="text-muted-foreground">AI-powered procurement planning with Nepal market rates</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Package size={48} className="text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No Procurement Data Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md text-center">
              Run AI analysis on your BOQ items to generate a comprehensive procurement plan with Nepal market rates, supplier suggestions, and timelines.
            </p>
            <Button onClick={runAnalysis} disabled={syncing} size="lg">
              {syncing ? <><Loader2 size={16} className="mr-2 animate-spin" /> Analyzing BOQ...</> : <><Sparkles size={16} className="mr-2" /> Generate Procurement Plan</>}
            </Button>
            {boqItems.length === 0 && (
              <p className="text-xs text-destructive">Add BOQ items first before generating a procurement plan.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Material Procurement Plan</h1>
          <p className="text-muted-foreground">{materials.length} materials · NPR {totalBudget.toLocaleString()} estimated budget</p>
        </div>
        <Button variant="outline" size="sm" onClick={runAnalysis} disabled={syncing}>
          <RefreshCw size={14} className={`mr-1 ${syncing ? 'animate-spin' : ''}`} /> Re-analyze
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <IndianRupee size={14} /> Total Budget
            </div>
            <p className="text-xl font-bold">NPR {totalBudget.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Package size={14} /> Materials
            </div>
            <p className="text-xl font-bold">{materials.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertTriangle size={14} /> Critical Items
            </div>
            <p className="text-xl font-bold text-destructive">{criticalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock size={14} /> Procurement Weeks
            </div>
            <p className="text-xl font-bold">{weekGroups.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
        </TabsList>

        {/* Tracking Tab */}
        <TabsContent value="tracking" className="mt-4">
          <ProcurementTracker materials={materials} />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Code</th>
                  <th className="text-left p-3 font-medium">Material</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-right p-3 font-medium">Qty (with waste)</th>
                  <th className="text-left p-3 font-medium">Unit</th>
                  <th className="text-right p-3 font-medium">Rate (NPR)</th>
                  <th className="text-right p-3 font-medium">Total (NPR)</th>
                  <th className="text-center p-3 font-medium">Priority</th>
                  <th className="text-center p-3 font-medium">Lead Time</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m, i) => (
                  <tr key={i} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{m.code}</td>
                    <td className="p-3 font-medium">{m.description}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs">{m.category}</Badge></td>
                    <td className="p-3 text-right font-mono">{m.totalWithWaste?.toLocaleString()}</td>
                    <td className="p-3 text-muted-foreground">{m.unit}</td>
                    <td className="p-3 text-right font-mono">{(m.unitRate || 0).toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-medium">{(m.totalCost || 0).toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[m.priority || 'low']}`}>
                        {m.priority}
                      </span>
                    </td>
                    <td className="p-3 text-center text-muted-foreground">{m.leadTimeDays}d</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-medium">
                  <td colSpan={6} className="p-3 text-right">Grand Total:</td>
                  <td className="p-3 text-right font-mono font-bold">NPR {totalBudget.toLocaleString()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-4 space-y-4">
          {weekGroups.map(([week, items]) => (
            <Card key={week}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock size={14} className="text-primary" />
                    Week {week}
                  </span>
                  <span className="text-muted-foreground font-normal">
                    {items.length} items · NPR {items.reduce((s, m) => s + (m.totalCost || 0), 0).toLocaleString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${m.priority === 'critical' ? 'bg-destructive' : m.priority === 'high' ? 'bg-orange-500' : 'bg-primary'}`} />
                        <span className="font-medium">{m.description}</span>
                        <span className="text-muted-foreground text-xs">{m.totalWithWaste?.toLocaleString()} {m.unit}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground">Lead: {m.leadTimeDays}d</span>
                        <span className="font-mono text-sm">NPR {(m.totalCost || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {materials.filter(m => m.suggestedSuppliers && m.suggestedSuppliers.length > 0).map((m, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{m.description}</span>
                    <Badge variant="outline" className="text-[10px]">{m.category}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Need: {m.totalWithWaste?.toLocaleString()} {m.unit} · Est. NPR {(m.totalCost || 0).toLocaleString()}
                  </div>
                  <div className="space-y-1">
                    {(m.suggestedSuppliers || []).map((s, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm p-1.5 rounded bg-muted/40">
                        <ShoppingCart size={12} className="text-primary" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                  {m.nepalStandard && (
                    <p className="text-[10px] text-muted-foreground mt-1">Standard: {m.nepalStandard}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cost Breakdown Tab */}
        <TabsContent value="costs" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Cost by Category</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {categories.map(([cat, data]) => {
                const pct = totalBudget > 0 ? (data.cost / totalBudget) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cat} ({data.count} items)</span>
                      <span className="font-mono">NPR {data.cost.toLocaleString()} ({pct.toFixed(1)}%)</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Nepal Market Rate Reference</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Material</th>
                      <th className="text-right p-2 font-medium">Rate (NPR)</th>
                      <th className="text-left p-2 font-medium">Unit</th>
                      <th className="text-center p-2 font-medium">Lead Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(NEPAL_MATERIAL_RATES).map(([name, info]) => (
                      <tr key={name} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium">{name}</td>
                        <td className="p-2 text-right font-mono">{info.rate.toLocaleString()}</td>
                        <td className="p-2 text-muted-foreground">{info.unit}</td>
                        <td className="p-2 text-center">{info.leadDays} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
