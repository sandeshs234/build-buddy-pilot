import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Package, ListChecks, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { useModuleSync } from '@/hooks/useModuleSync';

interface MaterialAnalysisProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MaterialAnalysis({ open, onOpenChange }: MaterialAnalysisProps) {
  const { syncing, fullSync, applyActivities, applyMaterials } = useModuleSync();
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('materials');

  const runAnalysis = async () => {
    const data = await fullSync();
    if (data) setResult(data);
  };

  const categoryColors: Record<string, string> = {
    Cement: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    Steel: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    Aggregate: 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300',
    Sand: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    Brick: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    Timber: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    Plumbing: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
    Electrical: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    Bituminous: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            AI Cross-Module Analysis — Nepal Standards
          </DialogTitle>
          <DialogDescription>
            AI analyzes your BOQ to compute materials, generate activities, and identify inventory gaps using Nepal construction standards.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4">
            <div className="text-center space-y-2">
              <Sparkles size={48} className="mx-auto text-primary/40" />
              <h3 className="text-lg font-semibold">Cross-Module Sync</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                AI will analyze your BOQ items using Nepal standards (NBC, DoR, IS codes) to:
              </p>
              <ul className="text-sm text-muted-foreground text-left inline-block space-y-1">
                <li className="flex items-center gap-2"><Package size={14} className="text-primary" /> Calculate all required materials with wastage</li>
                <li className="flex items-center gap-2"><ListChecks size={14} className="text-primary" /> Generate construction activities & CPM schedule</li>
                <li className="flex items-center gap-2"><AlertTriangle size={14} className="text-primary" /> Identify inventory shortages & procurement needs</li>
              </ul>
            </div>
            <Button onClick={runAnalysis} disabled={syncing} size="lg">
              {syncing ? <><Loader2 size={16} className="mr-2 animate-spin" /> Analyzing...</> : <><Sparkles size={16} className="mr-2" /> Run AI Analysis</>}
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{result.summary}</p>
              <Button variant="outline" size="sm" onClick={runAnalysis} disabled={syncing}>
                <RefreshCw size={14} className={`mr-1 ${syncing ? 'animate-spin' : ''}`} /> Re-analyze
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="materials">
                  Materials ({result.materials?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="activities">
                  Activities ({result.activities?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="gaps">
                  Gaps ({result.inventoryGaps?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="materials" className="flex-1 overflow-auto mt-3">
                <div className="flex justify-end mb-2">
                  <Button size="sm" onClick={() => applyMaterials(result.materials)}>
                    <ArrowRight size={14} className="mr-1" /> Add to Inventory
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 font-medium">Code</th>
                        <th className="text-left p-2 font-medium">Description</th>
                        <th className="text-left p-2 font-medium">Category</th>
                        <th className="text-right p-2 font-medium">Qty</th>
                        <th className="text-left p-2 font-medium">Unit</th>
                        <th className="text-right p-2 font-medium">With Waste</th>
                        <th className="text-left p-2 font-medium">Standard</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(result.materials || []).map((m: any, i: number) => (
                        <tr key={i} className="border-b hover:bg-muted/30">
                          <td className="p-2 font-mono text-xs">{m.code}</td>
                          <td className="p-2 font-medium">{m.description}</td>
                          <td className="p-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[m.category] || 'bg-muted text-muted-foreground'}`}>
                              {m.category}
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono">{m.requiredQty?.toLocaleString()}</td>
                          <td className="p-2 text-muted-foreground">{m.unit}</td>
                          <td className="p-2 text-right font-mono font-medium">{m.totalWithWaste?.toLocaleString()}</td>
                          <td className="p-2 text-xs text-muted-foreground">{m.nepalStandard || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="activities" className="flex-1 overflow-auto mt-3">
                <div className="flex justify-end mb-2">
                  <Button size="sm" onClick={() => applyActivities(result.activities)}>
                    <ArrowRight size={14} className="mr-1" /> Add to Schedule
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 font-medium">WBS</th>
                        <th className="text-left p-2 font-medium">Activity</th>
                        <th className="text-right p-2 font-medium">Duration (days)</th>
                        <th className="text-left p-2 font-medium">Predecessors</th>
                        <th className="text-left p-2 font-medium">Linked BOQ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(result.activities || []).map((a: any, i: number) => (
                        <tr key={i} className="border-b hover:bg-muted/30">
                          <td className="p-2 font-mono text-xs font-medium">{a.wbs}</td>
                          <td className="p-2 font-medium">{a.name}</td>
                          <td className="p-2 text-right font-mono">{a.durationDays}</td>
                          <td className="p-2 text-muted-foreground text-xs">{a.predecessors || '—'}</td>
                          <td className="p-2">
                            {(a.linkedBoqCodes || []).map((c: string, j: number) => (
                              <Badge key={j} variant="outline" className="text-[10px] mr-1">{c}</Badge>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.cpmSummary && (
                  <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20 text-sm">
                    <strong>CPM Summary:</strong> Total Duration: {result.cpmSummary.totalDuration} days
                    {result.cpmSummary.criticalPath?.length > 0 && (
                      <span className="ml-2">| Critical Path: {result.cpmSummary.criticalPath.join(' → ')}</span>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="gaps" className="flex-1 overflow-auto mt-3">
                {(result.inventoryGaps || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package size={32} className="mx-auto mb-2 opacity-40" />
                    <p>No inventory gaps detected</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2 font-medium">Material</th>
                          <th className="text-left p-2 font-medium">Description</th>
                          <th className="text-right p-2 font-medium">Required</th>
                          <th className="text-right p-2 font-medium">Available</th>
                          <th className="text-right p-2 font-medium">Shortage</th>
                          <th className="text-left p-2 font-medium">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(result.inventoryGaps || []).map((g: any, i: number) => (
                          <tr key={i} className="border-b hover:bg-muted/30">
                            <td className="p-2 font-mono text-xs">{g.materialCode}</td>
                            <td className="p-2">{g.description}</td>
                            <td className="p-2 text-right font-mono">{g.required?.toLocaleString()}</td>
                            <td className="p-2 text-right font-mono">{g.available?.toLocaleString()}</td>
                            <td className="p-2 text-right font-mono font-medium text-destructive">{g.shortage?.toLocaleString()}</td>
                            <td className="p-2 text-muted-foreground">{g.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
