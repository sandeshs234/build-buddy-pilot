import StatCard from '@/components/StatCard';
import { projectInfo, sampleActivities, sampleBOQ, sampleManpower, sampleDelays } from '@/data/sampleData';
import { CalendarClock, Users, AlertTriangle, TrendingUp, DollarSign, ClipboardCheck, Truck, HardHat } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const criticalCount = sampleActivities.filter(a => a.critical && a.status !== 'completed').length;
const completedCount = sampleActivities.filter(a => a.status === 'completed').length;
const totalManpower = sampleManpower.filter(m => m.date === '2025-03-03').reduce((sum, m) => sum + m.skilled + m.unskilled, 0);
const openDelays = sampleDelays.filter(d => d.status === 'open').length;

const boqProgress = sampleBOQ.map(item => ({
  name: item.code,
  executed: Math.round((item.executedQty / item.totalQty) * 100),
  remaining: Math.round(((item.totalQty - item.executedQty) / item.totalQty) * 100),
}));

const monthlySpend = [
  { month: 'Jan', planned: 8.5, actual: 7.2 },
  { month: 'Feb', planned: 12.8, actual: 14.1 },
  { month: 'Mar', planned: 15.2, actual: 13.8 },
  { month: 'Apr', planned: 18.5, actual: 0 },
  { month: 'May', planned: 22.0, actual: 0 },
];

const activityStatus = [
  { name: 'Completed', value: completedCount, color: 'hsl(152, 60%, 42%)' },
  { name: 'In Progress', value: sampleActivities.filter(a => a.status === 'in-progress').length, color: 'hsl(24, 95%, 53%)' },
  { name: 'Not Started', value: sampleActivities.filter(a => a.status === 'not-started').length, color: 'hsl(220, 14%, 80%)' },
  { name: 'Delayed', value: sampleActivities.filter(a => a.status === 'delayed').length, color: 'hsl(0, 84%, 60%)' },
];

export default function Dashboard() {
  const overallProgress = Math.round(sampleActivities.reduce((sum, a) => sum + a.percentComplete, 0) / sampleActivities.length);

  return (
    <div>
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{projectInfo.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{projectInfo.client} · {projectInfo.location}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Contract Value</p>
          <p className="text-lg font-bold text-foreground">{projectInfo.currency} {(projectInfo.contractValue / 1000000).toFixed(0)}M</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Overall Progress" value={`${overallProgress}%`} subtitle={`${completedCount}/${sampleActivities.length} activities done`} icon={TrendingUp} variant="primary" trend={{ value: 3.2, label: 'this week' }} />
        <StatCard title="Today's Manpower" value={totalManpower} subtitle="Across all zones" icon={Users} variant="success" />
        <StatCard title="Critical Activities" value={criticalCount} subtitle="On critical path" icon={AlertTriangle} variant="warning" />
        <StatCard title="Open Delays" value={openDelays} subtitle={`${sampleDelays.length} total recorded`} icon={CalendarClock} variant={openDelays > 0 ? 'destructive' : 'default'} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* BOQ Progress */}
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

        {/* Activity Status Pie */}
        <div className="bg-card rounded-xl border shadow-sm p-5">
          <h2 className="text-sm font-semibold text-card-foreground mb-4">Activity Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={activityStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {activityStatus.map((entry, i) => (
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
      </div>

      {/* Monthly Spend */}
      <div className="bg-card rounded-xl border shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-card-foreground mb-4">Monthly Expenditure (AED M)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlySpend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
            <XAxis dataKey="month" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="planned" stroke="hsl(215, 25%, 50%)" strokeWidth={2} dot={{ r: 3 }} name="Planned" />
            <Line type="monotone" dataKey="actual" stroke="hsl(24, 95%, 53%)" strokeWidth={2} dot={{ r: 3 }} name="Actual" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activities */}
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
              {sampleActivities.filter(a => a.critical && a.status !== 'completed').map(activity => (
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
                  <td>
                    <span className="badge-critical">Critical</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
