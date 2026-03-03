import { sampleActivities } from '@/data/sampleData';

const statusBadge = (status: string, critical: boolean) => {
  if (status === 'completed') return <span className="badge-success">Completed</span>;
  if (status === 'delayed') return <span className="badge-critical">Delayed</span>;
  if (critical) return <span className="badge-warning">Critical</span>;
  if (status === 'in-progress') return <span className="badge-info">In Progress</span>;
  return <span className="text-xs text-muted-foreground">Not Started</span>;
};

export default function Activities() {
  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activities (CPM)</h1>
          <p className="text-sm text-muted-foreground mt-1">Critical path method schedule with {sampleActivities.length} activities</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>WBS</th>
                <th>Activity Name</th>
                <th>Planned Start</th>
                <th>Planned End</th>
                <th>Actual Start</th>
                <th>Progress</th>
                <th>Predecessors</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sampleActivities.map(a => (
                <tr key={a.id}>
                  <td className="font-mono text-xs font-medium">{a.wbs}</td>
                  <td className="font-medium">{a.name}</td>
                  <td className="text-muted-foreground">{a.plannedStart}</td>
                  <td className="text-muted-foreground">{a.plannedEnd}</td>
                  <td className="text-muted-foreground">{a.actualStart || '—'}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
