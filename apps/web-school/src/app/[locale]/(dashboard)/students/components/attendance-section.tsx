'use client';

import { memo } from 'react';
import { Card } from '@anvix/ui/components/ui/card';
import { CalendarDays, Clock, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Attendance section — placeholder until backend Phase 3 is ready.
 * Shows a polished empty state with mock summary cards.
 */
export const AttendanceSection = memo(function AttendanceSection() {
  const stats = [
    { label: 'Total Days', value: '—', icon: CalendarDays, color: 'text-foreground' },
    { label: 'Present', value: '—', icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Absent', value: '—', icon: XCircle, color: 'text-destructive' },
    { label: 'Late', value: '—', icon: Clock, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-4">
      {/* Stat placeholders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="px-4 py-3 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <s.icon className="size-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-sm font-semibold tabular-nums ${s.color}`}>{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Calendar placeholder */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/30">
          <p className="text-sm font-semibold">Monthly Attendance</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 mb-4">
            <CalendarDays className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Attendance tracking coming soon</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            Daily attendance records, monthly calendars, and trend analysis will appear here once
            enabled.
          </p>
        </div>
      </Card>
    </div>
  );
});
