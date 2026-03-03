import { useMemo, useState } from 'react';
import { Activity } from '@/types/construction';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GanttChartProps {
  activities: Activity[];
  onEditActivity?: (activity: Activity) => void;
}

export default function GanttChart({ activities, onEditActivity }: GanttChartProps) {
  const [zoom, setZoom] = useState<'weeks' | 'months'>('months');
  const [scrollOffset, setScrollOffset] = useState(0);

  const { startDate, endDate, totalDays, monthHeaders, weekHeaders } = useMemo(() => {
    const dates = activities.flatMap(a => [
      new Date(a.plannedStart),
      new Date(a.plannedEnd),
      ...(a.actualStart ? [new Date(a.actualStart)] : []),
      ...(a.actualEnd ? [new Date(a.actualEnd)] : []),
    ]);
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    // Add padding
    min.setDate(1);
    max.setMonth(max.getMonth() + 2);
    max.setDate(0);

    const totalDays = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));

    // Generate month headers
    const monthHeaders: { label: string; startDay: number; days: number }[] = [];
    const cursor = new Date(min);
    while (cursor < max) {
      const monthStart = new Date(cursor);
      const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
      const startDay = Math.ceil((monthStart.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
      monthHeaders.push({
        label: monthStart.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
        startDay,
        days: daysInMonth,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Generate week headers
    const weekHeaders: { label: string; startDay: number }[] = [];
    const weekCursor = new Date(min);
    weekCursor.setDate(weekCursor.getDate() - weekCursor.getDay()); // align to Sunday
    while (weekCursor < max) {
      const startDay = Math.ceil((weekCursor.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
      weekHeaders.push({
        label: weekCursor.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        startDay: Math.max(0, startDay),
      });
      weekCursor.setDate(weekCursor.getDate() + 7);
    }

    return { startDate: min, endDate: max, totalDays, monthHeaders, weekHeaders };
  }, [activities]);

  const dayWidth = zoom === 'weeks' ? 20 : 6;
  const chartWidth = totalDays * dayWidth;
  const rowHeight = 36;

  const getDayOffset = (dateStr: string) => {
    const d = new Date(dateStr);
    return Math.ceil((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const today = new Date();
  const todayOffset = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Gantt Chart</span>
          <span className="text-xs text-muted-foreground">· {activities.length} activities</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setZoom('months')} className={cn(zoom === 'months' && 'bg-muted')}>
            <ZoomOut size={14} className="mr-1" /> Months
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setZoom('weeks')} className={cn(zoom === 'weeks' && 'bg-muted')}>
            <ZoomIn size={14} className="mr-1" /> Weeks
          </Button>
        </div>
      </div>

      <div className="flex overflow-hidden">
        {/* Left: Activity list */}
        <div className="flex-shrink-0 w-[280px] border-r bg-muted/20">
          <div className="h-[52px] border-b px-3 flex items-end pb-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">WBS / Activity</span>
          </div>
          {activities.map(a => (
            <div
              key={a.id}
              className={cn(
                "flex items-center gap-2 px-3 border-b cursor-pointer hover:bg-muted/40 transition-colors",
                a.critical && "border-l-2 border-l-destructive"
              )}
              style={{ height: rowHeight }}
              onClick={() => onEditActivity?.(a)}
            >
              <span className="font-mono text-[11px] text-muted-foreground w-8 flex-shrink-0">{a.wbs}</span>
              <span className="text-xs font-medium truncate">{a.name}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{a.percentComplete}%</span>
            </div>
          ))}
        </div>

        {/* Right: Chart area */}
        <div className="flex-1 overflow-x-auto">
          <div style={{ width: chartWidth, minWidth: '100%' }}>
            {/* Time header */}
            <div className="h-[52px] border-b relative bg-muted/10">
              {/* Month row */}
              <div className="h-[26px] flex">
                {monthHeaders.map((m, i) => (
                  <div
                    key={i}
                    className="border-r border-b text-[11px] font-semibold text-muted-foreground flex items-center justify-center"
                    style={{ width: m.days * dayWidth, minWidth: m.days * dayWidth }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
              {/* Week row (only in week zoom) */}
              {zoom === 'weeks' && (
                <div className="h-[26px] flex relative">
                  {weekHeaders.map((w, i) => (
                    <div
                      key={i}
                      className="border-r text-[9px] text-muted-foreground flex items-center justify-center"
                      style={{ position: 'absolute', left: w.startDay * dayWidth, width: 7 * dayWidth }}
                    >
                      {w.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bars */}
            <div className="relative">
              {/* Today line */}
              {todayOffset > 0 && todayOffset < totalDays && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-destructive/60 z-10"
                  style={{ left: todayOffset * dayWidth }}
                >
                  <div className="absolute -top-0 left-1 text-[9px] text-destructive font-bold">Today</div>
                </div>
              )}

              {/* Grid lines for months */}
              {monthHeaders.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-border/60"
                  style={{ left: m.startDay * dayWidth, height: activities.length * rowHeight }}
                />
              ))}

              {activities.map((a, idx) => {
                const plannedStart = getDayOffset(a.plannedStart);
                const plannedEnd = getDayOffset(a.plannedEnd);
                const barWidth = Math.max((plannedEnd - plannedStart) * dayWidth, 4);
                const progressWidth = barWidth * (a.percentComplete / 100);

                return (
                  <div
                    key={a.id}
                    className="relative border-b"
                    style={{ height: rowHeight }}
                  >
                    {/* Planned bar */}
                    <div
                      className={cn(
                        "absolute top-[8px] h-[20px] rounded-sm cursor-pointer group",
                        a.critical ? 'bg-destructive/20 border border-destructive/40' : 'bg-primary/15 border border-primary/30'
                      )}
                      style={{ left: plannedStart * dayWidth, width: barWidth }}
                      onClick={() => onEditActivity?.(a)}
                      title={`${a.name}\n${a.plannedStart} → ${a.plannedEnd}\nProgress: ${a.percentComplete}%`}
                    >
                      {/* Progress fill */}
                      <div
                        className={cn(
                          "h-full rounded-sm",
                          a.critical ? 'bg-destructive/60' : 'bg-primary/60'
                        )}
                        style={{ width: progressWidth }}
                      />
                      {/* Label on bar */}
                      {barWidth > 60 && (
                        <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-foreground truncate">
                          {a.name}
                        </span>
                      )}
                    </div>

                    {/* Dependency arrows (predecessors) */}
                    {a.predecessors && (() => {
                      const pred = activities.find(act => act.wbs === a.predecessors);
                      if (!pred) return null;
                      const predEnd = getDayOffset(pred.plannedEnd);
                      return (
                        <svg className="absolute inset-0 pointer-events-none" style={{ width: chartWidth, height: rowHeight }}>
                          <line
                            x1={predEnd * dayWidth}
                            y1={0}
                            x2={plannedStart * dayWidth}
                            y2={rowHeight / 2}
                            stroke="hsl(var(--muted-foreground))"
                            strokeWidth={1}
                            strokeDasharray="3,3"
                            opacity={0.4}
                          />
                          <circle cx={plannedStart * dayWidth} cy={rowHeight / 2} r={2} fill="hsl(var(--muted-foreground))" opacity={0.4} />
                        </svg>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t bg-muted/20 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2.5 rounded-sm bg-destructive/40 border border-destructive/60" />
          Critical Path
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-2.5 rounded-sm bg-primary/30 border border-primary/50" />
          Non-Critical
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-px h-3 bg-destructive/60" />
          Today
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="currentColor" strokeDasharray="3,3" /></svg>
          Dependency
        </div>
      </div>
    </div>
  );
}
