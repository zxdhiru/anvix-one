'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@anvix/ui/components/ui/card';
import {
  IndianRupee,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Banknote,
} from 'lucide-react';
import type { FeeSummary, FeePayment } from './types';
import { fmt, modeIcon } from './utils';

interface OverviewTabProps {
  summary: FeeSummary | null;
  payments: FeePayment[];
}

export const OverviewTab = memo(function OverviewTab({ summary, payments }: OverviewTabProps) {
  if (!summary) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <IndianRupee className="size-5 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-sm font-semibold">No Fee Data Yet</h2>
          <p className="mt-1.5 max-w-xs text-xs text-muted-foreground">
            Start by creating fee heads, then define fee structures for each class.
          </p>
        </CardContent>
      </Card>
    );
  }

  const rate =
    summary.totalExpected > 0
      ? Math.round((summary.totalCollected / summary.totalExpected) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={TrendingUp}
          iconClass="text-blue-600"
          bgClass="bg-blue-50 dark:bg-blue-950/40"
          label="Expected"
          value={fmt(summary.totalExpected)}
        />
        <SummaryCard
          icon={CheckCircle2}
          iconClass="text-emerald-600"
          bgClass="bg-emerald-50 dark:bg-emerald-950/40"
          label="Collected"
          value={fmt(summary.totalCollected)}
          valueClass="text-emerald-600"
        />
        <SummaryCard
          icon={Clock}
          iconClass="text-amber-600"
          bgClass="bg-amber-50 dark:bg-amber-950/40"
          label="Pending"
          value={fmt(summary.totalPending)}
          valueClass="text-amber-600"
        />
        <SummaryCard
          icon={AlertTriangle}
          iconClass="text-rose-600"
          bgClass="bg-rose-50 dark:bg-rose-950/40"
          label="Overdue"
          value={String(summary.overdueCount)}
          valueClass="text-rose-600"
        />
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Collection Rate</span>
            <span className="text-sm font-bold">{rate}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(rate, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground">
            <span>{summary.paidCount} fully paid</span>
            <span>{summary.partialCount} partial</span>
            <span>{summary.overdueCount} overdue</span>
            <span>{summary.studentCount} students</span>
          </div>
        </CardContent>
      </Card>

      {payments.length > 0 && <RecentPayments payments={payments} />}
    </div>
  );
});

/* ---- Sub-components ---- */

const SummaryCard = memo(function SummaryCard({
  icon: Icon,
  iconClass,
  bgClass,
  label,
  value,
  valueClass,
}: {
  icon: typeof TrendingUp;
  iconClass: string;
  bgClass: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2">
          <div className={`flex size-8 items-center justify-center rounded-lg ${bgClass}`}>
            <Icon className={`size-4 ${iconClass}`} />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className={`text-lg font-bold tabular-nums ${valueClass ?? ''}`}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const RecentPayments = memo(function RecentPayments({ payments }: { payments: FeePayment[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Recent Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {payments.slice(0, 5).map((p) => {
            const MI = modeIcon[p.paymentMode] ?? Banknote;
            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-2.5">
                  <MI className="size-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">{p.studentName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.feeHeadName} · {p.receiptNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold tabular-nums text-emerald-600">{fmt(p.amount)}</p>
                  <p className="text-[10px] text-muted-foreground">{p.paymentDate}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
