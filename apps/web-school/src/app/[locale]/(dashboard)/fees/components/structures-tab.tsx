'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Button } from '@anvix/ui/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@anvix/ui/components/ui/select';
import { Plus } from 'lucide-react';
import type { FeeStructure, ClassItem } from './types';
import { StructuresTable } from './structures-table';

interface StructuresTabProps {
  structures: FeeStructure[];
  classes: ClassItem[];
  filterClass: string;
  onFilterClass: (v: string) => void;
}

export const StructuresTab = memo(function StructuresTab({
  structures,
  classes,
  filterClass,
  onFilterClass,
}: StructuresTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Select value={filterClass} onValueChange={onFilterClass}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" className="h-8 gap-1.5 text-xs" asChild>
          <Link href="/fees/structures/new">
            <Plus className="size-3.5" />
            Add Structure
          </Link>
        </Button>
      </div>

      <StructuresTable structures={structures} />
    </div>
  );
});
