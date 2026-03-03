'use client';

import { Card, CardContent } from '@anvix/ui/components/ui/card';
import { Badge } from '@anvix/ui/components/ui/badge';
import { CalendarDays } from 'lucide-react';

export default function TimetablePage() {
  return (
    <div className="space-y-6 page-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Timetable</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            View class schedules and manage school timetable
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
          Coming Soon
        </Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/40">
            <CalendarDays className="size-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="mt-5 text-base font-semibold">Coming Soon</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Timetable management — create class-wise period schedules, manage substitutions, and
            share timetables with teachers and parents.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
