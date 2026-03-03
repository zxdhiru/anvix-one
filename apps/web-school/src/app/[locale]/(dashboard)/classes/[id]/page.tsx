'use client';

import { use, useEffect, useState, useCallback, useMemo } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@anvix/ui/components/ui/table';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Users,
  GraduationCap,
  LayoutGrid,
  BookOpen,
  IndianRupee,
  Search,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
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

interface Student {
  id: string;
  admissionNumber: string;
  name: string;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  classId: string;
  sectionId: string;
  rollNumber: number | null;
  isActive: boolean;
  className?: string | null;
  sectionName?: string | null;
}

interface Subject {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string | null;
  periodsPerWeek: number | null;
  subjectName?: string;
  subjectCode?: string | null;
}

interface SubjectRef {
  id: string;
  name: string;
  code: string | null;
  subjectType: string;
}

interface StudentFee {
  id: string;
  studentId: string;
  originalAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  status: string;
  studentName?: string;
  feeHeadName?: string;
}

function asArray<T>(d: unknown): T[] {
  return Array.isArray(d) ? (d as T[]) : [];
}

function fmt(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

type TabKey = 'students' | 'sections' | 'subjects' | 'fees';

const TABS: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: 'students', label: 'Students', icon: GraduationCap },
  { key: 'sections', label: 'Sections', icon: LayoutGrid },
  { key: 'subjects', label: 'Subjects', icon: BookOpen },
  { key: 'fees', label: 'Fees', icon: IndianRupee },
];

const VALID_TABS = new Set<string>(['students', 'sections', 'subjects', 'fees']);

/* ─── page ─── */

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { token, tenantSlug } = useAuth();

  const rawTab = searchParams.get('tab');
  const tab: TabKey = rawTab && VALID_TABS.has(rawTab) ? (rawTab as TabKey) : 'students';
  const search = searchParams.get('q') ?? '';

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || (key === 'tab' && value === 'students')) {
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
      apiClient(path, {
        ...opts,
        tenantSlug: tenantSlug ?? undefined,
        token: token ?? undefined,
      }),
    [tenantSlug, token],
  );

  /* ─── data ─── */
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [cls, setCls] = useState<ClassItem | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classSubjects, setClassSubjects] = useState<Subject[]>([]);

  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadErr('');
    try {
      const [classesData, secsData, studData, cSubData, subsData, feesData] = await Promise.all([
        api('/school/academics/classes').catch(() => []),
        api(`/school/academics/classes/${id}/sections`).catch(() => []),
        api(`/school/students?classId=${id}`).catch(() => []),
        api(`/school/academics/classes/${id}/subjects`).catch(() => []),
        api('/school/academics/subjects').catch(() => []),
        api('/school/fees/student-fees').catch(() => []),
      ]);

      const allClasses = asArray<ClassItem>(classesData);
      const found = allClasses.find((c) => c.id === id);
      if (!found) {
        setLoadErr('Class not found');
        setLoading(false);
        return;
      }

      const secs = asArray<Section>(secsData);
      const studs = asArray<Student>(studData);
      const subs = asArray<SubjectRef>(subsData);
      void subs; // used below for enrichment
      const cSubs = asArray<Subject>(cSubData);
      const fees = asArray<StudentFee>(feesData).filter((f) =>
        studs.some((s) => s.id === f.studentId),
      );

      // Enrich students with section names
      const secMap = new Map(secs.map((s) => [s.id, s.name]));
      const enrichedStudents = studs.map((s) => ({
        ...s,
        sectionName: secMap.get(s.sectionId) ?? null,
        className: found.name,
      }));

      // Enrich class-subjects with subject name/code
      const subMap = new Map(subs.map((s) => [s.id, s]));
      const enrichedCSubjects: Subject[] = cSubs.map((cs) => ({
        ...cs,
        subjectName: subMap.get(cs.subjectId)?.name ?? 'Unknown',
        subjectCode: subMap.get(cs.subjectId)?.code ?? undefined,
      }));

      setCls(found);
      setSections(secs);
      setStudents(enrichedStudents);
      setClassSubjects(enrichedCSubjects);
      setStudentFees(fees);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─── derived ─── */
  const activeStudents = useMemo(() => students.filter((s) => s.isActive), [students]);

  const filteredStudents = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.admissionNumber?.toLowerCase().includes(q),
    );
  }, [students, search]);

  const feeStats = useMemo(() => {
    const total = studentFees.reduce((s, f) => s + f.netAmount, 0);
    const paid = studentFees.reduce((s, f) => s + f.paidAmount, 0);
    const pending = total - paid;
    const paidCount = studentFees.filter((f) => f.status === 'paid').length;
    return { total, paid, pending, paidCount, count: studentFees.length };
  }, [studentFees]);

  /* ─── loading ─── */
  if (loading) {
    return (
      <div className="space-y-6 page-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  /* ─── error ─── */
  if (loadErr || !cls) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center page-fade-in">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
          <AlertTriangle className="size-6 text-destructive" />
        </div>
        <p className="text-sm font-medium">{loadErr || 'Class not found'}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.push('/classes')}
        >
          <ArrowLeft className="size-4" />
          Back to Classes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg"
            onClick={() => router.push('/classes')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{cls.name}</h1>
            <p className="text-sm text-muted-foreground">
              {sections.length} section{sections.length !== 1 ? 's' : ''} · {activeStudents.length}{' '}
              student{activeStudents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/classes/${id}/edit`}>
              <Pencil className="size-3.5" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/classes/${id}/sections/new`}>
              <Plus className="size-3.5" />
              Add Section
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 stagger">
        <Card>
          <CardContent className="flex items-center gap-3 py-3.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{activeStudents.length}</p>
              <p className="text-[11px] text-muted-foreground">Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
              <LayoutGrid className="size-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{sections.length}</p>
              <p className="text-[11px] text-muted-foreground">Sections</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10">
              <BookOpen className="size-4 text-violet-600" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{classSubjects.length}</p>
              <p className="text-[11px] text-muted-foreground">Subjects</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-3.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <IndianRupee className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">
                {feeStats.count > 0
                  ? `${Math.round((feeStats.paid / feeStats.total) * 100)}%`
                  : '—'}
              </p>
              <p className="text-[11px] text-muted-foreground">Fee Collected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => updateParams({ tab: key, q: null })}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              tab === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'students' && (
        <StudentsTab
          students={filteredStudents}
          search={search}
          onSearch={(v) => updateParams({ q: v })}
          onStudentClick={(sid) => router.push(`/students/${sid}`)}
          classId={id}
        />
      )}
      {tab === 'sections' && <SectionsTab sections={sections} students={students} classId={id} />}
      {tab === 'subjects' && <SubjectsTab subjects={classSubjects} classId={id} />}
      {tab === 'fees' && <FeesTab studentFees={studentFees} stats={feeStats} />}
    </div>
  );
}

/* ─── Students tab ─── */

function StudentsTab({
  students,
  search,
  onSearch,
  onStudentClick,
}: {
  students: Student[];
  search: string;
  onSearch: (v: string) => void;
  onStudentClick: (id: string) => void;
  classId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <p className="text-xs text-muted-foreground ml-auto">
          {students.length} student{students.length !== 1 ? 's' : ''}
        </p>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="h-12 border-b">
              <TableHead className="px-6 text-sm font-semibold">Student</TableHead>
              <TableHead className="px-4 text-sm font-semibold">Admission #</TableHead>
              <TableHead className="px-4 text-sm font-semibold">Section</TableHead>
              <TableHead className="px-4 text-sm font-semibold">Roll #</TableHead>
              <TableHead className="px-4 text-sm font-semibold">Contact</TableHead>
              <TableHead className="px-6 text-sm font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-sm text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <GraduationCap className="size-5 text-muted-foreground/50" />
                    <p>No students found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              students.map((s) => (
                <TableRow
                  key={s.id}
                  className="h-14 border-b hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => onStudentClick(s.id)}
                >
                  <TableCell className="px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        {s.dateOfBirth && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="size-3" />
                            {new Date(s.dateOfBirth).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 font-mono text-sm text-muted-foreground">
                    {s.admissionNumber || '—'}
                  </TableCell>
                  <TableCell className="px-4">
                    {s.sectionName ? (
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {s.sectionName}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 text-sm tabular-nums text-muted-foreground">
                    {s.rollNumber ?? '—'}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="space-y-0.5">
                      {s.phone && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="size-3" /> {s.phone}
                        </p>
                      )}
                      {s.email && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="size-3" /> {s.email}
                        </p>
                      )}
                      {!s.phone && !s.email && (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6">
                    <Badge
                      variant={s.isActive ? 'default' : 'destructive'}
                      className="text-xs px-2 py-0.5"
                    >
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <tfoot>
            <tr className="border-t bg-muted/20">
              <td colSpan={6} className="px-6 py-3 text-xs text-muted-foreground">
                {students.length} student{students.length !== 1 ? 's' : ''}
              </td>
            </tr>
          </tfoot>
        </Table>
      </Card>
    </div>
  );
}

/* ─── Sections tab ─── */

function SectionsTab({
  sections,
  students,
  classId: _classId,
}: {
  sections: Section[];
  students: Student[];
  classId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {sections.length} section{sections.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" className="h-8 gap-1.5 text-xs" asChild>
          <Link href={`/classes/${_classId}/sections/new`}>
            <Plus className="size-3.5" />
            Add Section
          </Link>
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <LayoutGrid className="size-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">No sections yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add sections like A, B, C to this class.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {sections.map((sec) => {
            const secStudents = students.filter((s) => s.sectionId === sec.id && s.isActive);
            return (
              <Card key={sec.id} className="group relative">
                <Link
                  href={`/classes/${_classId}/sections/${sec.id}/edit`}
                  className="absolute inset-0 z-10"
                  aria-label={`Edit Section ${sec.name}`}
                />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-600">
                        {sec.name}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">Section {sec.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {sec.capacity != null ? `Capacity: ${sec.capacity}` : 'No capacity limit'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pencil className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Badge
                        variant={sec.isActive ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {sec.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Users className="size-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground tabular-nums">
                        {secStudents.length}
                      </span>{' '}
                      student{secStudents.length !== 1 ? 's' : ''}
                      {sec.capacity != null && (
                        <span className="ml-1">
                          ({Math.round((secStudents.length / sec.capacity) * 100)}% full)
                        </span>
                      )}
                    </span>
                  </div>

                  {sec.capacity != null && (
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{
                          width: `${Math.min(100, Math.round((secStudents.length / sec.capacity) * 100))}%`,
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Subjects tab ─── */

function SubjectsTab({ subjects, classId }: { subjects: Subject[]; classId: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {subjects.length} subject{subjects.length !== 1 ? 's' : ''} assigned
        </p>
        <Button size="sm" className="h-8 gap-1.5 text-xs" asChild>
          <Link href={`/classes/${classId}/subjects/assign`}>
            <Plus className="size-3.5" />
            Assign Subject
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="h-12 border-b">
              <TableHead className="px-6 text-sm font-semibold">Subject</TableHead>
              <TableHead className="px-4 text-sm font-semibold">Code</TableHead>
              <TableHead className="px-4 text-sm font-semibold">Periods/Week</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-40 text-center text-sm text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <BookOpen className="size-5 text-muted-foreground/50" />
                    <p>No subjects assigned</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((sub) => (
                <TableRow
                  key={sub.id}
                  className="h-14 border-b hover:bg-muted/40 transition-colors"
                >
                  <TableCell className="px-6 text-sm font-medium">{sub.subjectName}</TableCell>
                  <TableCell className="px-4">
                    {sub.subjectCode ? (
                      <Badge variant="outline" className="text-xs px-2 py-0.5 font-mono">
                        {sub.subjectCode}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 text-sm tabular-nums text-muted-foreground">
                    {sub.periodsPerWeek ?? '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <tfoot>
            <tr className="border-t bg-muted/20">
              <td colSpan={3} className="px-6 py-3 text-xs text-muted-foreground">
                {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
              </td>
            </tr>
          </tfoot>
        </Table>
      </Card>
    </div>
  );
}

/* ─── Fees tab ─── */

function FeesTab({
  studentFees,
  stats,
}: {
  studentFees: StudentFee[];
  stats: { total: number; paid: number; pending: number; paidCount: number; count: number };
}) {
  const rate = stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Fee summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3.5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total</p>
            <p className="text-lg font-bold tabular-nums">{fmt(stats.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3.5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Collected</p>
            <p className="text-lg font-bold tabular-nums text-emerald-600">{fmt(stats.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3.5">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Pending</p>
            <p className="text-lg font-bold tabular-nums text-amber-600">{fmt(stats.pending)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Collection Rate</span>
            <span className="text-sm font-bold">{rate}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(rate, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {stats.paidCount} of {stats.count} fees fully paid
          </p>
        </CardContent>
      </Card>

      {/* Fee breakdown table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="h-12 border-b">
              <TableHead className="px-6 text-sm font-semibold">Student</TableHead>
              <TableHead className="px-4 text-sm font-semibold">Fee Head</TableHead>
              <TableHead className="px-4 text-sm font-semibold text-right">Net</TableHead>
              <TableHead className="px-4 text-sm font-semibold text-right">Paid</TableHead>
              <TableHead className="px-4 text-sm font-semibold text-right">Balance</TableHead>
              <TableHead className="px-6 text-sm font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studentFees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-sm text-muted-foreground">
                  No fee records for this class
                </TableCell>
              </TableRow>
            ) : (
              studentFees.map((f) => (
                <TableRow key={f.id} className="h-14 border-b hover:bg-muted/40 transition-colors">
                  <TableCell className="px-6 text-sm font-medium">{f.studentName ?? '—'}</TableCell>
                  <TableCell className="px-4 text-sm text-muted-foreground">
                    {f.feeHeadName ?? '—'}
                  </TableCell>
                  <TableCell className="px-4 text-sm font-medium tabular-nums text-right">
                    {fmt(f.netAmount)}
                  </TableCell>
                  <TableCell className="px-4 text-sm tabular-nums text-right text-emerald-600">
                    {fmt(f.paidAmount)}
                  </TableCell>
                  <TableCell className="px-4 text-sm font-semibold tabular-nums text-right">
                    {fmt(f.netAmount - f.paidAmount)}
                  </TableCell>
                  <TableCell className="px-6">
                    <Badge
                      variant={
                        f.status === 'paid'
                          ? 'default'
                          : f.status === 'overdue'
                            ? 'destructive'
                            : 'outline'
                      }
                      className="text-[11px] px-2"
                    >
                      {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <tfoot>
            <tr className="border-t bg-muted/20">
              <td colSpan={6} className="px-6 py-3 text-xs text-muted-foreground">
                {studentFees.length} fee record{studentFees.length !== 1 ? 's' : ''}
              </td>
            </tr>
          </tfoot>
        </Table>
      </Card>
    </div>
  );
}
