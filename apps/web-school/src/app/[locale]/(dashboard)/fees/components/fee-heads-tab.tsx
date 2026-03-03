'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Button } from '@anvix/ui/components/ui/button';
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
import { Plus, FileText } from 'lucide-react';
import type { FeeHead } from './types';

interface FeeHeadsTabProps {
  feeHeads: FeeHead[];
}

export const FeeHeadsTab = memo(function FeeHeadsTab({ feeHeads }: FeeHeadsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {feeHeads.length} fee head{feeHeads.length !== 1 ? 's' : ''}
        </p>

        <Button size="sm" className="h-8 gap-1.5 text-xs" asChild>
          <Link href="/fees/heads/new">
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Add Fee Head</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </Button>
      </div>

      {feeHeads.length === 0 ? <FeeHeadsEmpty /> : <FeeHeadsTable feeHeads={feeHeads} />}
    </div>
  );
});

const FeeHeadsEmpty = memo(function FeeHeadsEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="size-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm font-medium">No fee heads</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create fee heads like Tuition, Transport, Lab.
        </p>
      </CardContent>
    </Card>
  );
});

const FeeHeadsTable = memo(function FeeHeadsTable({ feeHeads }: { feeHeads: FeeHead[] }) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <Table className="flex-1">
        <TableHeader className="bg-muted/30">
          <TableRow className="h-12 border-b">
            <TableHead className="px-6 text-sm font-semibold">Name</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Code</TableHead>
            <TableHead className="px-4 text-sm font-semibold">Type</TableHead>
            <TableHead className="px-6 text-sm font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="min-h-80">
          {feeHeads.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-80 text-center text-sm text-muted-foreground align-middle"
              >
                No fee heads found.
              </TableCell>
            </TableRow>
          ) : (
            feeHeads.map((h) => (
              <TableRow
                key={h.id}
                className={`
                  h-14
                  border-b
                  hover:bg-muted/40
                  transition-colors
                  ${h.id.startsWith('temp-') ? 'opacity-60' : ''}
                `}
              >
                <TableCell className="px-6">
                  <p className="text-sm font-medium">{h.name}</p>
                  {h.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{h.description}</p>
                  )}
                </TableCell>

                <TableCell className="px-4 text-sm text-muted-foreground">
                  {h.code || '—'}
                </TableCell>

                <TableCell className="px-4">
                  <Badge variant="outline" className="text-xs px-2 py-1">
                    {h.isRecurring ? 'Recurring' : 'One-time'}
                  </Badge>
                </TableCell>

                <TableCell className="px-6">
                  <Badge
                    variant={h.isActive ? 'default' : 'secondary'}
                    className="text-xs px-2 py-1"
                  >
                    {h.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>

        <tfoot>
          <tr className="border-t bg-muted/20">
            <td colSpan={4} className="px-6 py-3 text-xs text-muted-foreground">
              {feeHeads.length === 0
                ? '0 fee heads'
                : `${feeHeads.length} fee head${feeHeads.length > 1 ? 's' : ''}`}
            </td>
          </tr>
        </tfoot>
      </Table>
    </Card>
  );
});
