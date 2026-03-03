'use client';

import { use, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Label } from '@anvix/ui/components/ui/label';
import { Card } from '@anvix/ui/components/ui/card';
import { ArrowLeft, Loader2, Save, LayoutGrid } from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
}

export default function NewSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params);
  const router = useRouter();
  const { token, tenantSlug } = useAuth();

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [className, setClassName] = useState('');
  const [f, setF] = useState({
    name: '',
    capacity: '',
  });

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, { ...opts, tenantSlug: tenantSlug ?? undefined, token: token ?? undefined }),
    [tenantSlug, token],
  );

  useEffect(() => {
    api('/school/academics/classes')
      .then((d) => {
        const list = Array.isArray(d) ? (d as ClassItem[]) : [];
        const found = list.find((c) => c.id === classId);
        if (found) setClassName(found.name);
      })
      .catch(() => {});
  }, [api, classId]);

  const create = useCallback(async () => {
    if (!f.name.trim()) return;
    setSaving(true);
    setErr('');
    try {
      await api('/school/academics/sections', {
        method: 'POST',
        body: JSON.stringify({
          classId,
          name: f.name.trim(),
          capacity: f.capacity ? Number(f.capacity) : undefined,
        }),
      });
      router.push(`/classes/${classId}?tab=sections`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create section');
    } finally {
      setSaving(false);
    }
  }, [f, classId, api, router]);

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
          <h1 className="text-xl font-semibold tracking-tight">Add Section</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {className ? `Add a new section to ${className}` : 'Add a new section to this class'}
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
                  autoFocus
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
                  Maximum number of students allowed. Leave blank for no limit.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Actions
            </h3>
            <div className="grid gap-2">
              <Button
                onClick={create}
                disabled={!f.name.trim() || saving}
                className="w-full gap-1.5"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Create Section
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
        </div>
      </div>
    </div>
  );
}
