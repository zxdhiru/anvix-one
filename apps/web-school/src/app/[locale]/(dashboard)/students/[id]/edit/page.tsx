'use client';

import { use, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Label } from '@anvix/ui/components/ui/label';
import { Card } from '@anvix/ui/components/ui/card';
import { Badge } from '@anvix/ui/components/ui/badge';
import { Separator } from '@anvix/ui/components/ui/separator';
import { Skeleton } from '@anvix/ui/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@anvix/ui/components/ui/select';
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  Phone,
  MapPin,
  ShieldAlert,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  AlertTriangle,
  Hash,
} from 'lucide-react';
import type { StudentDetail } from '../../components/types';

/* ─── form shape ─── */

interface EditForm {
  name: string;
  phone: string;
  email: string;
  gender: string;
  bloodGroup: string;
  category: string;
  religion: string;
  aadhaarNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  rollNumber: string;
}

function buildForm(s: StudentDetail): EditForm {
  return {
    name: s.name,
    phone: s.phone ?? '',
    email: s.email ?? '',
    gender: s.gender ?? '',
    bloodGroup: s.bloodGroup ?? '',
    category: s.category ?? '',
    religion: s.religion ?? '',
    aadhaarNumber: s.aadhaarNumber ?? '',
    address: s.address ?? '',
    city: s.city ?? '',
    state: s.state ?? '',
    pincode: s.pincode ?? '',
    rollNumber: s.rollNumber ?? '',
  };
}

/* ─── page ─── */

export default function StudentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { token, tenantSlug } = useAuth();

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, { ...opts, tenantSlug: tenantSlug ?? undefined, token: token ?? undefined }),
    [tenantSlug, token],
  );

  /* ─── load student ─── */
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api(`/school/students/${id}`);
        if (!cancelled) setStudent(data as StudentDetail);
      } catch (e) {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, id]);

  /* ─── form state ─── */
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (student) setForm(buildForm(student));
  }, [student]);

  const set = useCallback(
    (key: keyof EditForm, value: string) => setForm((p) => (p ? { ...p, [key]: value } : p)),
    [],
  );

  const handleSave = useCallback(async () => {
    if (!form || !student) return;
    if (!form.name.trim()) {
      setSaveErr('Name is required');
      return;
    }
    setSaving(true);
    setSaveErr('');
    setSaved(false);
    try {
      const body: Record<string, unknown> = {};
      if (form.name !== student.name) body.name = form.name;
      if (form.phone !== (student.phone ?? '')) body.phone = form.phone || null;
      if (form.email !== (student.email ?? '')) body.email = form.email || null;
      if (form.gender !== (student.gender ?? '')) body.gender = form.gender || null;
      if (form.bloodGroup !== (student.bloodGroup ?? '')) body.bloodGroup = form.bloodGroup || null;
      if (form.category !== (student.category ?? '')) body.category = form.category || null;
      if (form.religion !== (student.religion ?? '')) body.religion = form.religion || null;
      if (form.aadhaarNumber !== (student.aadhaarNumber ?? ''))
        body.aadhaarNumber = form.aadhaarNumber || null;
      if (form.address !== (student.address ?? '')) body.address = form.address || null;
      if (form.city !== (student.city ?? '')) body.city = form.city || null;
      if (form.state !== (student.state ?? '')) body.state = form.state || null;
      if (form.pincode !== (student.pincode ?? '')) body.pincode = form.pincode || null;
      if (form.rollNumber !== (student.rollNumber ?? ''))
        body.rollNumber = form.rollNumber ? Number(form.rollNumber) : null;

      if (Object.keys(body).length === 0) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        return;
      }

      const updated = await api(`/school/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setStudent(updated as StudentDetail);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [form, student, api, id]);

  /* ─── status toggle ─── */
  const [toggling, setToggling] = useState(false);

  const handleToggleStatus = useCallback(async () => {
    if (!student) return;
    setToggling(true);
    try {
      const updated = await api(`/school/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !student.isActive }),
      });
      setStudent(updated as StudentDetail);
    } catch {
      /* silent */
    } finally {
      setToggling(false);
    }
  }, [student, api, id]);

  /* ─── delete ─── */
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [deleteErr, setDeleteErr] = useState('');

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteErr('');
    try {
      await api(`/school/students/${id}`, { method: 'DELETE' });
      router.push('/students');
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  }, [api, id, router]);

  const backUrl = `/students/${id}`;

  /* ─── loading skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-6 page-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  /* ─── error state ─── */
  if (loadErr || !student || !form) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center page-fade-in">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
          <AlertTriangle className="size-6 text-destructive" />
        </div>
        <p className="text-sm font-medium">{loadErr || 'Student not found'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade-in">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-lg"
            onClick={() => router.push(backUrl)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Edit Student</h1>
            <p className="text-xs text-muted-foreground">
              {student.name} &middot; <span className="font-mono">{student.admissionNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="size-3.5" />
              Saved
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => router.push(backUrl)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save Changes
          </Button>
        </div>
      </div>

      {saveErr && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {saveErr}
        </div>
      )}

      <div className="stagger grid gap-6 lg:grid-cols-3">
        {/* ═══ Left column — Form sections ═══ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b bg-muted/30 px-6 py-3.5">
              <User className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Personal Information</h2>
            </div>
            <div className="p-6 grid gap-5">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Full Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="h-10"
                  placeholder="Student full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Blood Group</Label>
                  <Select value={form.bloodGroup} onValueChange={(v) => set('bloodGroup', v)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                  <Input
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    className="h-10"
                    placeholder="e.g. General, OBC"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Religion</Label>
                  <Input
                    value={form.religion}
                    onChange={(e) => set('religion', e.target.value)}
                    className="h-10"
                    placeholder="e.g. Hindu, Muslim"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Aadhaar Number
                  </Label>
                  <Input
                    value={form.aadhaarNumber}
                    onChange={(e) => set('aadhaarNumber', e.target.value)}
                    className="h-10 font-mono"
                    placeholder="XXXX XXXX XXXX"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Roll Number</Label>
                  <Input
                    value={form.rollNumber}
                    onChange={(e) => set('rollNumber', e.target.value)}
                    className="h-10"
                    type="number"
                    placeholder="e.g. 12"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Contact */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b bg-muted/30 px-6 py-3.5">
              <Phone className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Contact</h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="h-10"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="h-10"
                  placeholder="student@email.com"
                  type="email"
                />
              </div>
            </div>
          </Card>

          {/* Address */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b bg-muted/30 px-6 py-3.5">
              <MapPin className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Address</h2>
            </div>
            <div className="p-6 grid gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Street Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  className="h-10"
                  placeholder="House no., street, locality"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    className="h-10"
                    placeholder="City"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">State</Label>
                  <Input
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                    className="h-10"
                    placeholder="State"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Pincode</Label>
                  <Input
                    value={form.pincode}
                    onChange={(e) => set('pincode', e.target.value)}
                    className="h-10"
                    placeholder="XXXXXX"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ═══ Right column — Status & Danger zone ═══ */}
        <div className="space-y-6">
          {/* Student snapshot */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b bg-muted/30 px-6 py-3.5">
              <Hash className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Student Info</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                  {student.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {student.admissionNumber}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2.5 text-sm">
                {student.className && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class</span>
                    <Badge variant="outline" className="text-xs">
                      {student.className}
                      {student.sectionName ? ` — ${student.sectionName}` : ''}
                    </Badge>
                  </div>
                )}
                {student.admissionDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Admitted</span>
                    <span className="font-medium">
                      {new Date(student.admissionDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {student.dateOfBirth && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DOB</span>
                    <span className="font-medium">
                      {new Date(student.dateOfBirth).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={student.isActive ? 'default' : 'destructive'} className="text-xs">
                    {student.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Status management */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b bg-muted/30 px-6 py-3.5">
              {student.isActive ? (
                <ToggleLeft className="size-4 text-muted-foreground" />
              ) : (
                <ToggleRight className="size-4 text-muted-foreground" />
              )}
              <h2 className="text-sm font-semibold">Status</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {student.isActive
                  ? 'This student is currently active and visible in all student lists. Deactivating will hide them from active lists.'
                  : 'This student is currently inactive. Activating will make them visible in all student lists again.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className={
                  student.isActive
                    ? 'w-full'
                    : 'w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                }
                onClick={handleToggleStatus}
                disabled={toggling}
              >
                {toggling ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : student.isActive ? (
                  <ToggleLeft className="size-3.5" />
                ) : (
                  <ToggleRight className="size-3.5" />
                )}
                {student.isActive ? 'Deactivate Student' : 'Activate Student'}
              </Button>
            </div>
          </Card>

          {/* Danger zone */}
          <Card className="overflow-hidden border-destructive/20">
            <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/5 px-6 py-3.5">
              <ShieldAlert className="size-4 text-destructive" />
              <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Permanently delete this student and all associated records including fees, payments,
                and guardian links. This cannot be undone.
              </p>
              <div className="grid gap-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Type <span className="font-mono font-semibold text-destructive">delete</span> to
                  confirm
                </Label>
                <Input
                  placeholder="delete"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="h-9 font-mono border-destructive/30 focus-visible:ring-destructive/30"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleDelete}
                disabled={deleting || deleteConfirm !== 'delete'}
              >
                {deleting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                Delete Student Permanently
              </Button>
              {deleteErr && <p className="text-xs text-destructive">{deleteErr}</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
