'use client';

import { memo, useState, useCallback, useMemo } from 'react';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Label } from '@anvix/ui/components/ui/label';
import {
  Dialog,
  DialogClose,
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
import { Plus, Loader2, X } from 'lucide-react';
import type { FeeStructure, FeeHead, ClassItem, AcademicYear, Term, ApiCall } from './types';

interface CreateStructureDialogProps {
  feeHeads: FeeHead[];
  classes: ClassItem[];
  academicYears: AcademicYear[];
  terms: Term[];
  api: ApiCall;
  onRefresh: () => void;
  onOptimisticAdd: (structure: FeeStructure) => void;
  onOptimisticClear: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateStructureDialog = memo(function CreateStructureDialog({
  feeHeads,
  classes,
  academicYears,
  terms,
  api,
  onRefresh,
  onOptimisticAdd,
  onOptimisticClear,
  open,
  onOpenChange,
}: CreateStructureDialogProps) {
  const cy = academicYears.find((y) => y.isCurrent);
  const emptyForm = useMemo(
    () => ({ name: '', ayId: cy?.id ?? '', cId: '', fhId: '', amt: '', due: '', tId: '' }),
    [cy?.id],
  );

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [f, setF] = useState(emptyForm);

  const create = useCallback(async () => {
    setSaving(true);
    setErr('');

    const selectedClass = classes.find((c) => c.id === f.cId);
    const selectedHead = feeHeads.find((h) => h.id === f.fhId);
    const selectedTerm = terms.find((t) => t.id === f.tId);

    const optimisticStruct: FeeStructure = {
      id: `temp-${Date.now()}`,
      name: f.name,
      academicYearId: f.ayId,
      classId: f.cId,
      feeHeadId: f.fhId,
      amount: Math.round(parseFloat(f.amt) * 100),
      dueDate: f.due || null,
      termId: f.tId || null,
      isActive: true,
      className: selectedClass?.name,
      feeHeadName: selectedHead?.name,
      termName: selectedTerm?.name,
    };

    try {
      onOptimisticAdd(optimisticStruct);
      setF(emptyForm);
      onOpenChange(false);

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
      onOptimisticClear();
      onRefresh();
    } catch (e) {
      onOptimisticClear();
      setErr(e instanceof Error ? e.message : 'Failed to create fee structure');
    } finally {
      setSaving(false);
    }
  }, [
    f,
    emptyForm,
    classes,
    feeHeads,
    terms,
    api,
    onRefresh,
    onOptimisticAdd,
    onOptimisticClear,
    onOpenChange,
  ]);

  const isValid = f.name && f.ayId && f.cId && f.fhId && f.amt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 text-xs">
          <Plus className="size-3.5" />
          Add Structure
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-zinc-950 border-zinc-800 text-zinc-50 shadow-2xl">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 disabled:pointer-events-none">
          <X className="size-4 text-zinc-400" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <DialogHeader>
          <DialogTitle className="text-base font-semibold tracking-tight text-zinc-50">
            Create Fee Structure
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Define a fee line-item for a specific class and fee head.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-1">
          {/* Name */}
          <div className="grid gap-1.5">
            <Label className="text-xs font-medium text-zinc-300">
              Name <span className="text-red-400">*</span>
            </Label>
            <Input
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              placeholder="e.g. Class 10 - Tuition Q1"
              className="h-9 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-600"
            />
          </div>

          {/* Academic Year + Class */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-zinc-300">
                Academic Year <span className="text-red-400">*</span>
              </Label>
              <Select value={f.ayId} onValueChange={(v) => setF({ ...f, ayId: v })}>
                <SelectTrigger className="h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={y.id} className="focus:bg-zinc-800">
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-zinc-300">
                Class <span className="text-red-400">*</span>
              </Label>
              <Select value={f.cId} onValueChange={(v) => setF({ ...f, cId: v })}>
                <SelectTrigger className="h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="focus:bg-zinc-800">
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
              <Label className="text-xs font-medium text-zinc-300">
                Fee Head <span className="text-red-400">*</span>
              </Label>
              <Select value={f.fhId} onValueChange={(v) => setF({ ...f, fhId: v })}>
                <SelectTrigger className="h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {feeHeads
                    .filter((h) => h.isActive)
                    .map((h) => (
                      <SelectItem key={h.id} value={h.id} className="focus:bg-zinc-800">
                        {h.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-zinc-300">Term</Label>
              <Select
                value={f.tId || 'none'}
                onValueChange={(v) => setF({ ...f, tId: v === 'none' ? '' : v })}
              >
                <SelectTrigger className="h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectValue placeholder="Full year" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectItem value="none" className="focus:bg-zinc-800">
                    Full Year
                  </SelectItem>
                  {terms.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="focus:bg-zinc-800">
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
              <Label className="text-xs font-medium text-zinc-300">
                Amount ({'\u20B9'}) <span className="text-red-400">*</span>
              </Label>
              <Input
                type="number"
                value={f.amt}
                onChange={(e) => setF({ ...f, amt: e.target.value })}
                placeholder="5000"
                min="0"
                className="h-9 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-600"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium text-zinc-300">Due Date</Label>
              <Input
                type="date"
                value={f.due}
                onChange={(e) => setF({ ...f, due: e.target.value })}
                className="h-9 bg-zinc-900 border-zinc-700 text-zinc-100 focus-visible:ring-zinc-600"
              />
            </div>
          </div>
        </div>

        {err && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
            <p className="text-xs text-red-400">{err}</p>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="sm"
            onClick={create}
            disabled={!isValid || saving}
            className="bg-white text-zinc-900 hover:bg-zinc-100"
          >
            {saving && <Loader2 className="mr-1.5 size-3 animate-spin" />}
            Create Structure
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
