'use client';

import { memo } from 'react';
import { Card } from '@anvix/ui/components/ui/card';
import { Badge } from '@anvix/ui/components/ui/badge';
import { IndianRupee, CalendarDays, BookOpen, Users, TrendingUp } from 'lucide-react';
import type { StudentDetail, StudentFee, FeeSummary } from './types';

function fmt(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface ProgressSectionProps {
  student: StudentDetail;
  fees: StudentFee[];
  summary: FeeSummary | null;
}

export const ProgressSection = memo(function ProgressSection({
  student,
  fees,
}: ProgressSectionProps) {
  const totalNet = fees.reduce((s, f) => s + f.netAmount, 0);
  const totalPaid = fees.reduce((s, f) => s + f.paidAmount, 0);
  const paidPct = totalNet > 0 ? Math.round((totalPaid / totalNet) * 100) : 0;

  const overdueFees = fees.filter((f) => f.status === 'overdue');
  const pendingFees = fees.filter((f) => f.status === 'pending' || f.status === 'partial');

  return (
    <div className="space-y-4">
      {/* Quick glance grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fee progress */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <IndianRupee className="size-4 text-primary" />
            </div>
            <p className="text-sm font-semibold">Fee Progress</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-end justify-between text-sm">
              <span className="text-muted-foreground">{fmt(totalPaid)} paid</span>
              <span className="font-semibold">{paidPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${paidPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {fmt(totalNet - totalPaid)} remaining of {fmt(totalNet)}
            </p>
          </div>

          {overdueFees.length > 0 && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
              <p className="text-xs text-destructive font-medium">
                {overdueFees.length} overdue fee{overdueFees.length > 1 ? 's' : ''} —{' '}
                {fmt(overdueFees.reduce((s, f) => s + (f.netAmount - f.paidAmount), 0))} outstanding
              </p>
            </div>
          )}
        </Card>

        {/* Academics snapshot */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
              <BookOpen className="size-4 text-blue-600" />
            </div>
            <p className="text-sm font-semibold">Academic Snapshot</p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Class</span>
              <span className="font-medium">
                {student.className || 'Unassigned'}
                {student.sectionName ? ` — ${student.sectionName}` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Roll Number</span>
              <span className="font-medium">{student.rollNumber || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Admission Date</span>
              <span className="font-medium">{formatDate(student.admissionDate)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Attendance</span>
              <Badge variant="outline" className="text-xs">
                Coming soon
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b bg-muted/30">
          <p className="text-sm font-semibold">Activity Timeline</p>
        </div>

        <div className="p-6">
          <div className="relative space-y-6 before:absolute before:left-3.75 before:top-2 before:bottom-2 before:w-px before:bg-border">
            {/* Enrolled */}
            <TimelineItem
              icon={<Users className="size-3.5" />}
              title="Enrolled"
              subtitle={`Admission #${student.admissionNumber || '—'}`}
              date={formatDate(student.admissionDate || student.createdAt)}
              color="bg-primary/10 text-primary"
            />

            {/* Guardians linked */}
            {student.guardians.length > 0 && (
              <TimelineItem
                icon={<Users className="size-3.5" />}
                title={`${student.guardians.length} guardian${student.guardians.length > 1 ? 's' : ''} linked`}
                subtitle={student.guardians.map((g) => g.name).join(', ')}
                date=""
                color="bg-muted text-muted-foreground"
              />
            )}

            {/* Fees assigned */}
            {fees.length > 0 && (
              <TimelineItem
                icon={<IndianRupee className="size-3.5" />}
                title={`${fees.length} fee${fees.length > 1 ? 's' : ''} assigned`}
                subtitle={`Total: ${fmt(totalNet)}`}
                date=""
                color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              />
            )}

            {/* Payments progress */}
            {totalPaid > 0 && (
              <TimelineItem
                icon={<TrendingUp className="size-3.5" />}
                title={`${fmt(totalPaid)} collected`}
                subtitle={`${paidPct}% of total fees`}
                date=""
                color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              />
            )}

            {/* Pending items */}
            {pendingFees.length > 0 && (
              <TimelineItem
                icon={<CalendarDays className="size-3.5" />}
                title={`${pendingFees.length} fee${pendingFees.length > 1 ? 's' : ''} pending`}
                subtitle={`Balance: ${fmt(pendingFees.reduce((s, f) => s + (f.netAmount - f.paidAmount), 0))}`}
                date=""
                color="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});

/* ---- Timeline item ---- */

function TimelineItem({
  icon,
  title,
  subtitle,
  date,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  date: string;
  color: string;
}) {
  return (
    <div className="relative flex gap-4 pl-0">
      <div
        className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${color}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {date && <p className="text-xs text-muted-foreground pt-1 shrink-0">{date}</p>}
    </div>
  );
}
