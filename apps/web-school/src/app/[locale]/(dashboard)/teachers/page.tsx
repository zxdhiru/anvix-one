'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Label } from '@anvix/ui/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@anvix/ui/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@anvix/ui/components/ui/select';
import { Users, Plus, Search, Loader2, Phone, Mail, BookOpen } from 'lucide-react';

interface Teacher {
  id: string;
  employeeId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  qualification: string | null;
  specialization: string | null;
  isActive: boolean;
  subjects?: { id: string; name: string }[];
}

interface SubjectItem {
  id: string;
  name: string;
}

export default function TeachersPage() {
  const nav = useTranslations('nav');
  const { token, tenantSlug } = useAuth();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    qualification: '',
    specialization: '',
    subjectIds: [] as string[],
  });

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, { ...opts, tenantSlug: tenantSlug ?? undefined, token: token ?? undefined }),
    [tenantSlug, token],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [teacherData, subjectData] = await Promise.all([
        api('/school/teachers').catch(() => []),
        api('/school/academics/subjects').catch(() => []),
      ]);
      setTeachers(Array.isArray(teacherData) ? teacherData : []);
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTeachers = teachers.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.employeeId?.toLowerCase().includes(q)
    );
  });

  async function handleCreate() {
    setSaving(true);
    setError('');
    try {
      await api('/school/teachers', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          qualification: form.qualification || undefined,
          specialization: form.specialization || undefined,
        }),
      });
      setDialogOpen(false);
      setForm({
        name: '',
        email: '',
        phone: '',
        qualification: '',
        specialization: '',
        subjectIds: [],
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create teacher');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{nav('teachers')}</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? '...'
              : `${teachers.length} teacher${teachers.length !== 1 ? 's' : ''} on staff`}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>
                Enter teacher details to add them to your school.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Teacher name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="teacher@school.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Qualification</Label>
                <Input
                  value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  placeholder="B.Ed, M.Sc"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Specialization</Label>
                <Input
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  placeholder="Mathematics"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving || !form.name}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Creating...
                  </>
                ) : (
                  'Create Teacher'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Users className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium">No teachers found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {search ? 'Try adjusting your search' : 'Add your first teacher to get started'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Teacher</TableHead>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Contact</TableHead>
                  <TableHead className="text-xs">Qualification</TableHead>
                  <TableHead className="text-xs">Subjects</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600">
                          {teacher.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{teacher.name}</p>
                          {teacher.specialization && (
                            <p className="text-[11px] text-muted-foreground">
                              {teacher.specialization}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {teacher.employeeId || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {teacher.phone && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="size-3" /> {teacher.phone}
                          </p>
                        )}
                        {teacher.email && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="size-3" /> {teacher.email}
                          </p>
                        )}
                        {!teacher.phone && !teacher.email && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {teacher.qualification || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {teacher.subjects && teacher.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.map((s) => (
                            <Badge key={s.id} variant="outline" className="text-[10px]">
                              <BookOpen className="mr-1 size-2.5" />
                              {s.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={teacher.isActive ? 'default' : 'destructive'}
                        className="text-[10px]"
                      >
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
