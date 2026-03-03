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
import type { FeeStructure } from './types';
import { fmt, formatDate } from './utils';

interface StructuresTableProps {
  structures: FeeStructure[];
}

export const StructuresTable = memo(function StructuresTable({ structures }: StructuresTableProps) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <Table className="flex-1">
        <TableHeader className="bg-muted/30">
          <TableRow className="h-12 border-b">
            <TableHead className="px-6 text-sm font-semibold">Structure</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Class</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Fee Head</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Term</TableHead>
            <TableHead className="px-4 text-sm font-semibold text-right w-35">Amount</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Due</TableHead>
            <TableHead className="px-6 text-sm font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="min-h-80">
          {structures.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-80 text-center text-sm text-muted-foreground align-middle"
              >
                No fee structures found.
              </TableCell>
            </TableRow>
          ) : (
            structures.map((s) => (
              <TableRow
                key={s.id}
                className={`
                  h-14
                  border-b
                  hover:bg-muted/40
                  transition-colors
                  ${s.id.startsWith('temp-') ? 'opacity-60' : ''}
                `}
              >
                <TableCell className="px-6 text-sm font-medium">{s.name}</TableCell>

                <TableCell className="px-4">
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    {s.className}
                  </Badge>
                </TableCell>

                <TableCell className="px-4 text-sm text-muted-foreground">
                  {s.feeHeadName}
                </TableCell>

                <TableCell className="px-4 text-sm text-muted-foreground">
                  {s.termName || 'Full Year'}
                </TableCell>

                <TableCell className="px-4 text-sm font-semibold tabular-nums text-right w-35">
                  {fmt(s.amount)}
                </TableCell>

                <TableCell className="px-4 text-sm text-muted-foreground">
                  {formatDate(s.dueDate!)}
                </TableCell>

                <TableCell className="px-6">
                  <Badge
                    variant={s.isActive ? 'default' : 'secondary'}
                    className="text-xs px-2 py-1"
                  >
                    {s.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>

        <tfoot>
          <tr className="border-t bg-muted/20">
            <td colSpan={7} className="px-6 py-3 text-xs text-muted-foreground">
              {structures.length === 0
                ? '0 structures'
                : `${structures.length} structure${structures.length > 1 ? 's' : ''}`}
            </td>
          </tr>
        </tfoot>
      </Table>
    </Card>
  );
});
