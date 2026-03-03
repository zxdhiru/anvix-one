'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Badge } from '@anvix/ui/components/ui/badge';
import { Card, CardContent } from '@anvix/ui/components/ui/card';
import { Skeleton } from '@anvix/ui/components/ui/skeleton';

import {
  BookOpen,
  Plus,
  Search,
  Users,
  GraduationCap,
  LayoutGrid,
  ChevronRight,
} from 'lucide-react';

/* ─── types ─── */

interface Section {
  id: string;
  classId: string;
  name: string;
  capacity: number | null;
  isActive: boolean;
}

interface ClassItem {
  id: string;
  name: string;
  numericOrder: number;
  academicYearId: string;
  classTeacherId: string | null;
  isActive: boolean;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface Student {
  id: string;
  name: string;
  classId: string;
  sectionId: string;
  isActive: boolean;
}

interface SectionWithMeta extends Section {
  studentCount: number;
}

interface ClassWithMeta extends ClassItem {
  sections: SectionWithMeta[];
  studentCount: number;
  totalCapacity: number | null;
}

function asArray<T>(d: unknown): T[] {
  return Array.isArray(d) ? (d as T[]) : [];
}

/* ─── page ─── */

export default function ClassesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { token, tenantSlug } = useAuth();

  const [classes, setClasses] = useState<ClassWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('q') ?? '';

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || (key === 'year' && value === 'current')) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, { ...opts, tenantSlug: tenantSlug ?? undefined, token: token ?? undefined }),
    [tenantSlug, token],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classData, yearData, studentData] = await Promise.all([
        api('/school/academics/classes').catch(() => []),
        api('/school/academics/years').catch(() => []),
        api('/school/students').catch(() => []),
      ]);

      const classesArr = asArray<ClassItem>(classData);
      const studentsArr = asArray<Student>(studentData);
      // yearData available for future filtering
      void yearData;

      // Fetch sections for each class in parallel
      const withMeta = await Promise.all(
        classesArr.map(async (cls) => {
          const secs = asArray<Section>(
            await api(`/school/academics/classes/${cls.id}/sections`).catch(() => []),
          );
          const classStudents = studentsArr.filter((s) => s.classId === cls.id && s.isActive);
          const sectionsWithMeta: SectionWithMeta[] = secs.map((sec) => ({
            ...sec,
            studentCount: classStudents.filter((s) => s.sectionId === sec.id).length,
          }));
          const totalCapacity = secs.every((s) => s.capacity != null)
            ? secs.reduce((sum, s) => sum + (s.capacity ?? 0), 0)
            : null;
          return {
            ...cls,
            sections: sectionsWithMeta,
            studentCount: classStudents.length,
            totalCapacity,
          };
        }),
      );

      setClasses(withMeta);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    return classes.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [classes, search]);

  const totalStudents = useMemo(() => classes.reduce((s, c) => s + c.studentCount, 0), [classes]);
  const totalSections = useMemo(
    () => classes.reduce((s, c) => s + c.sections.length, 0),
    [classes],
  );

  return (
    <div className="space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Classes</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? '...'
              : `${classes.length} classes · ${totalSections} sections · ${totalStudents} students`}
          </p>
        </div>

        <Button size="sm" asChild>
          <Link href="/classes/new">
            <Plus className="size-4" />
            New Class
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{classes.length}</p>
                <p className="text-xs text-muted-foreground">Classes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10">
                <LayoutGrid className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{totalSections}</p>
                <p className="text-xs text-muted-foreground">Sections</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <GraduationCap className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{totalStudents}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={search}
            onChange={(e) => updateParams({ q: e.target.value })}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Class cards */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <BookOpen className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium">No classes found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {search ? 'Try adjusting your search' : 'Create your first class to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {filtered.map((cls) => (
            <Card
              key={cls.id}
              className="group cursor-pointer transition-all duration-150 hover:shadow-md hover:border-primary/30"
              onClick={() => router.push(`/classes/${cls.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                      {cls.numericOrder || cls.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{cls.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {cls.sections.length} section{cls.sections.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="size-3.5" />
                    <span className="tabular-nums font-medium">{cls.studentCount}</span>
                    {cls.totalCapacity != null ? (
                      <span>/ {cls.totalCapacity} enrolled</span>
                    ) : (
                      <span>students</span>
                    )}
                  </div>
                </div>

                {cls.sections.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {cls.sections.map((sec) => (
                      <Badge key={sec.id} variant="outline" className="text-[11px] px-2 py-0.5">
                        {sec.name}
                        <span className="ml-1 tabular-nums text-muted-foreground">
                          {sec.studentCount}
                          {sec.capacity != null ? `/${sec.capacity}` : ''}
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
