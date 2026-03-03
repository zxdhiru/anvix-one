import { Badge } from '@anvix/ui/components/ui/badge';
import { Banknote, CreditCard, Smartphone, TrendingUp, FileText } from 'lucide-react';

/** Format paise → INR display string */
export function fmt(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

/** Status → Badge mapping */
export function StatusBadge({ status }: { status: string }) {
  const m: Record<string, { v: 'default' | 'secondary' | 'destructive' | 'outline'; l: string }> = {
    pending: { v: 'outline', l: 'Pending' },
    partial: { v: 'secondary', l: 'Partial' },
    paid: { v: 'default', l: 'Paid' },
    overdue: { v: 'destructive', l: 'Overdue' },
    waived: { v: 'outline', l: 'Waived' },
  };
  const s = m[status] ?? { v: 'outline' as const, l: status };
  return (
    <Badge variant={s.v} className="px-2">
      {s.l}
    </Badge>
  );
}

/** Payment mode → icon component */
export const modeIcon: Record<string, typeof CreditCard> = {
  cash: Banknote,
  upi: Smartphone,
  card: CreditCard,
  netbanking: TrendingUp,
  cheque: FileText,
  dd: FileText,
};

/** Safely cast unknown API response to typed array */
export function asArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}
export function formatDate(date: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
