import { useState } from 'react';
import { useProjectData } from '@/context/ProjectDataContext';
import ModuleGuide from '@/components/ModuleGuide';
import { moduleGuides } from '@/data/moduleGuides';
import { Activity } from '@/types/construction';
import GanttChart from '@/components/GanttChart';
import CPMDiagram from '@/components/CPMDiagram';
import CriticalPathFlow from '@/components/CriticalPathFlow';
import PrimaveraSchedule from '@/components/PrimaveraSchedule';
import ActivityDialog from '@/components/ActivityDialog';
import AIAssistant from '@/components/AIAssistant';
import { Button } from '@/components/ui/button';
import PrintableReport from '@/components/PrintableReport';
import { Plus, BarChart3, Table2, Pencil, Trash2, Bot, Network, Undo2, Trash, CalendarRange, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusBadge = (status: string, critical: boolean) => {
  if (status === 'completed') return <span className="badge-success">Completed</span>;
  if (status === 'delayed') return <span className="badge-critical">Delayed</span>;
  if (critical) return <span className="badge-warning">Critical</span>;
  if (status === 'in-progress') return <span className="badge-info">In Progress</span>;
  return <span className="text-xs text-muted-foreground">Not Started</span>;
};

export default function Activities() {
  const { activities, activitiesOps } = useProjectData();
  const [view, setView] = useState<'gantt' | 'table' | 'cpm' | 'primavera' | 'flow'>('gantt');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const handleSave = (activity: Activity) => activitiesOps.save(activity);
  const handleDelete = (id: string) => activitiesOps.remove(id);

  const handleImport = (data: Record<string, any>[]) => {
    const imported: Activity[] = data.map((row, i) => ({
      id: crypto.randomUUID(),
      wbs: row.wbs || row.WBS || `IMP.${i + 1}`,
      name: row.name || row.Name || row['Activity Name'] || 'Imported Activity',
      plannedStart: row.plannedStart || row['Planned Start'] || '',
      plannedEnd: row.plannedEnd || row['Planned End'] || '',
      actualStart: row.actualStart || row['Actual Start'] || undefined,
      actualEnd: row.actualEnd || row['Actual End'] || undefined,
      percentComplete: Number(row.percentComplete || row.Progress || row['Progress %'] || 0),
      critical: row.critical === true || row.Critical === 'Yes' || row['Critical (Yes/No)'] === 'Yes',
      predecessors: row.predecessors || row.Predecessors || undefined,
      status: (row.status || row.Status || 'not-started') as Activity['status'],
    }));
    activitiesOps.bulkAdd(imported);
  };

  const handleApplyCriticalPath = (criticalIds: string[]) => {
    activitiesOps.setAll(activities.map(a => ({
      ...a,
      critical: criticalIds.includes(a.id) || criticalIds.includes(a.wbs),
    })));
  };

  const handleApplyDependencies = (deps: { from: string; to: string; type: string }[]) => {
    activitiesOps.setAll(activities.map(a => {
      const dep = deps.find(d => d.to === a.wbs);
      if (dep && !a.predecessors) return { ...a, predecessors: dep.from };
      return a;
    }));
  };

  const openEdit = (a: Activity) => { setEditingActivity(a); setDialogOpen(true); };
  const openAdd = () => { setEditingActivity(null); setDialogOpen(true); };

  const excelColumns = [
    { key: 'wbs', label: 'WBS' }, { key: 'name', label: 'Activity Name' },
    { key: 'plannedStart', label: 'Planned Start' }, { key: 'plannedEnd', label: 'Planned End' },
    { key: 'actualStart', label: 'Actual Start' }, { key: 'actualEnd', label: 'Actual End' },
    { key: 'percentComplete', label: 'Progress' }, { key: 'critical', label: 'Critical' },
    { key: 'predecessors', label: 'Predecessors' }, { key: 'status', label: 'Status' },
  ];

  return (
    <div>
      <ModuleGuide moduleName="Activities" description={moduleGuides.Activities.description} steps={moduleGuides.Activities.steps} />
      <div className="page-header flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activities (CPM)</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Critical path method schedule with {activities.length} activities · {activities.filter(a => a.critical).length} on critical path
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={activitiesOps.undo} disabled={!activitiesOps.canUndo} title="Undo">
            <Undo2 size={14} className="mr-1" /> Undo
          </Button>
          <Button variant="ghost" size="sm" onClick={activitiesOps.clearAll} disabled={activities.length === 0} className="text-destructive" title="Clear all">
            <Trash size={14} className="mr-1" /> Clear
          </Button>
          <PrintableReport title="Activities Schedule" columns={[
            { key: 'wbs', label: 'WBS' }, { key: 'name', label: 'Activity' }, { key: 'plannedStart', label: 'Planned Start' },
            { key: 'plannedEnd', label: 'Planned End' }, { key: 'actualStart', label: 'Actual Start' }, { key: 'actualEnd', label: 'Actual End' },
            { key: 'percentComplete', label: 'Progress %' }, { key: 'critical', label: 'Critical' }, { key: 'predecessors', label: 'Predecessors' }, { key: 'status', label: 'Status' },
          ]} data={activities.map(a => ({ ...a, critical: a.critical ? 'Yes' : 'No', actualStart: a.actualStart || '—', actualEnd: a.actualEnd || '—', predecessors: a.predecessors || '—' }))} />
          <Button variant="outline" size="sm" onClick={() => setAiOpen(true)} className="border-primary/30 text-primary hover:bg-primary/5">
            <Bot size={14} className="mr-1" /> AI Assist
          </Button>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button variant="ghost" size="sm" onClick={() => setView('gantt')} className={cn("rounded-none", view === 'gantt' && 'bg-muted')}>
              <BarChart3 size={14} className="mr-1" /> Gantt
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setView('primavera')} className={cn("rounded-none", view === 'primavera' && 'bg-muted')}>
              <CalendarRange size={14} className="mr-1" /> P6
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setView('cpm')} className={cn("rounded-none", view === 'cpm' && 'bg-muted')}>
              <Network size={14} className="mr-1" /> CPM
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setView('flow')} className={cn("rounded-none", view === 'flow' && 'bg-muted')}>
              <GitBranch size={14} className="mr-1" /> Flow
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setView('table')} className={cn("rounded-none", view === 'table' && 'bg-muted')}>
              <Table2 size={14} className="mr-1" /> Table
            </Button>
          </div>
          <Button size="sm" onClick={openAdd}><Plus size={14} className="mr-1" /> Add Activity</Button>
        </div>
      </div>

      {view === 'gantt' ? (
        <GanttChart activities={activities} onEditActivity={openEdit} />
      ) : view === 'cpm' ? (
        <CPMDiagram activities={activities} onEditActivity={openEdit} />
      ) : view === 'flow' ? (
        <CriticalPathFlow activities={activities} onEditActivity={openEdit} />
      ) : view === 'primavera' ? (
        <PrimaveraSchedule activities={activities} onEditActivity={openEdit} />
      ) : (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>WBS</th><th>Activity Name</th><th>Planned Start</th><th>Planned End</th>
                  <th>Actual Start</th><th>Actual End</th><th>Progress</th><th>Predecessors</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(a => (
                  <tr key={a.id}>
                    <td className="font-mono text-xs font-medium">{a.wbs}</td>
                    <td className="font-medium">{a.name}</td>
                    <td className="text-muted-foreground">{a.plannedStart}</td>
                    <td className="text-muted-foreground">{a.plannedEnd}</td>
                    <td className="text-muted-foreground">{a.actualStart || '—'}</td>
                    <td className="text-muted-foreground">{a.actualEnd || '—'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${a.percentComplete}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{a.percentComplete}%</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-muted-foreground">{a.predecessors || '—'}</td>
                    <td>{statusBadge(a.status, a.critical)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(a)}><Pencil size={13} /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(a.id)}><Trash2 size={13} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ActivityDialog open={dialogOpen} onOpenChange={setDialogOpen} activity={editingActivity} onSave={handleSave} onDelete={handleDelete} />
      <AIAssistant open={aiOpen} onOpenChange={setAiOpen} activities={activities} onApplyCriticalPath={handleApplyCriticalPath} onApplyDependencies={handleApplyDependencies} />
    </div>
  );
}
