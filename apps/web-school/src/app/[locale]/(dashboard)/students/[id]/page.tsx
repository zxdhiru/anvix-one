'use client';

import { use, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@anvix/ui/components/ui/button';
import { Skeleton } from '@anvix/ui/components/ui/skeleton';
import {
  ArrowLeft,
  Loader2,
  IndianRupee,
  CalendarDays,
  BookOpen,
  LayoutDashboard,
} from 'lucide-react';
import { useStudentData } from '../components/use-student-data';
import { StudentHeader } from '../components/student-header';
import { StudentActions } from '../components/student-actions';
import { GuardiansCard } from '../components/guardians-card';
import { FeesSection } from '../components/fees-section';
import { AttendanceSection } from '../components/attendance-section';
import { GradesSection } from '../components/grades-section';
import { ProgressSection } from '../components/progress-section';
import type { TabKey } from '../components/types';

const TABS: { key: TabKey; label: string; icon: typeof IndianRupee }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'fees', label: 'Fees', icon: IndianRupee },
  { key: 'attendance', label: 'Attendance', icon: CalendarDays },
  { key: 'grades', label: 'Grades', icon: BookOpen },
];

const VALID_TABS = new Set<TabKey>(['overview', 'fees', 'attendance', 'grades']);

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get('tab') ?? 'overview';
  const tab: TabKey = VALID_TABS.has(rawTab as TabKey) ? (rawTab as TabKey) : 'overview';

  const setTab = useCallback(
    (key: TabKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === 'overview') {
        params.delete('tab');
      } else {
        params.set('tab', key);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const { student, fees, payments, summary, loading, error } = useStudentData(id);

  if (loading) {
    return (
      <div className="space-y-6 page-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center page-fade-in">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
          <Loader2 className="size-6 text-destructive" />
        </div>
        <p className="text-sm font-medium">{error || 'Student not found'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in">
      {/* Back + title + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg"
            onClick={() => router.push('/students')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{student.name}</h1>
            <p className="text-xs text-muted-foreground font-mono">{student.admissionNumber}</p>
          </div>
        </div>

        <StudentActions student={student} />
      </div>

      {/* Header card */}
      <StudentHeader student={student} />

      {/* Tab navigation */}
      <nav className="flex gap-1 border-b">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors
                border-b-2 -mb-px
                ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }
              `}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Tab content */}
      <div className="stagger">
        {tab === 'overview' && (
          <div className="space-y-4">
            <ProgressSection student={student} fees={fees} summary={summary} />
            <GuardiansCard guardians={student.guardians} />
          </div>
        )}

        {tab === 'fees' && <FeesSection fees={fees} payments={payments} summary={summary} />}

        {tab === 'attendance' && <AttendanceSection />}

        {tab === 'grades' && <GradesSection />}
      </div>
    </div>
  );
}
