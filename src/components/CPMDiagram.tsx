import { useMemo } from 'react';
import { Activity } from '@/types/construction';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface CPMDiagramProps {
  activities: Activity[];
  onEditActivity?: (activity: Activity) => void;
}

interface Node {
  activity: Activity;
  x: number;
  y: number;
  es: number; // early start
  ef: number; // early finish
  ls: number; // late start
  lf: number; // late finish
  tf: number; // total float
  duration: number;
  level: number;
  warning?: string;
}

export default function CPMDiagram({ activities, onEditActivity }: CPMDiagramProps) {
  const { nodes, connections, warnings } = useMemo(() => {
    if (activities.length === 0) return { nodes: [], connections: [], warnings: [] };

    const today = new Date();
    const warnings: string[] = [];

    // Calculate durations in days
    const actMap = new Map<string, Activity>();
    activities.forEach(a => actMap.set(a.wbs, a));

    // Build adjacency for predecessors
    const predMap = new Map<string, string[]>();
    const succMap = new Map<string, string[]>();
    activities.forEach(a => {
      const preds = a.predecessors?.split(',').map(s => s.trim()).filter(Boolean) || [];
      predMap.set(a.wbs, preds);
      preds.forEach(p => {
        if (!succMap.has(p)) succMap.set(p, []);
        succMap.get(p)!.push(a.wbs);
      });
    });

    // Topological sort by levels
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

    // Group by level
    const levelGroups = new Map<number, Activity[]>();
    activities.forEach(a => {
      const lvl = levels.get(a.wbs) || 0;
      if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
      levelGroups.get(lvl)!.push(a);
    });

    const maxLevel = Math.max(...Array.from(levels.values()), 0);
    const nodeWidth = 200;
    const nodeHeight = 100;
    const hGap = 80;
    const vGap = 40;

    // Forward pass (ES, EF)
    const esMap = new Map<string, number>();
    const efMap = new Map<string, number>();
    const durMap = new Map<string, number>();

    activities.forEach(a => {
      const start = new Date(a.plannedStart);
      const end = new Date(a.plannedEnd);
      const dur = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      durMap.set(a.wbs, dur);
    });

    for (let lvl = 0; lvl <= maxLevel; lvl++) {
      (levelGroups.get(lvl) || []).forEach(a => {
        const preds = predMap.get(a.wbs) || [];
        const es = preds.length === 0 ? 0 : Math.max(...preds.map(p => efMap.get(p) || 0));
        esMap.set(a.wbs, es);
        efMap.set(a.wbs, es + (durMap.get(a.wbs) || 0));
      });
    }

    // Backward pass (LS, LF)
    const projectEnd = Math.max(...Array.from(efMap.values()));
    const lsMap = new Map<string, number>();
    const lfMap = new Map<string, number>();

    for (let lvl = maxLevel; lvl >= 0; lvl--) {
      (levelGroups.get(lvl) || []).forEach(a => {
        const succs = succMap.get(a.wbs) || [];
        const lf = succs.length === 0 ? projectEnd : Math.min(...succs.map(s => lsMap.get(s) || projectEnd));
        lfMap.set(a.wbs, lf);
        lsMap.set(a.wbs, lf - (durMap.get(a.wbs) || 0));
      });
    }

    // Build nodes
    const nodes: Node[] = [];
    const levelCounts = new Map<number, number>();

    activities.forEach(a => {
      const lvl = levels.get(a.wbs) || 0;
      const idx = levelCounts.get(lvl) || 0;
      levelCounts.set(lvl, idx + 1);

      const es = esMap.get(a.wbs) || 0;
      const ef = efMap.get(a.wbs) || 0;
      const ls = lsMap.get(a.wbs) || 0;
      const lf = lfMap.get(a.wbs) || 0;
      const tf = ls - es;
      const dur = durMap.get(a.wbs) || 0;

      let warning: string | undefined;
      if (a.status === 'delayed') {
        warning = 'Activity is delayed!';
        warnings.push(`${a.wbs} ${a.name}: Delayed`);
      } else if (a.status === 'in-progress' && a.actualStart) {
        const planned = new Date(a.plannedEnd);
        const expectedProgress = Math.min(100, Math.max(0,
          ((today.getTime() - new Date(a.actualStart).getTime()) / (planned.getTime() - new Date(a.actualStart).getTime())) * 100
        ));
        if (a.percentComplete < expectedProgress - 15) {
          warning = `Behind schedule (${Math.round(expectedProgress - a.percentComplete)}% behind)`;
          warnings.push(`${a.wbs} ${a.name}: ${warning}`);
        }
      } else if (a.status === 'not-started' && new Date(a.plannedStart) < today) {
        warning = 'Should have started!';
        warnings.push(`${a.wbs} ${a.name}: Not started but past planned start`);
      }

      nodes.push({
        activity: a,
        x: lvl * (nodeWidth + hGap) + 40,
        y: idx * (nodeHeight + vGap) + 40,
        es, ef, ls, lf, tf, duration: dur, level: lvl, warning,
      });
    });

    // Build connections
    const nodeMap = new Map<string, Node>();
    nodes.forEach(n => nodeMap.set(n.activity.wbs, n));

    const connections: { from: Node; to: Node; critical: boolean }[] = [];
    activities.forEach(a => {
      const preds = predMap.get(a.wbs) || [];
      const toNode = nodeMap.get(a.wbs);
      if (!toNode) return;
      preds.forEach(p => {
        const fromNode = nodeMap.get(p);
        if (fromNode) {
          connections.push({
            from: fromNode,
            to: toNode,
            critical: fromNode.tf === 0 && toNode.tf === 0,
          });
        }
      });
    });

    return { nodes, connections, warnings };
  }, [activities]);

  if (activities.length === 0) {
    return (
      <div className="bg-card rounded-xl border shadow-sm p-12 text-center text-muted-foreground">
        No activities to display. Add activities to see the CPM network diagram.
      </div>
    );
  }

  const svgWidth = Math.max(800, ...nodes.map(n => n.x + 240));
  const svgHeight = Math.max(400, ...nodes.map(n => n.y + 140));

  return (
    <div className="space-y-3">
      {/* Warnings Panel */}
      {warnings.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle size={16} className="text-destructive" />
            <span className="text-sm font-semibold text-destructive">Schedule Warnings ({warnings.length})</span>
          </div>
          <ul className="text-xs text-destructive/80 space-y-0.5 pl-6 list-disc">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-foreground">CPM Network Diagram</span>
            <span className="text-xs text-muted-foreground ml-2">
              · {nodes.filter(n => n.tf === 0).length} critical · {nodes.filter(n => n.tf > 0).length} non-critical
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm bg-destructive/40 border-2 border-destructive" />
              Critical
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm bg-primary/20 border-2 border-primary/50" />
              Non-Critical
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-amber-500" />
              Warning
            </div>
          </div>
        </div>

        <div className="overflow-auto max-h-[600px]">
          <svg width={svgWidth} height={svgHeight} className="min-w-full">
            {/* Connections */}
            {connections.map((c, i) => {
              const x1 = c.from.x + 200;
              const y1 = c.from.y + 50;
              const x2 = c.to.x;
              const y2 = c.to.y + 50;
              const midX = (x1 + x2) / 2;

              return (
                <g key={i}>
                  <path
                    d={`M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`}
                    fill="none"
                    stroke={c.critical ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'}
                    strokeWidth={c.critical ? 2.5 : 1.5}
                    strokeDasharray={c.critical ? '' : '5,5'}
                    opacity={c.critical ? 0.8 : 0.4}
                  />
                  {/* Arrow */}
                  <polygon
                    points={`${x2},${y2} ${x2 - 8},${y2 - 4} ${x2 - 8},${y2 + 4}`}
                    fill={c.critical ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'}
                    opacity={c.critical ? 0.8 : 0.4}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const isCritical = node.tf === 0;
              return (
                <g
                  key={node.activity.id}
                  className="cursor-pointer"
                  onClick={() => onEditActivity?.(node.activity)}
                >
                  {/* Node box */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={200}
                    height={100}
                    rx={8}
                    fill={isCritical ? 'hsl(var(--destructive) / 0.08)' : 'hsl(var(--primary) / 0.06)'}
                    stroke={isCritical ? 'hsl(var(--destructive))' : 'hsl(var(--primary) / 0.5)'}
                    strokeWidth={isCritical ? 2.5 : 1.5}
                  />
                  {/* Warning indicator */}
                  {node.warning && (
                    <g>
                      <circle cx={node.x + 190} cy={node.y + 10} r={8} fill="hsl(45 93% 47%)" />
                      <text x={node.x + 190} y={node.y + 14} textAnchor="middle" fontSize="11" fontWeight="bold" fill="white">!</text>
                    </g>
                  )}
                  {/* Header: WBS */}
                  <text x={node.x + 100} y={node.y + 16} textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(var(--muted-foreground))">
                    {node.activity.wbs}
                  </text>
                  {/* Activity name */}
                  <text x={node.x + 100} y={node.y + 32} textAnchor="middle" fontSize="11" fontWeight="700" fill="hsl(var(--foreground))">
                    {node.activity.name.length > 22 ? node.activity.name.slice(0, 22) + '…' : node.activity.name}
                  </text>
                  {/* Duration */}
                  <text x={node.x + 100} y={node.y + 48} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">
                    Dur: {node.duration}d · {node.activity.percentComplete}%
                  </text>
                  {/* ES/EF row */}
                  <line x1={node.x} y1={node.y + 56} x2={node.x + 200} y2={node.y + 56} stroke="hsl(var(--border))" strokeWidth={0.5} />
                  <text x={node.x + 10} y={node.y + 70} fontSize="9" fill="hsl(var(--muted-foreground))">
                    ES:{node.es}
                  </text>
                  <text x={node.x + 100} y={node.y + 70} textAnchor="middle" fontSize="9" fontWeight="600" fill={isCritical ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}>
                    TF:{node.tf}
                  </text>
                  <text x={node.x + 190} y={node.y + 70} textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))">
                    EF:{node.ef}
                  </text>
                  {/* LS/LF row */}
                  <text x={node.x + 10} y={node.y + 85} fontSize="9" fill="hsl(var(--muted-foreground))">
                    LS:{node.ls}
                  </text>
                  <text x={node.x + 190} y={node.y + 85} textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))">
                    LF:{node.lf}
                  </text>
                  {/* Progress bar */}
                  <rect x={node.x + 10} y={node.y + 90} width={180} height={4} rx={2} fill="hsl(var(--muted))" />
                  <rect x={node.x + 10} y={node.y + 90} width={180 * node.activity.percentComplete / 100} height={4} rx={2}
                    fill={isCritical ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}