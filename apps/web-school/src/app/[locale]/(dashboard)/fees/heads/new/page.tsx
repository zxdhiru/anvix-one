'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Label } from '@anvix/ui/components/ui/label';
import { Card } from '@anvix/ui/components/ui/card';
import { Textarea } from '@anvix/ui/components/ui/textarea';
import { ArrowLeft, Loader2, Save, FileText } from 'lucide-react';

export default function NewFeeHeadPage() {
  const router = useRouter();
  const { token, tenantSlug } = useAuth();

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [f, setF] = useState({
    name: '',
    code: '',
    description: '',
    isRecurring: false,
  });

  const api = useCallback(
    (path: string, opts: RequestInit = {}) =>
      apiClient(path, { ...opts, tenantSlug: tenantSlug ?? undefined, token: token ?? undefined }),
    [tenantSlug, token],
  );

  const create = useCallback(async () => {
    if (!f.name.trim()) return;
    setSaving(true);
    setErr('');
    try {
      await api('/school/fees/heads', {
        method: 'POST',
        body: JSON.stringify({
          name: f.name,
          code: f.code || undefined,
          description: f.description || undefined,
          isRecurring: f.isRecurring,
        }),
      });
      router.push('/fees?tab=heads');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create fee head');
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
          onClick={() => router.push('/fees?tab=heads')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Create Fee Head</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Fee heads represent categories like Tuition, Transport, Lab.
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
              <FileText className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Fee Head Details</h2>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                  placeholder="e.g. Tuition Fee"
                  autoFocus
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">Code</Label>
                <Input
                  value={f.code}
                  onChange={(e) => setF({ ...f, code: e.target.value })}
                  placeholder="e.g. TF"
                />
                <p className="text-[11px] text-muted-foreground">
                  Short code for reports and receipts
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <Textarea
                  value={f.description}
                  onChange={(e) => setF({ ...f, description: e.target.value })}
                  placeholder="Optional description for this fee head…"
                  rows={3}
                  className="resize-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={f.isRecurring}
                  onChange={(e) => setF({ ...f, isRecurring: e.target.checked })}
                  className="size-4 rounded border accent-primary"
                />
                <div>
                  <span className="text-sm font-medium">Recurring fee</span>
                  <p className="text-xs text-muted-foreground">Charged every term automatically</p>
                </div>
              </label>
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
                Create Fee Head
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/fees?tab=heads')}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              About Fee Heads
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fee heads are top-level categories (e.g. Tuition, Transport, Lab Fee). Fee structures
              use these heads to define amounts for each class and term.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
