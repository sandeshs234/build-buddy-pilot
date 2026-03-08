import { useMemo } from 'react';
import { Activity } from '@/types/construction';
import { cn } from '@/lib/utils';

interface Props {
  activities: Activity[];
  onEditActivity?: (a: Activity) => void;
}

export default function PrimaveraSchedule({ activities, onEditActivity }: Props) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const { startDate, totalDays } = useMemo(() => {
    if (activities.length === 0) return { startDate: new Date(), totalDays: 365 };
    const dates = activities.flatMap(a => [new Date(a.plannedStart), new Date(a.plannedEnd)]);
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    min.setDate(1);
    max.setMonth(max.getMonth() + 2);
    return { startDate: min, totalDays: Math.ceil((max.getTime() - min.getTime()) / 86400000) };
  }, [activities]);

  const dayWidth = 4;
  const rowHeight = 40;

  const getDayOffset = (dateStr: string) => {
    const d = new Date(dateStr);
    return Math.ceil((d.getTime() - startDate.getTime()) / 86400000);
  };

  const todayOffset = getDayOffset(todayStr);

  // Generate month headers
  const months = useMemo(() => {
    const result: { label: string; startDay: number; days: number }[] = [];
    const cursor = new Date(startDate);
    const end = new Date(startDate.getTime() + totalDays * 86400000);
    while (cursor < end) {
      const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
      const sd = Math.ceil((cursor.getTime() - startDate.getTime()) / 86400000);
      result.push({ label: cursor.toLocaleDateString('en', { month: 'short', year: '2-digit' }), startDay: sd, days: daysInMonth });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
  }, [startDate, totalDays]);

  const getDuration = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.ceil((e.getTime() - s.getTime()) / 86400000);
  };

  const getVariance = (a: Activity) => {
    if (!a.actualStart) return null;
    const plannedDays = getDuration(a.plannedStart, a.plannedEnd);
    const elapsed = getDuration(a.actualStart, a.actualEnd || todayStr);
    const expectedProgress = a.actualEnd ? 100 : Math.min(100, Math.round((elapsed / plannedDays) * 100));
    return a.percentComplete - expectedProgress;
  };

  if (activities.length === 0) {
    return (
      <div className="bg-card rounded-xl border shadow-sm p-12 text-center text-muted-foreground">
        No activities to display. Add activities to see the Primavera-style schedule.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div>
          <span className="text-sm font-semibold text-foreground">Primavera P6 Style Schedule</span>
          <span className="text-xs text-muted-foreground ml-2">Planned vs Actual Progress Tracking</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1"><div className="w-4 h-2 bg-primary/60 rounded-sm" /> Planned</div>
          <div className="flex items-center gap-1"><div className="w-4 h-2 bg-chart-1 rounded-sm" /> Actual</div>
          <div className="flex items-center gap-1"><div className="w-4 h-2 bg-destructive/60 rounded-sm" /> Critical</div>
          <div className="flex items-center gap-1"><div className="w-px h-3 bg-destructive" /> Data Date</div>
        </div>
      </div>

      <div className="flex overflow-hidden">
        {/* Left Panel - Tabular Data */}
        <div className="flex-shrink-0 w-[520px] border-r overflow-x-auto">
          <div className="h-[40px] border-b bg-muted/40 flex items-center">
            <div className="w-[50px] px-2 text-[10px] font-semibold text-muted-foreground">WBS</div>
            <div className="w-[140px] px-2 text-[10px] font-semibold text-muted-foreground">Activity Name</div>
            <div className="w-[70px] px-2 text-[10px] font-semibold text-muted-foreground">Start</div>
            <div className="w-[70px] px-2 text-[10px] font-semibold text-muted-foreground">Finish</div>
            <div className="w-[55px] px-2 text-[10px] font-semibold text-muted-foreground">Dur.</div>
            <div className="w-[45px] px-2 text-[10px] font-semibold text-muted-foreground">%</div>
            <div className="w-[70px] px-2 text-[10px] font-semibold text-muted-foreground">Variance</div>
          </div>
          {activities.map(a => {
            const dur = getDuration(a.plannedStart, a.plannedEnd);
            const variance = getVariance(a);
            return (
              <div
                key={a.id}
                className={cn(
                  "flex items-center border-b cursor-pointer hover:bg-muted/30 transition-colors",
                  a.critical && "bg-destructive/5"
                )}
                style={{ height: rowHeight }}
                onClick={() => onEditActivity?.(a)}
              >
                <div className="w-[50px] px-2 font-mono text-[10px] text-muted-foreground">{a.wbs}</div>
                <div className={cn("w-[140px] px-2 text-[11px] truncate", a.critical ? "font-semibold text-destructive" : "font-medium")}>{a.name}</div>
                <div className="w-[70px] px-2 text-[10px] text-muted-foreground">{a.plannedStart.slice(5)}</div>
                <div className="w-[70px] px-2 text-[10px] text-muted-foreground">{a.plannedEnd.slice(5)}</div>
                <div className="w-[55px] px-2 text-[10px] font-mono">{dur}d</div>
                <div className="w-[45px] px-2">
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${a.percentComplete}%` }} />
                    </div>
                    <span className="text-[9px] font-mono">{a.percentComplete}</span>
                  </div>
                </div>
                <div className="w-[70px] px-2">
                  {variance !== null && (
                    <span className={cn(
                      "text-[10px] font-mono font-medium",
                      variance > 0 ? "text-green-600" : variance < -5 ? "text-destructive" : "text-amber-600"
                    )}>
                      {variance > 0 ? '+' : ''}{variance}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Panel - Bar Chart */}
        <div className="flex-1 overflow-x-auto">
          <div style={{ width: totalDays * dayWidth, minWidth: '100%' }}>
            {/* Month headers */}
            <div className="h-[40px] border-b bg-muted/40 flex">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="border-r text-[10px] font-semibold text-muted-foreground flex items-center justify-center"
                  style={{ width: m.days * dayWidth, minWidth: m.days * dayWidth }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* Bars */}
            <div className="relative">
              {/* Data date line */}
              {todayOffset > 0 && todayOffset < totalDays && (
                <div className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10" style={{ left: todayOffset * dayWidth, height: activities.length * rowHeight }}>
                  <div className="absolute -top-5 left-1 text-[8px] font-bold text-destructive whitespace-nowrap">Data Date</div>
                </div>
              )}

              {/* Month grid lines */}
              {months.map((m, i) => (
                <div key={i} className="absolute top-0 w-px bg-border/40" style={{ left: m.startDay * dayWidth, height: activities.length * rowHeight }} />
              ))}

              {activities.map((a) => {
                const pStart = getDayOffset(a.plannedStart);
                const pEnd = getDayOffset(a.plannedEnd);
                const plannedWidth = Math.max((pEnd - pStart) * dayWidth, 4);

                const aStart = a.actualStart ? getDayOffset(a.actualStart) : null;
                const aEnd = a.actualEnd ? getDayOffset(a.actualEnd) : getDayOffset(todayStr);
                const actualWidth = aStart !== null ? Math.max((aEnd - aStart) * dayWidth, 4) : 0;
                const progressWidth = actualWidth * (a.percentComplete / 100);

                return (
                  <div key={a.id} className="relative border-b" style={{ height: rowHeight }}>
                    {/* Planned bar (top) */}
                    <div
                      className={cn(
                        "absolute top-[6px] h-[12px] rounded-sm opacity-70",
                        a.critical ? "bg-destructive/40 border border-destructive/60" : "bg-primary/30 border border-primary/40"
                      )}
                      style={{ left: pStart * dayWidth, width: plannedWidth }}
                      title={`Planned: ${a.plannedStart} → ${a.plannedEnd}`}
                    />

                    {/* Actual bar (bottom) */}
                    {aStart !== null && (
                      <div
                        className="absolute top-[22px] h-[12px] rounded-sm bg-muted border border-border"
                        style={{ left: aStart * dayWidth, width: actualWidth }}
                        title={`Actual: ${a.actualStart} → ${a.actualEnd || 'ongoing'}`}
                      >
                        <div
                          className={cn("h-full rounded-sm", a.critical ? "bg-destructive/70" : "bg-chart-1")}
                          style={{ width: progressWidth }}
                        />
                      </div>
                    )}

                    {/* Activity label */}
                    {plannedWidth > 50 && (
                      <span
                        className="absolute text-[9px] font-medium text-foreground/70 truncate pointer-events-none"
                        style={{ left: pStart * dayWidth + 4, top: 7, maxWidth: plannedWidth - 8 }}
                      >
                        {a.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
