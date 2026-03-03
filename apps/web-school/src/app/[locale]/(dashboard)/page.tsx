'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@anvix/ui/components/ui/card';
import { Badge } from '@anvix/ui/components/ui/badge';
import { Skeleton } from '@anvix/ui/components/ui/skeleton';
import {
  GraduationCap,
  Users,
  BookOpen,
  Layers,
  CalendarDays,
  Bell,
  TrendingUp,
  Clock,
  Plus,
  Settings,
  ArrowRight,
  Heart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
}

interface TeacherSubject {
  subjectName: string;
  className: string;
  sectionName: string;
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { user, token, tenantSlug } = useAuth();
  const role = user?.role ?? 'school_admin';

  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
  });
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(true);
  const [teacherSubjects, setTeacherSubjects] = useState<TeacherSubject[]>([]);
  const [childCount, setChildCount] = useState(0);

  useEffect(() => {
    if (!tenantSlug) return;
    const opts = { tenantSlug, token: token ?? undefined };

    const fetches: Promise<unknown>[] = [
      apiClient('/school/academics/profile', opts).catch(() => null),
      apiClient('/school/academics/classes', opts).catch(() => []),
      apiClient('/school/academics/subjects', opts).catch(() => []),
      apiClient('/school/students', opts).catch(() => []),
      apiClient('/school/teachers', opts).catch(() => []),
    ];

    // Teacher-specific: load my subjects
    if (role === 'teacher' && user?.userId) {
      fetches.push(apiClient(`/school/teachers/${user.userId}/subjects`, opts).catch(() => []));
    }

    // Parent-specific: load my children count
    if (role === 'parent') {
      fetches.push(apiClient('/school/guardians/my-children', opts).catch(() => []));
    }

    Promise.all(fetches)
      .then(([profile, classes, subjects, students, teachers, extra]) => {
        setSchoolName((profile as { name?: string } | null)?.name ?? '');
        setStats({
          totalStudents: Array.isArray(students) ? students.length : 0,
          totalTeachers: Array.isArray(teachers) ? teachers.length : 0,
          totalClasses: Array.isArray(classes) ? classes.length : 0,
          totalSubjects: Array.isArray(subjects) ? subjects.length : 0,
        });
        if (role === 'teacher' && Array.isArray(extra)) {
          setTeacherSubjects(
            (extra as Record<string, string>[]).map((ts) => ({
              subjectName: ts.subject_name ?? ts.subjectName ?? '',
              className: ts.class_name ?? ts.className ?? '',
              sectionName: ts.section_name ?? ts.sectionName ?? '',
            })),
          );
        }
        if (role === 'parent' && Array.isArray(extra)) {
          setChildCount(extra.length);
        }
      })
      .finally(() => setLoading(false));
  }, [tenantSlug, token, role, user?.userId]);

  const displayName = schoolName || user?.phone || '';

  const adminStats: { label: string; value: number; icon: LucideIcon; color: string }[] = [
    {
      label: t('totalStudents'),
      value: stats.totalStudents,
      icon: GraduationCap,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
    },
    {
      label: t('totalTeachers'),
      value: stats.totalTeachers,
      icon: Users,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      label: 'Total Classes',
      value: stats.totalClasses,
      icon: Layers,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      label: 'Total Subjects',
      value: stats.totalSubjects,
      icon: BookOpen,
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400',
    },
  ];

  return (
    <div className="space-y-6 page-fade-in">
      {/* Welcome header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t('welcome', { name: displayName })}
          </p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </Badge>
      </div>

      {/* Stats grid */}
      {(role === 'school_admin' || role === 'vice_principal') && (
        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adminStats.map((stat) => (
            <StatCard key={stat.label} {...stat} loading={loading} />
          ))}
        </div>
      )}

      {/* Admin quick actions */}
      {(role === 'school_admin' || role === 'vice_principal') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <QuickAction
                href="/admission"
                icon={Plus}
                label="Add student"
                color="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
              />
              <QuickAction
                href="/teachers"
                icon={Plus}
                label="Add Teacher"
                color="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              />
              <QuickAction
                href="/settings"
                icon={Settings}
                label="School Settings"
                color="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
              />
              <QuickAction
                href="/attendance"
                icon={Clock}
                label="Attendance"
                color="bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teacher view */}
      {role === 'teacher' && (
        <>
          <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label={t('totalStudents')}
              value={stats.totalStudents}
              icon={GraduationCap}
              color="text-amber-600 bg-amber-50"
              loading={loading}
            />
            <StatCard
              label="My Subjects"
              value={teacherSubjects.length}
              icon={BookOpen}
              color="text-blue-600 bg-blue-50"
              loading={loading}
            />
            <StatCard
              label={t('upcomingEvents')}
              value={0}
              icon={CalendarDays}
              color="text-emerald-600 bg-emerald-50"
              loading={loading}
            />
          </div>

          {/* Teacher's assigned classes & subjects */}
          {teacherSubjects.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">My Classes & Subjects</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {teacherSubjects.map((ts, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                        {ts.subjectName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{ts.subjectName}</p>
                        <p className="text-xs text-muted-foreground">
                          {ts.className} — {ts.sectionName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Parent view */}
      {role === 'parent' && (
        <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="My Children"
            value={childCount}
            icon={Heart}
            color="text-rose-600 bg-rose-50"
            loading={loading}
          />
          <StatCard
            label={t('attendance')}
            value={0}
            icon={Clock}
            color="text-blue-600 bg-blue-50"
            loading={loading}
          />
          <StatCard
            label={t('announcements')}
            value={0}
            icon={Bell}
            color="text-amber-600 bg-amber-50"
            loading={loading}
          />
        </div>
      )}

      {/* Quick info cards */}
      <div className="stagger grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t('announcements')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Bell className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">No announcements yet</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t('upcomingEvents')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <CalendarDays className="size-4 text-muted-foreground" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">No upcoming events</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  loading: boolean;
}) {
  return (
    <Card className="group relative overflow-hidden">
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-lg border border-transparent p-3 text-center transition-colors hover:border-border hover:bg-muted/50"
    >
      <div className={`flex size-9 items-center justify-center rounded-lg ${color}`}>
        <Icon className="size-4" />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
