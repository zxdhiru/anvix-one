'use client';

import { use, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Label } from '@anvix/ui/components/ui/label';
import { Card } from '@anvix/ui/components/ui/card';
import { Skeleton } from '@anvix/ui/components/ui/skeleton';
import {
  ArrowLeft,
  Loader2,
  Save,
  School,
  ShieldAlert,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface ClassItem {
  id: string;
  name: string;
  numericOrder: number;
  academicYearId: string;
  classTeacherId: string | null;
  isActive: boolean;
}

export default function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { token, tenantSlug } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [cls, setCls] = useState<ClassItem | null>(null);
  const [f, setF] = useState({
    name: '',
    numericOrder: '',
    academicYearId: '',
    isActive: true,
  });

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, { ...opts, tenantSlug: tenantSlug ?? undefined, token: token ?? undefined }),
    [tenantSlug, token],
  );

  useEffect(() => {
    Promise.all([api('/school/academics/classes'), api('/school/academics/years')])
      .then(([classesData, yearsData]) => {
        const classes = Array.isArray(classesData) ? (classesData as ClassItem[]) : [];
        const found = classes.find((c) => c.id === id);
        if (found) {
          setCls(found);
          setF({
            name: found.name,
            numericOrder: String(found.numericOrder),
            academicYearId: found.academicYearId,
            isActive: found.isActive,
          });
        }
        setYears(Array.isArray(yearsData) ? (yearsData as AcademicYear[]) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api, id]);

  const save = useCallback(async () => {
    if (!f.name.trim()) return;
    setSaving(true);
    setErr('');
    try {
      await api(`/school/academics/classes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: f.name.trim(),
          numericOrder: f.numericOrder ? Number(f.numericOrder) : undefined,
          isActive: f.isActive,
        }),
      });
      router.push(`/classes/${id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to update class');
    } finally {
      setSaving(false);
    }
  }, [f, id, api, router]);

  const handleDelete = useCallback(async () => {
    if (deleteConfirm !== 'delete') return;
    setDeleting(true);
    setDeleteErr('');
    try {
      await api(`/school/academics/classes/${id}`, { method: 'DELETE' });
      router.push('/classes');
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : 'Failed to delete class');
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirm, id, api, router]);

  const toggleActive = useCallback(async () => {
    setSaving(true);
    setErr('');
    try {
      await api(`/school/academics/classes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !f.isActive }),
      });
      setF((prev) => ({ ...prev, isActive: !prev.isActive }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  }, [f.isActive, id, api]);

  if (loading) {
    return (
      <div className="space-y-6 page-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Skeleton className="h-72 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center page-fade-in">
        <p className="text-sm font-medium">Class not found</p>
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
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => router.push(`/classes/${id}`)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Edit {cls.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Update class details or manage its status.
          </p>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main form */}
        <div className="md:col-span-2 space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <School className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Class Details</h2>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">
                  Class Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                  placeholder="e.g. Class 1, Nursery, LKG"
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">Numeric Order</Label>
                <Input
                  type="number"
                  value={f.numericOrder}
                  onChange={(e) => setF({ ...f, numericOrder: e.target.value })}
                  placeholder="e.g. 1, 2, 3"
                />
                <p className="text-[11px] text-muted-foreground">
                  Controls the display order. Nursery = 0, Class 1 = 1, etc.
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">Academic Year</Label>
                <select
                  value={f.academicYearId}
                  onChange={(e) => setF({ ...f, academicYearId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  disabled
                >
                  <option value="">Select</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                      {y.isCurrent ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Academic year cannot be changed after creation.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column — Actions & Danger zone */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Actions
            </h3>
            <div className="grid gap-2">
              <Button onClick={save} disabled={!f.name.trim() || saving} className="w-full gap-1.5">
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Save Changes
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/classes/${id}`)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </Card>

          {/* Status toggle */}
          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Status
            </h3>
            <div className="flex items-center justify-between">
              <p className="text-sm">
                {f.isActive ? (
                  <span className="text-emerald-600 font-medium">Active</span>
                ) : (
                  <span className="text-muted-foreground font-medium">Inactive</span>
                )}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={toggleActive}
                disabled={saving}
              >
                {f.isActive ? (
                  <ToggleRight className="size-3.5" />
                ) : (
                  <ToggleLeft className="size-3.5" />
                )}
                {f.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </Card>

          {/* Danger zone */}
          <Card className="overflow-hidden border-destructive/20">
            <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/5 px-5 py-3">
              <ShieldAlert className="size-4 text-destructive" />
              <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Permanently delete this class and all its sections, subject assignments. Students
                will NOT be deleted but will lose their class reference. This cannot be undone.
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
                Delete Class Permanently
              </Button>
              {deleteErr && <p className="text-xs text-destructive">{deleteErr}</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
