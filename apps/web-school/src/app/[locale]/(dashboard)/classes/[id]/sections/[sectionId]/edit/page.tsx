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
  LayoutGrid,
  ShieldAlert,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

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
}

export default function EditSectionPage({
  params,
}: {
  params: Promise<{ id: string; sectionId: string }>;
}) {
  const { id: classId, sectionId } = use(params);
  const router = useRouter();
  const { token, tenantSlug } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState<Section | null>(null);
  const [f, setF] = useState({
    name: '',
    capacity: '',
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
    Promise.all([
      api('/school/academics/classes'),
      api(`/school/academics/classes/${classId}/sections`),
    ])
      .then(([classesData, secsData]) => {
        const classes = Array.isArray(classesData) ? (classesData as ClassItem[]) : [];
        const found = classes.find((c) => c.id === classId);
        if (found) setClassName(found.name);

        const secs = Array.isArray(secsData) ? (secsData as Section[]) : [];
        const sec = secs.find((s) => s.id === sectionId);
        if (sec) {
          setSection(sec);
          setF({
            name: sec.name,
            capacity: sec.capacity != null ? String(sec.capacity) : '',
            isActive: sec.isActive,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [api, classId, sectionId]);

  const save = useCallback(async () => {
    if (!f.name.trim()) return;
    setSaving(true);
    setErr('');
    try {
      await api(`/school/academics/sections/${sectionId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: f.name.trim(),
          capacity: f.capacity ? Number(f.capacity) : null,
          isActive: f.isActive,
        }),
      });
      router.push(`/classes/${classId}?tab=sections`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to update section');
    } finally {
      setSaving(false);
    }
  }, [f, sectionId, classId, api, router]);

  const handleDelete = useCallback(async () => {
    if (deleteConfirm !== 'delete') return;
    setDeleting(true);
    setDeleteErr('');
    try {
      await api(`/school/academics/sections/${sectionId}`, { method: 'DELETE' });
      router.push(`/classes/${classId}?tab=sections`);
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : 'Failed to delete section');
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirm, sectionId, classId, api, router]);

  const toggleActive = useCallback(async () => {
    setSaving(true);
    setErr('');
    try {
      await api(`/school/academics/sections/${sectionId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !f.isActive }),
      });
      setF((prev) => ({ ...prev, isActive: !prev.isActive }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to update status');
    } finally {
      setSaving(false);
    }
  }, [f.isActive, sectionId, api]);

  if (loading) {
    return (
      <div className="space-y-6 page-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Skeleton className="h-56 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center page-fade-in">
        <p className="text-sm font-medium">Section not found</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.push(`/classes/${classId}?tab=sections`)}
        >
          <ArrowLeft className="size-4" />
          Back to Sections
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
          onClick={() => router.push(`/classes/${classId}?tab=sections`)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Edit Section {section.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {className ? `${className} · Section ${section.name}` : `Section ${section.name}`}
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
              <LayoutGrid className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Section Details</h2>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">
                  Section Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                  placeholder="e.g. A, B, C"
                />
                <p className="text-[11px] text-muted-foreground">
                  Usually a single letter like A, B, C, D.
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">Capacity</Label>
                <Input
                  type="number"
                  value={f.capacity}
                  onChange={(e) => setF({ ...f, capacity: e.target.value })}
                  placeholder="e.g. 40"
                />
                <p className="text-[11px] text-muted-foreground">
                  Maximum students allowed. Leave blank for no limit.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column */}
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
                onClick={() => router.push(`/classes/${classId}?tab=sections`)}
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
                Permanently delete this section. Students in this section will lose their section
                reference. This cannot be undone.
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
                Delete Section Permanently
              </Button>
              {deleteErr && <p className="text-xs text-destructive">{deleteErr}</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
