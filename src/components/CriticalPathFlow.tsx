import { useMemo } from 'react';
import { Activity } from '@/types/construction';
import { AlertTriangle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface CriticalPathFlowProps {
  activities: Activity[];
  onEditActivity?: (activity: Activity) => void;
}

interface FlowNode {
  activity: Activity;
  duration: number;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  tf: number;
  isCritical: boolean;
}

export default function CriticalPathFlow({ activities, onEditActivity }: CriticalPathFlowProps) {
  const { criticalPath, nonCritical, projectDuration, connections } = useMemo(() => {
    if (activities.length === 0) return { criticalPath: [], nonCritical: [], projectDuration: 0, connections: [] };

    const predMap = new Map<string, string[]>();
    const succMap = new Map<string, string[]>();
    const durMap = new Map<string, number>();

    activities.forEach(a => {
      const start = new Date(a.plannedStart);
      const end = new Date(a.plannedEnd);
      const dur = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      durMap.set(a.wbs, dur);

      const preds = a.predecessors?.split(',').map(s => s.trim()).filter(Boolean) || [];
      predMap.set(a.wbs, preds);
      preds.forEach(p => {
        if (!succMap.has(p)) succMap.set(p, []);
        succMap.get(p)!.push(a.wbs);
      });
    });

    // Topological levels
    const levels = new Map<string, number>();
    const getLevel = (wbs: string, visited = new Set<string>()): number => {
      if (levels.has(wbs)) return levels.get(wbs)!;
      if (visited.has(wbs)) return 0;
      visited.add(wbs);
      const preds = predMap.get(wbs) || [];
      const lvl = preds.length === 0 ? 0 : Math.max(...preds.map(p => getLevel(p, visited) + 1));
      levels.set(wbs, lvl);
      return lvl;
    };
    activities.forEach(a => getLevel(a.wbs));

    const maxLevel = Math.max(...Array.from(levels.values()), 0);
    const levelGroups = new Map<number, Activity[]>();
    activities.forEach(a => {
      const lvl = levels.get(a.wbs) || 0;
      if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
      levelGroups.get(lvl)!.push(a);
    });

    // Forward pass
    const esMap = new Map<string, number>();
    const efMap = new Map<string, number>();
    for (let lvl = 0; lvl <= maxLevel; lvl++) {
      (levelGroups.get(lvl) || []).forEach(a => {
        const preds = predMap.get(a.wbs) || [];
        const es = preds.length === 0 ? 0 : Math.max(...preds.map(p => efMap.get(p) || 0));
        esMap.set(a.wbs, es);
        efMap.set(a.wbs, es + (durMap.get(a.wbs) || 0));
      });
    }

    // Backward pass
    const projectDuration = Math.max(...Array.from(efMap.values()));
    const lsMap = new Map<string, number>();
    const lfMap = new Map<string, number>();
    for (let lvl = maxLevel; lvl >= 0; lvl--) {
      (levelGroups.get(lvl) || []).forEach(a => {
        const succs = succMap.get(a.wbs) || [];
        const lf = succs.length === 0 ? projectDuration : Math.min(...succs.map(s => lsMap.get(s) || projectDuration));
        lfMap.set(a.wbs, lf);
        lsMap.set(a.wbs, lf - (durMap.get(a.wbs) || 0));
      });
    }

    // Build flow nodes
    const allNodes: FlowNode[] = activities.map(a => {
      const es = esMap.get(a.wbs) || 0;
      const ls = lsMap.get(a.wbs) || 0;
      return {
        activity: a,
        duration: durMap.get(a.wbs) || 0,
        es,
        ef: efMap.get(a.wbs) || 0,
        ls,
        lf: lfMap.get(a.wbs) || 0,
        tf: ls - es,
        isCritical: ls - es === 0,
      };
    });

    const criticalPath = allNodes.filter(n => n.isCritical).sort((a, b) => a.es - b.es);
    const nonCritical = allNodes.filter(n => !n.isCritical).sort((a, b) => a.es - b.es);

    // Build connections for critical path
    const connections: { fromWbs: string; toWbs: string }[] = [];
    criticalPath.forEach(node => {
      const preds = predMap.get(node.activity.wbs) || [];
      preds.forEach(p => {
        if (criticalPath.some(n => n.activity.wbs === p)) {
          connections.push({ fromWbs: p, toWbs: node.activity.wbs });
        }
      });
    });

    return { criticalPath, nonCritical, projectDuration, connections };
  }, [activities]);

  if (activities.length === 0) {
    return (
      <div className="bg-card rounded-xl border shadow-sm p-12 text-center text-muted-foreground">
        No activities to display. Add activities to see the critical path.
      </div>
    );
  }

  const statusIcon = (status: string, pct: number) => {
    if (status === 'completed') return <CheckCircle2 size={14} className="text-emerald-500" />;
    if (status === 'delayed') return <AlertTriangle size={14} className="text-destructive" />;
    if (status === 'in-progress') return <Clock size={14} className="text-amber-500" />;
    return <Clock size={14} className="text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Total Duration</p>
          <p className="text-lg font-bold text-foreground">{projectDuration} days</p>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-xs text-destructive">Critical Activities</p>
          <p className="text-lg font-bold text-destructive">{criticalPath.length}</p>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Non-Critical</p>
          <p className="text-lg font-bold text-foreground">{nonCritical.length}</p>
        </div>
        <div className="bg-card rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Avg Float</p>
          <p className="text-lg font-bold text-foreground">
            {nonCritical.length > 0 ? Math.round(nonCritical.reduce((s, n) => s + n.tf, 0) / nonCritical.length) : 0} days
          </p>
        </div>
      </div>

      {/* Critical Path Flow */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-destructive/5 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-semibold text-foreground">Critical Path</span>
          <span className="text-xs text-muted-foreground ml-1">— Zero float, any delay extends the project</span>
        </div>

        <div className="p-4 overflow-x-auto">
          {criticalPath.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No critical path identified. Ensure activities have predecessors defined.</p>
          ) : (
            <div className="flex items-center gap-1 min-w-max">
              {/* Start node */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                <span className="text-[10px] font-bold text-emerald-600">START</span>
              </div>

              {criticalPath.map((node, idx) => (
                <div key={node.activity.id} className="flex items-center gap-1">
                  {/* Arrow */}
                  <ArrowRight size={20} className="text-destructive flex-shrink-0" />

                  {/* Activity Card */}
                  <div
                    className="flex-shrink-0 w-48 border-2 border-destructive rounded-lg bg-destructive/5 hover:bg-destructive/10 cursor-pointer transition-colors overflow-hidden"
                    onClick={() => onEditActivity?.(node.activity)}
                  >
                    {/* Header */}
                    <div className="bg-destructive/10 px-3 py-1.5 flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-destructive">{node.activity.wbs}</span>
                      <div className="flex items-center gap-1">
                        {statusIcon(node.activity.status, node.activity.percentComplete)}
                        <span className="text-[10px] font-medium">{node.activity.percentComplete}%</span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-3 py-2 space-y-1.5">
                      <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
                        {node.activity.name}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{node.duration}d</span>
                        <span>Day {node.es}–{node.ef}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-destructive rounded-full transition-all"
                          style={{ width: `${node.activity.percentComplete}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Arrow to end */}
              <ArrowRight size={20} className="text-destructive flex-shrink-0" />

              {/* End node */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center">
                <span className="text-[10px] font-bold text-destructive">END</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Non-Critical Activities */}
      {nonCritical.length > 0 && (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary/60" />
            <span className="text-sm font-semibold text-foreground">Non-Critical Activities</span>
            <span className="text-xs text-muted-foreground ml-1">— Have float, can be delayed without affecting project end</span>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nonCritical.map(node => (
              <div
                key={node.activity.id}
                className="border rounded-lg p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onEditActivity?.(node.activity)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-primary">{node.activity.wbs}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Float: {node.tf}d</span>
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight mb-1 line-clamp-1">{node.activity.name}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{node.duration}d · Day {node.es}–{node.ef}</span>
                  <span>{node.activity.percentComplete}%</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-primary/60 rounded-full" style={{ width: `${node.activity.percentComplete}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
