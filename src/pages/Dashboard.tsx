import { useNavigate } from 'react-router-dom';
import ModuleGuide from '@/components/ModuleGuide';
import { moduleGuides } from '@/data/moduleGuides';
import StatCard from '@/components/StatCard';
import { useProjectData } from '@/context/ProjectDataContext';
import { useAuth } from '@/context/AuthContext';
import { CalendarClock, Users, AlertTriangle, TrendingUp, ShoppingCart, Package, Truck, CheckCircle2, Clock, WifiOff, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DataApproval from '@/components/DataApproval';
import MyPendingChanges from '@/components/MyPendingChanges';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProcTrackingItem {
  status: string;
  total_cost: number;
  expected_delivery: string;
  actual_delivery: string;
  material_description: string;
}

export default function Dashboard() {
  const { activities, boqItems, manpower, delays, equipment, purchaseOrders, isOffline, pendingSyncCount, syncNow } = useProjectData();
  const { canApprove, currentProjectId, projectMemberships } = useAuth();
  const navigate = useNavigate();
  const [procItems, setProcItems] = useState<ProcTrackingItem[]>([]);
  const [currentProject, setCurrentProject] = useState<{ name: string; description: string } | null>(null);

  // Get current project info
  useEffect(() => {
    if (!currentProjectId) {
      setCurrentProject(null);
      return;
    }
    const membership = projectMemberships.find(m => m.project_id === currentProjectId);
    if (membership) {
      setCurrentProject({ name: membership.project_name || 'Untitled Project', description: '' });
    }
    // Also fetch full project details
    supabase.from('projects').select('name, description').eq('id', currentProjectId).single()
      .then(({ data }) => {
        if (data) setCurrentProject({ name: data.name, description: data.description || '' });
      });
  }, [currentProjectId, projectMemberships]);

  useEffect(() => {
    if (!currentProjectId) { setProcItems([]); return; }
    let query = supabase.from('procurement_tracking').select('status,total_cost,expected_delivery,actual_delivery,material_description');
    query = query.eq('project_id', currentProjectId);
    query.then(({ data }) => setProcItems((data as ProcTrackingItem[]) || []));
  }, [currentProjectId]);

  const criticalCount = activities.filter(a => a.critical && a.status !== 'completed').length;
  const completedCount = activities.filter(a => a.status === 'completed').length;
  const totalManpower = manpower.reduce((sum, m) => {
    const total = (m.trades || []).reduce((s: number, t: any) => s + (t.count || 0), 0);
    return sum + total;
  }, 0);
  const openDelays = delays.filter(d => d.status === 'open').length;
  const overallProgress = activities.length > 0
    ? Math.round(activities.reduce((sum, a) => sum + a.percentComplete, 0) / activities.length)
    : 0;

  const boqProgress = boqItems.map(item => ({
    name: item.code,
    executed: item.totalQty > 0 ? Math.round((item.executedQty / item.totalQty) * 100) : 0,
    remaining: item.totalQty > 0 ? Math.round(((item.totalQty - item.executedQty) / item.totalQty) * 100) : 100,
  }));

  const activityStatus = [
    { name: 'Completed', value: activities.filter(a => a.status === 'completed').length, color: 'hsl(152, 60%, 42%)' },
    { name: 'In Progress', value: activities.filter(a => a.status === 'in-progress').length, color: 'hsl(24, 95%, 53%)' },
    { name: 'Not Started', value: activities.filter(a => a.status === 'not-started').length, color: 'hsl(220, 14%, 80%)' },
    { name: 'Delayed', value: activities.filter(a => a.status === 'delayed').length, color: 'hsl(0, 84%, 60%)' },
  ];

  const totalBudget = boqItems.reduce((sum, i) => sum + i.totalQty * i.rate, 0);
  const totalExecuted = boqItems.reduce((sum, i) => sum + i.executedQty * i.rate, 0);

  const equipmentCost = equipment.reduce((sum, e: any) => {
    const rate = e.rate || 0;
    if (e.billingBasis === 'daily' || e.billingBasis === 'monthly') return sum + rate;
    return sum + rate * (e.hours || 0);
  }, 0);

  const isEmpty = activities.length === 0 && boqItems.length === 0 && manpower.length === 0;

  return (
    <div>
      <ModuleGuide moduleName="Dashboard" description={moduleGuides.Dashboard.description} steps={moduleGuides.Dashboard.steps} />
      
      {/* Offline / Sync Banner */}
      {(isOffline || pendingSyncCount > 0) && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-300/30 bg-amber-500/10 px-4 py-3">
          <WifiOff size={18} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {isOffline ? 'You are offline' : `${pendingSyncCount} changes pending sync`}
            </p>
            <p className="text-xs text-muted-foreground">
              {isOffline ? 'All changes are saved locally and will sync when you reconnect.' : 'Click sync to push local changes to the server.'}
            </p>
          </div>
          {!isOffline && pendingSyncCount > 0 && (
            <Button size="sm" variant="outline" onClick={syncNow}>
              <RefreshCw size={14} className="mr-1.5" /> Sync Now
            </Button>
          )}
        </div>
      )}

      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {currentProject?.name || 'No Project Selected'}
          </h1>
          {currentProject?.description && (
            <p className="text-sm text-muted-foreground mt-1">{currentProject.description}</p>
          )}
          {!currentProjectId && (
            <p className="text-sm text-muted-foreground mt-1">
              Select a project from the sidebar or <button onClick={() => navigate('/projects')} className="text-primary underline">create one</button>.
            </p>
          )}
        </div>
        {isOffline && (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-300">
            <WifiOff size={12} className="mr-1" /> Offline
          </Badge>
        )}
      </div>

      {isEmpty && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6 text-center">
          <p className="text-sm text-muted-foreground">No data entered yet. Start adding activities, BOQ items, and manpower records to see your dashboard come alive.</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Overall Progress" value={`${overallProgress}%`} subtitle={`${completedCount}/${activities.length} activities done`} icon={TrendingUp} variant="primary" />
        <StatCard title="Today's Manpower" value={totalManpower} subtitle={`${manpower.length} log entries`} icon={Users} variant="success" />
        <StatCard title="Critical Activities" value={criticalCount} subtitle="On critical path" icon={AlertTriangle} variant="warning" />
        <StatCard title="Open Delays" value={openDelays} subtitle={`${delays.length} total recorded`} icon={CalendarClock} variant={openDelays > 0 ? 'destructive' : 'default'} />
      </div>

      {/* Budget Summary */}
      {boqItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl border shadow-sm p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
            <p className="text-lg font-bold text-foreground">{(totalBudget / 1000000).toFixed(2)}M</p>
          </div>
          <div className="bg-card rounded-xl border shadow-sm p-5">
            <p className="text-xs text-muted-foreground mb-1">Executed Value</p>
            <p className="text-lg font-bold text-foreground">{(totalExecuted / 1000000).toFixed(2)}M</p>
          </div>
          <div className="bg-card rounded-xl border shadow-sm p-5">
            <p className="text-xs text-muted-foreground mb-1">Equipment Cost</p>
            <p className="text-lg font-bold text-foreground">{equipmentCost.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Purchase Orders & Procurement Widget */}
      {(purchaseOrders.length > 0 || procItems.length > 0) && (() => {
        const totalPOValue = purchaseOrders.reduce((s, po) => s + (po.price || 0), 0);
        const draftCount = purchaseOrders.filter(po => po.status === 'draft').length;
        const issuedCount = purchaseOrders.filter(po => po.status === 'issued').length;
        const deliveredCount = purchaseOrders.filter(po => po.status === 'delivered').length;
        const today = new Date().toISOString().split('T')[0];
        const overdueProcItems = procItems.filter(p => p.expected_delivery && p.expected_delivery < today && p.status !== 'received' && !p.actual_delivery);
        const poStatusData = [
          { name: 'Draft', value: draftCount, color: 'hsl(var(--muted-foreground))' },
          { name: 'Issued', value: issuedCount, color: 'hsl(var(--primary))' },
          { name: 'Delivered', value: deliveredCount, color: 'hsl(152, 60%, 42%)' },
          { name: 'Closed', value: purchaseOrders.filter(po => po.status === 'closed').length, color: 'hsl(220, 14%, 70%)' },
        ].filter(s => s.value > 0);

        return (
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border shadow-sm p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><ShoppingCart size={14} /> Total PO Value</div>
                <p className="text-lg font-bold text-foreground">{totalPOValue.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{purchaseOrders.length} purchase orders</p>
              </div>
              <div className="bg-card rounded-xl border shadow-sm p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Package size={14} /> Pending</div>
                <p className="text-lg font-bold text-foreground">{draftCount + issuedCount}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{draftCount} draft · {issuedCount} issued</p>
              </div>
              <div className="bg-card rounded-xl border shadow-sm p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><CheckCircle2 size={14} /> Delivered</div>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{deliveredCount}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{purchaseOrders.length > 0 ? Math.round((deliveredCount / purchaseOrders.length) * 100) : 0}% fulfillment</p>
              </div>
              <div className="bg-card rounded-xl border shadow-sm p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><AlertTriangle size={14} /> Overdue</div>
                <p className={`text-lg font-bold ${overdueProcItems.length > 0 ? 'text-destructive' : 'text-foreground'}`}>{overdueProcItems.length}</p>
                <p className="text-[10px] text-muted-foreground mt-1">past expected delivery</p>
              </div>
            </div>

            {(poStatusData.length > 0 || overdueProcItems.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {poStatusData.length > 0 && (
                  <div className="bg-card rounded-xl border shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-card-foreground mb-4">PO Status Breakdown</h2>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={poStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                          {poStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center mt-2">
                      {poStatusData.map(s => (
                        <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.name} ({s.value})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {overdueProcItems.length > 0 && (
                  <div className="bg-card rounded-xl border shadow-sm p-5">
                    <h2 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2"><Clock size={14} /> Overdue Deliveries</h2>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {overdueProcItems.map((item, i) => {
                        const daysOverdue = Math.ceil((new Date().getTime() - new Date(item.expected_delivery).getTime()) / 86400000);
                        return (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors" onClick={() => navigate('/procurement-digest')}>
                            <span className="text-sm font-medium">{item.material_description}</span>
                            <span className="text-xs font-mono text-destructive font-semibold">{daysOverdue}d overdue</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Charts Row */}
      {(boqItems.length > 0 || activities.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {boqItems.length > 0 && (
            <div className="bg-card rounded-xl border shadow-sm p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold text-card-foreground mb-4">BOQ Progress by Item</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={boqProgress} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={60} fontSize={11} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="executed" stackId="a" fill="hsl(24, 95%, 53%)" radius={[0, 0, 0, 0]} name="Executed" />
                  <Bar dataKey="remaining" stackId="a" fill="hsl(220, 14%, 88%)" radius={[0, 4, 4, 0]} name="Remaining" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activities.length > 0 && (
            <div className="bg-card rounded-xl border shadow-sm p-5">
              <h2 className="text-sm font-semibold text-card-foreground mb-4">Activity Status</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={activityStatus.filter(s => s.value > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {activityStatus.filter(s => s.value > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {activityStatus.map(s => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name} ({s.value})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Critical Activities */}
      {activities.filter(a => a.critical && a.status !== 'completed').length > 0 && (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold text-card-foreground">Active Critical Activities</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>WBS</th>
                  <th>Activity</th>
                  <th>Planned End</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activities.filter(a => a.critical && a.status !== 'completed').map(activity => (
                  <tr key={activity.id}>
                    <td className="font-mono text-xs">{activity.wbs}</td>
                    <td className="font-medium">{activity.name}</td>
                    <td>{activity.plannedEnd}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${activity.percentComplete}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.percentComplete}%</span>
                      </div>
                    </td>
                    <td><span className="badge-critical">Critical</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {canApprove && currentProjectId && (
        <div className="bg-card rounded-xl border shadow-sm p-5 mt-6">
          <DataApproval projectId={currentProjectId} />
        </div>
      )}

      {!canApprove && (
        <div className="mt-6">
          <MyPendingChanges />
        </div>
      )}
    </div>
  );
}
