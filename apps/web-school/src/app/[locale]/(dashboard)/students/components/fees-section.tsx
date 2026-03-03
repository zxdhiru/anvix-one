'use client';

import { memo } from 'react';
import { Badge } from '@anvix/ui/components/ui/badge';
import { Card } from '@anvix/ui/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@anvix/ui/components/ui/table';
import { IndianRupee, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import type { StudentFee, FeePayment, FeeSummary } from './types';

function fmt(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function statusBadge(status: string) {
  const map: Record<string, { v: 'default' | 'secondary' | 'destructive' | 'outline'; l: string }> =
    {
      pending: { v: 'outline', l: 'Pending' },
      partial: { v: 'secondary', l: 'Partial' },
      paid: { v: 'default', l: 'Paid' },
      overdue: { v: 'destructive', l: 'Overdue' },
      waived: { v: 'outline', l: 'Waived' },
    };
  const s = map[status] ?? { v: 'outline' as const, l: status };
  return (
    <Badge variant={s.v} className="text-xs px-2 py-0.5">
      {s.l}
    </Badge>
  );
}

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface FeesSectionProps {
  fees: StudentFee[];
  payments: FeePayment[];
  summary: FeeSummary | null;
}

export const FeesSection = memo(function FeesSection({
  fees,
  payments,
  summary,
}: FeesSectionProps) {
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {summary && <FeeSummaryCards summary={summary} />}

      {/* Fees table */}
      <Card className="overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b bg-muted/30">
          <p className="text-sm font-semibold">Fee Breakup</p>
        </div>

        <Table className="flex-1">
          <TableHeader className="bg-muted/20">
            <TableRow className="h-11 border-b">
              <TableHead className="px-6 text-sm font-semibold">Fee Head</TableHead>
              <TableHead className="px-4 text-sm font-semibold text-right">Amount</TableHead>
              <TableHead className="px-4 text-sm font-semibold text-right">Discount</TableHead>
              <TableHead className="px-4 text-sm font-semibold text-right">Net</TableHead>
              <TableHead className="px-4 text-sm font-semibold text-right">Paid</TableHead>
              <TableHead className="px-4 text-sm font-semibold text-right">Balance</TableHead>
              <TableHead className="px-4 text-sm font-semibold">Due</TableHead>
              <TableHead className="px-6 text-sm font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="min-h-40">
            {fees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-40 text-center text-sm text-muted-foreground align-middle"
                >
                  No fees assigned yet.
                </TableCell>
              </TableRow>
            ) : (
              fees.map((f) => (
                <TableRow key={f.id} className="h-12 border-b hover:bg-muted/40 transition-colors">
                  <TableCell className="px-6 text-sm font-medium">{f.feeHeadName || '—'}</TableCell>
                  <TableCell className="px-4 text-sm tabular-nums text-right">
                    {fmt(f.originalAmount)}
                  </TableCell>
                  <TableCell className="px-4 text-sm tabular-nums text-right text-muted-foreground">
                    {f.discountAmount > 0 ? `-${fmt(f.discountAmount)}` : '—'}
                  </TableCell>
                  <TableCell className="px-4 text-sm font-medium tabular-nums text-right">
                    {fmt(f.netAmount)}
                  </TableCell>
                  <TableCell className="px-4 text-sm tabular-nums text-right text-emerald-600">
                    {fmt(f.paidAmount)}
                  </TableCell>
                  <TableCell className="px-4 text-sm font-semibold tabular-nums text-right">
                    {fmt(f.netAmount - f.paidAmount)}
                  </TableCell>
                  <TableCell className="px-4 text-sm text-muted-foreground">
                    {formatDate(f.dueDate)}
                  </TableCell>
                  <TableCell className="px-6">{statusBadge(f.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          {fees.length > 0 && (
            <tfoot>
              <tr className="border-t bg-muted/20">
                <td className="px-6 py-3 text-xs font-semibold">Total</td>
                <td className="px-4 py-3 text-xs tabular-nums text-right font-semibold">
                  {fmt(fees.reduce((s, f) => s + f.originalAmount, 0))}
                </td>
                <td className="px-4 py-3 text-xs tabular-nums text-right text-muted-foreground">
                  {fmt(fees.reduce((s, f) => s + f.discountAmount, 0))}
                </td>
                <td className="px-4 py-3 text-xs tabular-nums text-right font-semibold">
                  {fmt(fees.reduce((s, f) => s + f.netAmount, 0))}
                </td>
                <td className="px-4 py-3 text-xs tabular-nums text-right text-emerald-600 font-semibold">
                  {fmt(fees.reduce((s, f) => s + f.paidAmount, 0))}
                </td>
                <td className="px-4 py-3 text-xs tabular-nums text-right font-bold">
                  {fmt(fees.reduce((s, f) => s + (f.netAmount - f.paidAmount), 0))}
                </td>
                <td colSpan={2} className="px-4 py-3 text-xs text-muted-foreground">
                  {fees.length} item{fees.length > 1 ? 's' : ''}
                </td>
              </tr>
            </tfoot>
          )}
        </Table>
      </Card>

      {/* Recent payments */}
      {payments.length > 0 && <PaymentsCard payments={payments} />}
    </div>
  );
});

/* ---- Summary stat cards ---- */

const FeeSummaryCards = memo(function FeeSummaryCards({ summary }: { summary: FeeSummary }) {
  const cards = [
    {
      label: 'Total Fees',
      value: fmt(summary.totalExpected),
      icon: IndianRupee,
      color: 'text-foreground',
    },
    {
      label: 'Paid',
      value: fmt(summary.totalCollected),
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
    {
      label: 'Pending',
      value: fmt(summary.totalPending),
      icon: Clock,
      color: 'text-amber-600',
    },
    {
      label: 'Overdue',
      value: fmt(summary.totalOverdue),
      icon: AlertTriangle,
      color: 'text-destructive',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <Card key={c.label} className="px-4 py-3 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <c.icon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-sm font-semibold tabular-nums ${c.color}`}>{c.value}</p>
          </div>
        </Card>
      ))}
    </div>
  );
});

/* ---- Payments mini-table ---- */

const PaymentsCard = memo(function PaymentsCard({ payments }: { payments: FeePayment[] }) {
  const recent = payments.slice(0, 5);

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b bg-muted/30 flex items-center justify-between">
        <p className="text-sm font-semibold">Recent Payments</p>
        <span className="text-xs text-muted-foreground">{payments.length} total</span>
      </div>

      <Table className="flex-1">
        <TableHeader className="bg-muted/20">
          <TableRow className="h-11 border-b">
            <TableHead className="px-6 text-sm font-semibold">Receipt</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Fee Head</TableHead>
            <TableHead className="px-4 text-sm font-semibold text-right">Amount</TableHead>
            <TableHead className="px-4 text-sm font-semibold capitalize">Mode</TableHead>
            <TableHead className="px-6 text-sm font-semibold">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recent.map((p) => (
            <TableRow key={p.id} className="h-12 border-b hover:bg-muted/40 transition-colors">
              <TableCell className="px-6 text-sm font-mono font-medium">
                {p.receiptNumber || '—'}
              </TableCell>
              <TableCell className="px-4 text-sm text-muted-foreground">
                {p.feeHeadName || '—'}
              </TableCell>
              <TableCell className="px-4 text-sm font-semibold tabular-nums text-right text-emerald-600">
                {fmt(p.amount)}
              </TableCell>
              <TableCell className="px-4 text-sm capitalize text-muted-foreground">
                {p.paymentMode}
              </TableCell>
              <TableCell className="px-6 text-sm text-muted-foreground">
                {formatDate(p.paymentDate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
});
