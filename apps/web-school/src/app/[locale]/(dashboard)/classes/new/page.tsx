'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Label } from '@anvix/ui/components/ui/label';
import { Card } from '@anvix/ui/components/ui/card';
import { ArrowLeft, Loader2, Save, School } from 'lucide-react';

interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

export default function NewClassPage() {
  const router = useRouter();
  const { token, tenantSlug } = useAuth();

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [f, setF] = useState({
    name: '',
    numericOrder: '',
    academicYearId: '',
    sections: 'A',
  });

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, { ...opts, tenantSlug: tenantSlug ?? undefined, token: token ?? undefined }),
    [tenantSlug, token],
  );

  useEffect(() => {
    api('/school/academics/years')
      .then((d) => {
        const list = Array.isArray(d) ? (d as AcademicYear[]) : [];
        setYears(list);
        const cur = list.find((y) => y.isCurrent);
        if (cur) setF((prev) => ({ ...prev, academicYearId: cur.id }));
      })
      .catch(() => {});
  }, [api]);

  const create = useCallback(async () => {
    if (!f.name.trim() || !f.academicYearId) return;
    setSaving(true);
    setErr('');
    try {
      const res = await api('/school/academics/classes', {
        method: 'POST',
        body: JSON.stringify({
          name: f.name.trim(),
          numericOrder: f.numericOrder ? Number(f.numericOrder) : undefined,
          academicYearId: f.academicYearId,
        }),
      });

      // Create sections if specified
      const classId = (res as { id?: string })?.id;
      if (classId && f.sections.trim()) {
        const sectionNames = f.sections
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        for (const name of sectionNames) {
          await api('/school/academics/sections', {
            method: 'POST',
            body: JSON.stringify({ classId, name }),
          }).catch(() => {});
        }
      }

      router.push('/classes');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create class');
    } finally {
      setSaving(false);
    }
  }, [f, api, router]);

  return (
    <div className="space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => router.push('/classes')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Add Class</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create a new class with optional sections.
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
                  autoFocus
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
                <Label className="text-xs font-medium">
                  Academic Year <span className="text-red-500">*</span>
                </Label>
                <select
                  value={f.academicYearId}
                  onChange={(e) => setF({ ...f, academicYearId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select academic year</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                      {y.isCurrent ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">Sections</Label>
                <Input
                  value={f.sections}
                  onChange={(e) => setF({ ...f, sections: e.target.value })}
                  placeholder="A, B, C"
                />
                <p className="text-[11px] text-muted-foreground">
                  Comma-separated section names to create with the class.
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
                disabled={!f.name.trim() || !f.academicYearId || saving}
                className="w-full gap-1.5"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Create Class
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/classes')}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Tip
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You can add sections (A, B, C) while creating the class. More sections can be added
              later from the class detail page.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
