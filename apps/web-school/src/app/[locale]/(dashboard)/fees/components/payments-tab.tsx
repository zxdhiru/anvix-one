'use client';

import { memo, useMemo } from 'react';
import { Input } from '@anvix/ui/components/ui/input';
import { Card, CardContent } from '@anvix/ui/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@anvix/ui/components/ui/table';
import { Search, Receipt, Banknote } from 'lucide-react';
import type { FeePayment } from './types';
import { fmt, formatDate, modeIcon } from './utils';

interface PaymentsTabProps {
  payments: FeePayment[];
  searchQuery: string;
  onSearchQuery: (v: string) => void;
}

export const PaymentsTab = memo(function PaymentsTab({
  payments,
  searchQuery,
  onSearchQuery,
}: PaymentsTabProps) {
  const rows = useMemo(() => {
    if (!searchQuery) return payments;
    const s = searchQuery.toLowerCase();
    return payments.filter(
      (p) =>
        p.studentName?.toLowerCase().includes(s) ||
        p.receiptNumber?.toLowerCase().includes(s) ||
        p.feeHeadName?.toLowerCase().includes(s),
    );
  }, [payments, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQuery(e.target.value)}
            placeholder="Search by student, receipt..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {rows.length} payment{rows.length !== 1 ? 's' : ''}
        </p>
      </div>

      {rows.length === 0 ? <PaymentsEmpty /> : <PaymentsTable rows={rows} />}
    </div>
  );
});

/* ---- Sub-components ---- */

const PaymentsEmpty = memo(function PaymentsEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Receipt className="size-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium">No payments recorded</p>
        <p className="mt-1 text-xs text-muted-foreground">Collected payments will appear here.</p>
      </CardContent>
    </Card>
  );
});

const PaymentsTable = memo(function PaymentsTable({ rows }: { rows: FeePayment[] }) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <Table className="flex-1">
        <TableHeader className="bg-muted/30">
          <TableRow className="h-12 border-b">
            <TableHead className="px-6 text-sm font-semibold">Receipt #</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Student</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Fee Head</TableHead>
            <TableHead className="px-4 text-sm font-semibold text-right">Amount</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Mode</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Date</TableHead>
            <TableHead className="px-6 text-sm font-semibold">Collected By</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="min-h-80">
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-80 text-center text-sm text-muted-foreground align-middle"
              >
                No payments found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((p) => {
              const MI = modeIcon[p.paymentMode] ?? Banknote;
              return (
                <TableRow key={p.id} className="h-14 border-b hover:bg-muted/40 transition-colors">
                  <TableCell className="px-6 text-sm font-mono font-medium">
                    {p.receiptNumber}
                  </TableCell>

                  <TableCell className="px-4 text-sm font-medium">{p.studentName}</TableCell>

                  <TableCell className="px-4 text-sm text-muted-foreground">
                    {p.feeHeadName}
                  </TableCell>

                  <TableCell className="px-4 text-sm font-semibold tabular-nums text-right text-emerald-600">
                    {fmt(p.amount)}
                  </TableCell>

                  <TableCell className="px-4">
                    <div className="flex items-center gap-1.5">
                      <MI className="size-3.5 text-muted-foreground" />
                      <span className="text-sm capitalize">{p.paymentMode}</span>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 text-sm text-muted-foreground">
                    {formatDate(p.paymentDate)}
                  </TableCell>

                  <TableCell className="px-6 text-sm text-muted-foreground">
                    {p.collectedByName ?? '\u2014'}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>

        <tfoot>
          <tr className="border-t bg-muted/20">
            <td colSpan={7} className="px-6 py-3 text-xs text-muted-foreground">
              {rows.length === 0
                ? '0 payments'
                : `${rows.length} payment${rows.length > 1 ? 's' : ''}`}
            </td>
          </tr>
        </tfoot>
      </Table>
    </Card>
  );
});
