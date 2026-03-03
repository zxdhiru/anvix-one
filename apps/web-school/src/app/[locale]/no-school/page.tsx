'use client';

import { useSearchParams } from 'next/navigation';
import { School, AlertTriangle, ArrowRight, Clock, XCircle } from 'lucide-react';

const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL || 'https://anvix.app';

const STATUS_CONFIG: Record<
  string,
  { icon: typeof AlertTriangle; color: string; title: string; description: string }
> = {
  pending: {
    icon: Clock,
    color: 'text-amber-500',
    title: 'School Setup In Progress',
    description:
      'This school account is being set up. Please check back shortly — it usually takes just a few minutes.',
  },
  suspended: {
    icon: AlertTriangle,
    color: 'text-red-500',
    title: 'Account Suspended',
    description:
      "This school's account has been suspended. Please contact the school administrator or reach out to Anvix support.",
  },
  cancelled: {
    icon: XCircle,
    color: 'text-stone-400',
    title: 'Subscription Ended',
    description:
      "This school's subscription has ended. The school administrator can reactivate by choosing a new plan.",
  },
  past_due: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    title: 'Payment Overdue',
    description:
      "This school's subscription payment is overdue. Access will be restored once the payment is processed.",
  },
  default: {
    icon: AlertTriangle,
    color: 'text-stone-400',
    title: 'School Unavailable',
    description:
      'This school portal is currently unavailable. Please contact the school administrator for more information.',
  },
};

export default function NoSchoolPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'default';
  const schoolName = searchParams.get('school') || 'This school';

  const config = STATUS_CONFIG[reason] || STATUS_CONFIG.default;
  const Icon = config.icon;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#faf9f7] px-6">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #1c1917 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top-left Anvix logo mark */}
      <div className="absolute left-8 top-8 flex items-center gap-2.5 text-stone-400">
        <School className="size-5" />
        <span className="text-sm font-medium tracking-wide">ANVIX ONE</span>
      </div>

      {/* Main content */}
      <div
        className="relative z-10 flex max-w-lg flex-col items-center text-center"
        style={{ animation: 'fadeIn 0.6s ease-out' }}
      >
        {/* Status icon */}
        <div
          className="mb-8 flex size-20 items-center justify-center rounded-2xl border border-stone-200 bg-white shadow-sm"
          style={{ animation: 'fadeIn 0.4s ease-out 0.1s both' }}
        >
          <Icon className={`size-9 ${config.color}`} strokeWidth={1.5} />
        </div>

        {/* School name badge */}
        <div
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-1.5 text-xs font-medium tracking-wide text-stone-500 shadow-sm"
          style={{ animation: 'fadeIn 0.4s ease-out 0.2s both' }}
        >
          <School className="size-3.5" />
          {schoolName}
        </div>

        {/* Title */}
        <h1
          className="mb-3 text-2xl font-semibold tracking-tight text-stone-900"
          style={{ animation: 'fadeIn 0.4s ease-out 0.3s both' }}
        >
          {config.title}
        </h1>

        {/* Description */}
        <p
          className="mb-10 max-w-md leading-relaxed text-stone-500"
          style={{ animation: 'fadeIn 0.4s ease-out 0.4s both' }}
        >
          {config.description}
        </p>

        {/* Actions */}
        <div
          className="flex flex-col items-center gap-3 sm:flex-row"
          style={{ animation: 'fadeIn 0.4s ease-out 0.5s both' }}
        >
          {(reason === 'cancelled' || reason === 'default') && (
            <a
              href={`${MARKETING_URL}/pricing`}
              className="group inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2.5 text-sm font-medium text-amber-50 shadow-sm transition-all hover:bg-amber-700 hover:shadow-md"
            >
              View Plans
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          )}

          <a
            href={MARKETING_URL}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-6 py-2.5 text-sm font-medium text-stone-600 shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50"
          >
            Go to Anvix Home
          </a>
        </div>
      </div>

      {/* Bottom info */}
      <p className="absolute bottom-8 text-xs text-stone-400">
        Need help?{' '}
        <a
          href={`${MARKETING_URL}/contact`}
          className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-600"
        >
          Contact Support
        </a>
      </p>
    </div>
  );
}
