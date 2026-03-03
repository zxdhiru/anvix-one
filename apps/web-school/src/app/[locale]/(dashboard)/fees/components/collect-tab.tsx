'use client';

import { memo, useState, useCallback } from 'react';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Label } from '@anvix/ui/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@anvix/ui/components/ui/card';
import { Separator } from '@anvix/ui/components/ui/separator';
import { Textarea } from '@anvix/ui/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@anvix/ui/components/ui/select';
import { Loader2, CheckCircle2, Banknote } from 'lucide-react';
import type { StudentFee, FeePayment, ApiCall } from './types';
import { fmt, StatusBadge } from './utils';

interface CollectTabProps {
  studentFees: StudentFee[];
  api: ApiCall;
  onRefresh: () => void;
}

const defaultForm = {
  amt: '',
  mode: 'cash',
  date: new Date().toISOString().split('T')[0],
  txn: '',
  rem: '',
};

export const CollectTab = memo(function CollectTab({
  studentFees,
  api,
  onRefresh,
}: CollectTabProps) {
  const [sel, setSel] = useState<StudentFee | null>(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [f, setF] = useState(defaultForm);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());

  const bal = sel ? (sel.netAmount - sel.paidAmount) / 100 : 0;

  const collect = useCallback(async () => {
    if (!sel) return;
    setBusy(true);
    setOk(null);
    setErr('');

    const paymentAmountPaise = Math.round(parseFloat(f.amt) * 100);

    try {
      // Optimistic: hide the fee from pending list immediately
      setPaidIds((prev) => new Set(prev).add(sel.id));

      const raw = await api('/school/fees/payments/collect', {
        method: 'POST',
        body: JSON.stringify({
          studentFeeId: sel.id,
          amount: paymentAmountPaise,
          paymentMode: f.mode,
          paymentDate: f.date,
          transactionId: f.txn || undefined,
          remarks: f.rem || undefined,
        }),
      });
      const r = raw as FeePayment;
      setOk(`Payment collected \u2014 Receipt: ${r.receiptNumber}`);
      setSel(null);
      setF(defaultForm);
      setPaidIds(new Set());
      onRefresh();
    } catch (e) {
      setPaidIds(new Set());
      setErr(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setBusy(false);
    }
  }, [sel, f, api, onRefresh]);

  // Filter out paid/waived and optimistically-paid entries
  const pendingFees = studentFees.filter(
    (s) => s.status !== 'paid' && s.status !== 'waived' && !paidIds.has(s.id),
  );

  return (
    <div className="space-y-4">
      {ok && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CardContent className="flex items-center gap-2 py-3">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{ok}</p>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <PendingFeesList
          studentFees={pendingFees}
          selected={sel}
          onSelect={(sf) => {
            setSel(sf);
            setF({ ...f, amt: String((sf.netAmount - sf.paidAmount) / 100) });
          }}
        />
        <PaymentForm
          selected={sel}
          form={f}
          onFormChange={setF}
          balance={bal}
          busy={busy}
          error={err}
          onCollect={collect}
        />
      </div>
    </div>
  );
});

/* ---- Sub-components ---- */

const PendingFeesList = memo(function PendingFeesList({
  studentFees,
  selected,
  onSelect,
}: {
  studentFees: StudentFee[];
  selected: StudentFee | null;
  onSelect: (sf: StudentFee) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Select Pending Fee</CardTitle>
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto">
        {studentFees.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No pending fees to collect
          </p>
        ) : (
          <div className="space-y-1.5">
            {studentFees.map((sf) => (
              <button
                key={sf.id}
                onClick={() => onSelect(sf)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${selected?.id === sf.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">{sf.studentName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {sf.feeHeadName} · {sf.className}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold tabular-nums">
                      {fmt(sf.netAmount - sf.paidAmount)}
                    </p>
                    <StatusBadge status={sf.status} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

interface PaymentFormState {
  amt: string;
  mode: string;
  date: string;
  txn: string;
  rem: string;
}

const PaymentForm = memo(function PaymentForm({
  selected,
  form: f,
  onFormChange: setF,
  balance: bal,
  busy,
  error: err,
  onCollect,
}: {
  selected: StudentFee | null;
  form: PaymentFormState;
  onFormChange: (f: PaymentFormState) => void;
  balance: number;
  busy: boolean;
  error: string;
  onCollect: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        {!selected ? (
          <p className="text-xs text-muted-foreground py-8 text-center">
            Select a pending fee to collect payment
          </p>
        ) : (
          <div className="grid gap-3">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs font-medium">{selected.studentName}</p>
              <p className="text-[10px] text-muted-foreground">
                {selected.feeHeadName} · Balance: {fmt(selected.netAmount - selected.paidAmount)}
              </p>
            </div>
            <div>
              <Label className="text-xs">Amount ({'\u20B9'}) *</Label>
              <Input
                type="number"
                value={f.amt}
                onChange={(e) => setF({ ...f, amt: e.target.value })}
                min="1"
                max={bal}
              />
            </div>
            <div>
              <Label className="text-xs">Payment Mode *</Label>
              <Select value={f.mode} onValueChange={(v) => setF({ ...f, mode: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="netbanking">Net Banking</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="dd">DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Payment Date</Label>
              <Input
                type="date"
                value={f.date}
                onChange={(e) => setF({ ...f, date: e.target.value })}
              />
            </div>
            {f.mode !== 'cash' && (
              <div>
                <Label className="text-xs">Transaction / Ref ID</Label>
                <Input
                  value={f.txn}
                  onChange={(e) => setF({ ...f, txn: e.target.value })}
                  placeholder="UPI ref / Cheque no."
                />
              </div>
            )}
            <div>
              <Label className="text-xs">Remarks</Label>
              <Textarea
                value={f.rem}
                onChange={(e) => setF({ ...f, rem: e.target.value })}
                placeholder="Optional notes"
                rows={2}
              />
            </div>
            <Separator />
            {err && <p className="text-xs text-destructive">{err}</p>}
            <Button
              onClick={onCollect}
              disabled={!f.amt || parseFloat(f.amt) <= 0 || busy}
              className="w-full gap-1.5"
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Banknote className="size-3.5" />
              )}
              Collect {f.amt ? fmt(Math.round(parseFloat(f.amt) * 100)) : '\u20B90'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
