'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
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
import { ArrowLeft, Loader2, Save, IndianRupee } from 'lucide-react';

interface FeeHead {
  id: string;
  name: string;
  isActive: boolean;
}
interface ClassItem {
  id: string;
  name: string;
}
interface AcademicYear {
  id: string;
  name: string;
  isCurrent: boolean;
}
interface Term {
  id: string;
  name: string;
}

function asArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

export default function NewStructurePage() {
  const router = useRouter();
  const { token, tenantSlug } = useAuth();

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, { ...opts, tenantSlug: tenantSlug ?? undefined, token: token ?? undefined }),
    [tenantSlug, token],
  );

  /* ── Reference data ── */
  const [loading, setLoading] = useState(true);
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [h, c, ay] = await Promise.all([
          api('/school/fees/heads').catch(() => []),
          api('/school/academics/classes').catch(() => []),
          api('/school/academics/years').catch(() => []),
        ]);
        if (cancelled) return;

        const yearsArr = asArray<AcademicYear>(ay);
        const cur = yearsArr.find((y) => y.isCurrent);
        let termsArr: Term[] = [];
        if (cur) {
          const t = await api(`/school/academics/years/${cur.id}/terms`).catch(() => []);
          if (!cancelled) termsArr = asArray<Term>(t);
        }

        if (!cancelled) {
          setFeeHeads(asArray<FeeHead>(h).filter((f) => f.isActive));
          setClasses(asArray<ClassItem>(c));
          setAcademicYears(yearsArr);
          setTerms(termsArr);
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
  const [f, setF] = useState({
    name: '',
    ayId: '',
    cId: '',
    fhId: '',
    amt: '',
    due: '',
    tId: '',
  });

  // Default academic year once loaded
  useEffect(() => {
    if (cy && !f.ayId) setF((prev) => ({ ...prev, ayId: cy.id }));
  }, [cy, f.ayId]);

  const isValid = f.name && f.ayId && f.cId && f.fhId && f.amt;

  const create = useCallback(async () => {
    if (!isValid) return;
    setSaving(true);
    setErr('');
    try {
      await api('/school/fees/structures', {
        method: 'POST',
        body: JSON.stringify({
          name: f.name,
          academicYearId: f.ayId,
          classId: f.cId,
          feeHeadId: f.fhId,
          amount: Math.round(parseFloat(f.amt) * 100),
          dueDate: f.due || undefined,
          termId: f.tId || undefined,
        }),
      });
      router.push('/fees?tab=structures');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create fee structure');
    } finally {
      setSaving(false);
    }
  }, [f, isValid, api, router]);

  if (loading) {
    return (
      <div className="space-y-6 page-fade-in">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Skeleton className="h-80" />
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
          onClick={() => router.push('/fees?tab=structures')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Create Fee Structure</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Define a fee line-item for a specific class and fee head.
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
              <IndianRupee className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Structure Details</h2>
            </div>

            <div className="grid gap-5">
              {/* Name */}
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                  placeholder="e.g. Class 10 - Tuition Q1"
                  autoFocus
                />
              </div>

              {/* Academic Year + Class */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium">
                    Academic Year <span className="text-red-500">*</span>
                  </Label>
                  <Select value={f.ayId} onValueChange={(v) => setF({ ...f, ayId: v })}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select year" />
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
                  <Select value={f.cId} onValueChange={(v) => setF({ ...f, cId: v })}>
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
                </div>
              </div>

              {/* Fee Head + Term */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium">
                    Fee Head <span className="text-red-500">*</span>
                  </Label>
                  <Select value={f.fhId} onValueChange={(v) => setF({ ...f, fhId: v })}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select fee head" />
                    </SelectTrigger>
                    <SelectContent>
                      {feeHeads.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium">Term</Label>
                  <Select
                    value={f.tId || 'none'}
                    onValueChange={(v) => setF({ ...f, tId: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Full year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Full Year</SelectItem>
                      {terms.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amount + Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium">
                    Amount (₹) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={f.amt}
                    onChange={(e) => setF({ ...f, amt: e.target.value })}
                    placeholder="5000"
                    min="0"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium">Due Date</Label>
                  <Input
                    type="date"
                    value={f.due}
                    onChange={(e) => setF({ ...f, due: e.target.value })}
                  />
                </div>
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
              <Button onClick={create} disabled={!isValid || saving} className="w-full gap-1.5">
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Create Structure
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/fees?tab=structures')}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              About Structures
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fee structures define how much each class pays for a given fee head. You can set
              per-term or full-year amounts with optional due dates.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
