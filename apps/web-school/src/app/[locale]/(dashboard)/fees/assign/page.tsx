'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Button } from '@anvix/ui/components/ui/button';
import { Label } from '@anvix/ui/components/ui/label';
import { Card } from '@anvix/ui/components/ui/card';
import { Skeleton } from '@anvix/ui/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@anvix/ui/components/ui/select';
import { ArrowLeft, Loader2, Users, CheckCircle2 } from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
}
interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}

function asArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

export default function AssignFeesPage() {
  const router = useRouter();
  const { token, tenantSlug } = useAuth();

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, { ...opts, tenantSlug: tenantSlug ?? undefined, token: token ?? undefined }),
    [tenantSlug, token],
  );

  /* ── Reference data ── */
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, ay] = await Promise.all([
          api('/school/academics/classes').catch(() => []),
          api('/school/academics/years').catch(() => []),
        ]);
        if (!cancelled) {
          setClasses(asArray<ClassItem>(c));
          setAcademicYears(asArray<AcademicYear>(ay));
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const cy = useMemo(() => academicYears.find((y) => y.isCurrent), [academicYears]);

  /* ── Form ── */
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [cId, setCId] = useState('');
  const [ayId, setAyId] = useState('');

  useEffect(() => {
    if (cy && !ayId) setAyId(cy.id);
  }, [cy, ayId]);

  const assign = useCallback(async () => {
    if (!cId || !ayId) return;
    setSaving(true);
    setErr('');
    setOk('');
    try {
      await api('/school/fees/assign', {
        method: 'POST',
        body: JSON.stringify({ classId: cId, academicYearId: ayId }),
      });
      setOk('Fees assigned successfully. Redirecting…');
      setTimeout(() => router.push('/fees?tab=student-fees'), 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to assign fees');
    } finally {
      setSaving(false);
    }
  }, [cId, ayId, api, router]);

  if (loading) {
    return (
      <div className="space-y-6 page-fade-in">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Skeleton className="h-52" />
          </div>
          <Skeleton className="h-40" />
        </div>
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
          onClick={() => router.push('/fees?tab=student-fees')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Assign Fees to Class</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Create fee entries for all active students in the selected class based on existing fee
            structures.
          </p>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
        </div>
      )}

      {ok && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">{ok}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form */}
        <div className="md:col-span-2">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Users className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Assignment Details</h2>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">
                  Academic Year <span className="text-red-500">*</span>
                </Label>
                <Select value={ayId} onValueChange={setAyId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">
                  Class <span className="text-red-500">*</span>
                </Label>
                <Select value={cId} onValueChange={setCId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Fee entries will be created for every active student in this class.
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
                onClick={assign}
                disabled={!cId || !ayId || saving || !!ok}
                className="w-full gap-1.5"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Users className="size-3.5" />
                )}
                Assign Fees
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/fees?tab=student-fees')}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              How it works
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This will look up all active fee structures for the selected class and academic year,
              then create individual student fee entries for each active student in that class.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
