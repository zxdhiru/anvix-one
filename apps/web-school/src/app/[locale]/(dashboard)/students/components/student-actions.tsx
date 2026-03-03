'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@anvix/ui/components/ui/button';
import { Badge } from '@anvix/ui/components/ui/badge';
import { Pencil } from 'lucide-react';
import type { StudentDetail } from './types';

interface StudentActionsProps {
  student: StudentDetail;
}

export const StudentActions = memo(function StudentActions({ student }: StudentActionsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={student.isActive ? 'default' : 'destructive'}
        className="text-xs px-2 py-0.5 hidden sm:inline-flex"
      >
        {student.isActive ? 'Active' : 'Inactive'}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/students/${student.id}/edit`)}
      >
        <Pencil className="size-3.5" />
        Manage
      </Button>
    </div>
  );
});
