'use client';

import { use, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Button } from '@anvix/ui/components/ui/button';
import { Label } from '@anvix/ui/components/ui/label';
import { Input } from '@anvix/ui/components/ui/input';
import { Card } from '@anvix/ui/components/ui/card';
import { Badge } from '@anvix/ui/components/ui/badge';
import { ArrowLeft, Loader2, Save, BookOpen, Check } from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string | null;
  subjectType: string;
}

interface ExistingCS {
  subjectId: string;
}

export default function AssignSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params);
  const router = useRouter();
  const { token, tenantSlug } = useAuth();

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [className, setClassName] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [periodsPerWeek, setPeriodsPerWeek] = useState('5');

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, { ...opts, tenantSlug: tenantSlug ?? undefined, token: token ?? undefined }),
    [tenantSlug, token],
  );

  useEffect(() => {
    Promise.all([
      api('/school/academics/classes'),
      api('/school/academics/subjects'),
      api(`/school/academics/classes/${classId}/subjects`),
    ])
      .then(([classesData, subsData, csData]) => {
        const classes = Array.isArray(classesData) ? (classesData as ClassItem[]) : [];
        const found = classes.find((c) => c.id === classId);
        if (found) setClassName(found.name);

        const subs = Array.isArray(subsData) ? (subsData as Subject[]) : [];
        setSubjects(subs);

        const existing = Array.isArray(csData) ? (csData as ExistingCS[]) : [];
        setExistingIds(new Set(existing.map((e) => e.subjectId)));
      })
      .catch(() => {});
  }, [api, classId]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const assign = useCallback(async () => {
    if (selected.size === 0) return;
    setSaving(true);
    setErr('');
    try {
      for (const subjectId of selected) {
        await api('/school/academics/class-subjects', {
          method: 'POST',
          body: JSON.stringify({
            classId,
            subjectId,
            periodsPerWeek: periodsPerWeek ? Number(periodsPerWeek) : undefined,
          }),
        });
      }
      router.push(`/classes/${classId}?tab=subjects`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to assign subjects');
    } finally {
      setSaving(false);
    }
  }, [selected, classId, periodsPerWeek, api, router]);

  const available = subjects.filter((s) => !existingIds.has(s.id));

  return (
    <div className="space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => router.push(`/classes/${classId}?tab=subjects`)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Assign Subjects</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {className
              ? `Select subjects to assign to ${className}`
              : 'Select subjects to assign to this class'}
          </p>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Subject selection */}
        <div className="md:col-span-2 space-y-5">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Available Subjects</h2>
              {selected.size > 0 && (
                <Badge className="ml-auto text-xs">{selected.size} selected</Badge>
              )}
            </div>

            {available.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <BookOpen className="size-8 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">No subjects available</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  All subjects have already been assigned, or no subjects exist yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {available.map((sub) => {
                  const isSelected = selected.has(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggle(sub.id)}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div
                        className={`flex size-5 shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {isSelected && <Check className="size-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sub.name}</p>
                        <div className="flex items-center gap-2">
                          {sub.code && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {sub.code}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {sub.subjectType}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="grid gap-1.5 max-w-xs">
              <Label className="text-xs font-medium">Periods per Week</Label>
              <Input
                type="number"
                value={periodsPerWeek}
                onChange={(e) => setPeriodsPerWeek(e.target.value)}
                placeholder="e.g. 5"
              />
              <p className="text-[11px] text-muted-foreground">
                Applied to all selected subjects. Can be changed later.
              </p>
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
                onClick={assign}
                disabled={selected.size === 0 || saving}
                className="w-full gap-1.5"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Assign {selected.size > 0 ? `(${selected.size})` : ''}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/classes/${classId}?tab=subjects`)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </Card>

          {existingIds.size > 0 && (
            <Card className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Already Assigned
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {existingIds.size} subject{existingIds.size !== 1 ? 's' : ''} already assigned to
                this class. Only unassigned subjects are shown above.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
