'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
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
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!tenantSlug) return;

    const opts = { tenantSlug, token: token ?? undefined };

    // Fetch all data in parallel
    Promise.all([
      apiClient('/school/academics/profile', opts).catch(() => null),
      apiClient('/school/academics/classes', opts).catch(() => []),
      apiClient('/school/academics/subjects', opts).catch(() => []),
      apiClient('/school/users?role=student', opts).catch(() => []),
      apiClient('/school/users?role=teacher', opts).catch(() => []),
    ])
      .then(([profile, classes, subjects, students, teachers]) => {
        setSchoolName(profile?.name ?? '');
        setStats({
          totalStudents: Array.isArray(students) ? students.length : 0,
          totalTeachers: Array.isArray(teachers) ? teachers.length : 0,
          totalClasses: Array.isArray(classes) ? classes.length : 0,
          totalSubjects: Array.isArray(subjects) ? subjects.length : 0,
        });
      })
      .finally(() => setLoadingStats(false));
  }, [tenantSlug, token]);

  const displayName = schoolName || user?.phone || '';

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t('title')}</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          {t('welcome', { name: displayName })}
        </p>
      </div>

      {/* Stats grid — admin & vice_principal */}
      {(role === 'school_admin' || role === 'vice_principal') && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('totalStudents')}
            value={loadingStats ? '...' : String(stats.totalStudents)}
            color="blue"
          />
          <StatCard
            label={t('totalTeachers')}
            value={loadingStats ? '...' : String(stats.totalTeachers)}
            color="green"
          />
          <StatCard
            label="Total Classes"
            value={loadingStats ? '...' : String(stats.totalClasses)}
            color="amber"
          />
          <StatCard
            label="Total Subjects"
            value={loadingStats ? '...' : String(stats.totalSubjects)}
            color="purple"
          />
        </div>
      )}

      {/* Teacher view */}
      {role === 'teacher' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={t('totalStudents')}
            value={loadingStats ? '...' : String(stats.totalStudents)}
            color="blue"
          />
          <StatCard label={t('attendance')} value="—" color="amber" />
          <StatCard label={t('upcomingEvents')} value="—" color="green" />
        </div>
      )}

      {/* Parent view */}
      {role === 'parent' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label={t('attendance')} value="—" color="amber" />
          <StatCard label={t('announcements')} value="—" color="blue" />
        </div>
      )}

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {t('announcements')}
          </h3>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No announcements yet.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
            {t('upcomingEvents')}
          </h3>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No upcoming events.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorStyles: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    green: 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p
        className={`mt-2 inline-flex rounded-lg px-3 py-1 text-2xl font-bold ${colorStyles[color] ?? colorStyles.blue}`}
      >
        {value}
      </p>
    </div>
  );
}
