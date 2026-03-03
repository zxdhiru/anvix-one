'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Badge } from '@anvix/ui/components/ui/badge';
import { Card } from '@anvix/ui/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@anvix/ui/components/ui/select';
import { GraduationCap, Plus, Search, Phone, Mail, Calendar } from 'lucide-react';

interface Student {
  id: string;
  admissionNumber: string;
  name: string;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  className: string | null;
  sectionName: string | null;
  classId: string | null;
  sectionId: string | null;
  isActive: boolean;
}

interface ClassItem {
  id: string;
  name: string;
  sections?: { id: string; name: string }[];
}

export default function StudentsPage() {
  const nav = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { token, tenantSlug } = useAuth();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('q') ?? '';
  const filterClass = searchParams.get('class') ?? 'all';

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || (key === 'class' && value === 'all')) {
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
      const [studentData, classData] = await Promise.all([
        api('/school/students').catch(() => []),
        api('/school/academics/classes').catch(() => []),
      ]);
      setStudents(Array.isArray(studentData) ? studentData : []);

      // Fetch sections for each class
      const classesWithSections = await Promise.all(
        (Array.isArray(classData) ? classData : []).map(async (cls: ClassItem) => {
          const sections = await api(`/school/academics/classes/${cls.id}/sections`).catch(
            () => [],
          );
          return { ...cls, sections: Array.isArray(sections) ? sections : [] };
        }),
      );
      setClasses(classesWithSections);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesClass = filterClass === 'all' || s.classId === filterClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{nav('students')}</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? '...'
              : `${students.length} student${students.length !== 1 ? 's' : ''} enrolled`}
          </p>
        </div>

        <Button size="sm" onClick={() => router.push('/admission')}>
          <Plus className="size-4" />
          New Admission
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or admission no..."
            value={search}
            onChange={(e) => updateParams({ q: e.target.value })}
            className="pl-10 h-9"
          />
        </div>
        <Select value={filterClass} onValueChange={(v) => updateParams({ class: v })}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <Card className="overflow-hidden p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden flex flex-col">
          <Table className="flex-1">
            <TableHeader className="bg-muted/30">
              <TableRow className="h-12 border-b">
                <TableHead className="px-6 text-sm font-semibold">Student</TableHead>
                <TableHead className="px-4 text-sm font-semibold">Admission #</TableHead>
                <TableHead className="px-4 text-sm font-semibold">Class</TableHead>
                <TableHead className="px-4 text-sm font-semibold">Contact</TableHead>
                <TableHead className="px-6 text-sm font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="min-h-80">
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-80 text-center text-sm text-muted-foreground align-middle"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <GraduationCap className="size-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No students found</p>
                      <p className="text-xs text-muted-foreground">
                        {search || filterClass !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Add your first student to get started'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    className="h-14 border-b hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => router.push(`/students/${student.id}`)}
                  >
                    <TableCell className="px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{student.name}</p>
                          {student.dateOfBirth && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="size-3" />
                              {new Date(student.dateOfBirth).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4">
                      <span className="font-mono text-sm text-muted-foreground">
                        {student.admissionNumber || '—'}
                      </span>
                    </TableCell>

                    <TableCell className="px-4">
                      {student.className ? (
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          {student.className}
                          {student.sectionName ? ` - ${student.sectionName}` : ''}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>

                    <TableCell className="px-4">
                      <div className="space-y-0.5">
                        {student.phone && (
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Phone className="size-3.5" /> {student.phone}
                          </p>
                        )}
                        {student.email && (
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="size-3.5" /> {student.email}
                          </p>
                        )}
                        {!student.phone && !student.email && (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-6">
                      <Badge
                        variant={student.isActive ? 'default' : 'destructive'}
                        className="text-xs px-2 py-1"
                      >
                        {student.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>

            <tfoot>
              <tr className="border-t bg-muted/20">
                <td colSpan={5} className="px-6 py-3 text-xs text-muted-foreground">
                  {filteredStudents.length === 0
                    ? '0 students'
                    : `${filteredStudents.length} student${filteredStudents.length > 1 ? 's' : ''}`}
                </td>
              </tr>
            </tfoot>
          </Table>
        </Card>
      )}
    </div>
  );
}
