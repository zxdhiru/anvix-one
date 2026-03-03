'use client';

import { Card, CardContent } from '@anvix/ui/components/ui/card';
import { Badge } from '@anvix/ui/components/ui/badge';
import { ClipboardCheck } from 'lucide-react';

export default function AttendancePage() {
  return (
    <div className="space-y-6 page-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Attendance</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Mark and manage student & staff attendance
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
          Phase 3
        </Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40">
            <ClipboardCheck className="size-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mt-5 text-base font-semibold">Coming Soon</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Digital attendance tracking — mark daily attendance, view reports, and send automatic
            absent alerts to parents. Launching in Phase 3.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
