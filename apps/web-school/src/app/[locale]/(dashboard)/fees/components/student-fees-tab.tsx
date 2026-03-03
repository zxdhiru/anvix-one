'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Badge } from '@anvix/ui/components/ui/badge';
import { Card, CardContent } from '@anvix/ui/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@anvix/ui/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@anvix/ui/components/ui/select';
import { Plus, Search, Users } from 'lucide-react';
import type { StudentFee, ClassItem } from './types';
import { fmt, formatDate, StatusBadge } from './utils';

interface StudentFeesTabProps {
  studentFees: StudentFee[];
  classes: ClassItem[];
  classFilter: string;
  statusFilter: string;
  searchQuery: string;
  onClassFilter: (v: string) => void;
  onStatusFilter: (v: string) => void;
  onSearchQuery: (v: string) => void;
}

export const StudentFeesTab = memo(function StudentFeesTab({
  studentFees,
  classes,
  classFilter,
  statusFilter,
  searchQuery,
  onClassFilter,
  onStatusFilter,
  onSearchQuery,
}: StudentFeesTabProps) {
  return (
    <div className="space-y-4">
      <StudentFeesFilters
        classFilter={classFilter}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onClassFilter={onClassFilter}
        onStatusFilter={onStatusFilter}
        onSearchQuery={onSearchQuery}
        classes={classes}
      >
        <Button size="sm" className="h-8 gap-1.5 text-xs ml-auto" asChild>
          <Link href="/fees/assign">
            <Plus className="size-3.5" />
            Assign to Class
          </Link>
        </Button>
      </StudentFeesFilters>

      {studentFees.length === 0 ? (
        <StudentFeesEmpty />
      ) : (
        <StudentFeesTable studentFees={studentFees} />
      )}
    </div>
  );
});

/* ---- Sub-components ---- */

const StudentFeesFilters = memo(function StudentFeesFilters({
  classFilter,
  statusFilter,
  searchQuery,
  onClassFilter,
  onStatusFilter,
  onSearchQuery,
  classes,
  children,
}: {
  classFilter: string;
  statusFilter: string;
  searchQuery: string;
  onClassFilter: (v: string) => void;
  onStatusFilter: (v: string) => void;
  onSearchQuery: (v: string) => void;
  classes: ClassItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-40">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchQuery(e.target.value)}
          placeholder="Search student..."
          className="h-8 pl-8 text-xs"
        />
      </div>
      <Select value={classFilter} onValueChange={onClassFilter}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="All classes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Classes</SelectItem>
          {classes.map((c) => (
            <SelectItem key={c.id} value={c.name}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={onStatusFilter}>
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue placeholder="All status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="partial">Partial</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="waived">Waived</SelectItem>
        </SelectContent>
      </Select>
      {children}
    </div>
  );
});

const StudentFeesEmpty = memo(function StudentFeesEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="size-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium">No student fees</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Assign fee structures to a class to generate student fee entries.
        </p>
      </CardContent>
    </Card>
  );
});

const StudentFeesTable = memo(function StudentFeesTable({
  studentFees,
}: {
  studentFees: StudentFee[];
}) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <Table className="flex-1">
        <TableHeader className="bg-muted/30">
          <TableRow className="h-12 border-b">
            <TableHead className="px-6 text-sm font-semibold">Student</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Class</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Fee Head</TableHead>
            <TableHead className="px-4 text-sm font-semibold text-right">Amount</TableHead>
            <TableHead className="px-4 text-sm font-semibold text-right">Discount</TableHead>
            <TableHead className="px-4 text-sm font-semibold text-right">Net</TableHead>
            <TableHead className="px-4 text-sm font-semibold text-right">Paid</TableHead>
            <TableHead className="px-4 text-sm font-semibold text-right">Balance</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Status</TableHead>
            <TableHead className="px-6 text-sm font-semibold">Due</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="min-h-80">
          {studentFees.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="h-80 text-center text-sm text-muted-foreground align-middle"
              >
                No student fees found.
              </TableCell>
            </TableRow>
          ) : (
            studentFees.map((sf) => (
              <TableRow key={sf.id} className="h-14 border-b hover:bg-muted/40 transition-colors">
                <TableCell className="px-6">
                  <p className="text-sm font-medium">{sf.studentName}</p>
                  <p className="text-xs text-muted-foreground">{sf.admissionNumber}</p>
                </TableCell>

                <TableCell className="px-4">
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    {sf.className}
                  </Badge>
                </TableCell>

                <TableCell className="px-4 text-sm text-muted-foreground">
                  {sf.feeHeadName}
                </TableCell>

                <TableCell className="px-4 text-sm tabular-nums text-right">
                  {fmt(sf.originalAmount)}
                </TableCell>

                <TableCell className="px-4 text-sm tabular-nums text-right text-muted-foreground">
                  {sf.discountAmount > 0 ? `-${fmt(sf.discountAmount)}` : '\u2014'}
                </TableCell>

                <TableCell className="px-4 text-sm font-medium tabular-nums text-right">
                  {fmt(sf.netAmount)}
                </TableCell>

                <TableCell className="px-4 text-sm tabular-nums text-right text-emerald-600">
                  {fmt(sf.paidAmount)}
                </TableCell>

                <TableCell className="px-4 text-sm font-semibold tabular-nums text-right">
                  {fmt(sf.netAmount - sf.paidAmount)}
                </TableCell>

                <TableCell className="px-4">
                  <StatusBadge status={sf.status} />
                </TableCell>

                <TableCell className="px-6 text-sm text-muted-foreground">
                  {sf.dueDate ? formatDate(sf.dueDate) : '\u2014'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>

        <tfoot>
          <tr className="border-t bg-muted/20">
            <td colSpan={10} className="px-6 py-3 text-xs text-muted-foreground">
              {studentFees.length === 0
                ? '0 student fees'
                : `${studentFees.length} student fee${studentFees.length > 1 ? 's' : ''}`}
            </td>
          </tr>
        </tfoot>
      </Table>
    </Card>
  );
});
