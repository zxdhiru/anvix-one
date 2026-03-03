'use client';

import { memo } from 'react';
import { Card } from '@anvix/ui/components/ui/card';
import { BookOpen, Trophy, TrendingUp, BarChart3 } from 'lucide-react';

/**
 * Grades section — placeholder until backend Phase 5 (Exams) is ready.
 * Shows polished empty state with summary card placeholders.
 */
export const GradesSection = memo(function GradesSection() {
  const stats = [
    { label: 'Exams Taken', value: '—', icon: BookOpen, color: 'text-foreground' },
    { label: 'Average %', value: '—', icon: BarChart3, color: 'text-blue-600' },
    { label: 'Best Subject', value: '—', icon: Trophy, color: 'text-amber-600' },
    { label: 'Trend', value: '—', icon: TrendingUp, color: 'text-emerald-600' },
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

      {/* Grades placeholder */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/30">
          <p className="text-sm font-semibold">Exam Results</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 mb-4">
            <BookOpen className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Grade reports coming soon</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs">
            Exam scores, subject-wise breakdown, rank, and performance trends will appear here once
            exams are configured.
          </p>
        </div>
      </Card>
    </div>
  );
});
