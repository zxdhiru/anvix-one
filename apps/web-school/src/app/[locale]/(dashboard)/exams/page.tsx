'use client';

import { Card, CardContent } from '@anvix/ui/components/ui/card';
import { Badge } from '@anvix/ui/components/ui/badge';
import { FileText } from 'lucide-react';

export default function ExamsPage() {
  return (
    <div className="space-y-6 page-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Examinations</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Schedule exams, enter marks, and generate report cards
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
          Phase 5
        </Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950/40">
            <FileText className="size-6 text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="mt-5 text-base font-semibold">Coming Soon</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Exam management — create exam schedules, enter marks with a spreadsheet-style UI,
            generate CBSE-compliant report cards as PDFs. Launching in Phase 5.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
