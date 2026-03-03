'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  School,
  CreditCard,
  ArrowUpRight,
  LogOut,
  RefreshCw,
  Crown,
  AlertCircle,
  Calendar,
  Users,
  MessageSquare,
} from 'lucide-react';
import { clsx } from 'clsx';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/* ─── Types ─── */
interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceInPaise: number;
  billingCycle: string;
  maxStudents: number;
  smsQuota: number;
  isActive: boolean;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  board: string;
  email: string;
  principalName: string;
  principalPhone: string;
  subscriptionStatus: string;
  createdAt: string;
}

interface Subscription {
  id: string;
  status: string;
  planId: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  razorpaySubscriptionId: string | null;
}

interface ManageData {
  token?: string;
  tenant: Tenant;
  subscription: Subscription | null;
  currentPlan: Plan | null;
  availablePlans: Plan[];
}

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    trial: 'bg-blue-50 text-blue-700 border-blue-200',
    past_due: 'bg-amber-50 text-amber-700 border-amber-200',
    suspended: 'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-stone-100 text-stone-600 border-stone-200',
    pending: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border capitalize',
        styles[status] || styles.pending,
      )}
    >
      <span
        className={clsx(
          'w-1.5 h-1.5 rounded-full',
          status === 'active' || status === 'trial' ? 'bg-emerald-500' : '',
          status === 'past_due' ? 'bg-amber-500' : '',
          status === 'suspended' || status === 'cancelled' ? 'bg-red-500' : '',
          status === 'pending' ? 'bg-orange-500' : '',
        )}
      />
      {status.replace('_', ' ')}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Dashboard Page
   ═══════════════════════════════════════════════════════════════ */
export default function ManageDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<ManageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  function getToken(): string | null {
    return localStorage.getItem('manage_token');
  }

  function logout() {
    localStorage.removeItem('manage_token');
    localStorage.removeItem('manage_data');
    router.replace('/');
  }

  // Load data on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/manage');
      return;
    }

    // Try cached data first for instant paint
    const cached = localStorage.getItem('manage_data');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as ManageData;
        setData(parsed);
        setLoading(false);
      } catch {
        /* ignore */
      }
    }

    // Always fetch fresh data
    fetchData(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function fetchData(token?: string) {
    const t = token || getToken();
    if (!t) return;

    try {
      const res = await fetch(`${API_BASE}/platform/tenants/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) throw new Error('Failed to load data');
      const freshData = (await res.json()) as ManageData;
      setData(freshData);
      localStorage.setItem('manage_data', JSON.stringify(freshData));
    } catch {
      if (!data) {
        setError('Could not load your subscription data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePlan() {
    if (!selectedNewPlan || !data) return;
    setChangingPlan(true);
    setError('');
    setSuccessMsg('');

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/platform/tenants/me/change-plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId: selectedNewPlan }),
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Could not change plan');
      }
      const freshData = (await res.json()) as ManageData;
      setData(freshData);
      localStorage.setItem('manage_data', JSON.stringify(freshData));
      setShowPlanPicker(false);
      setSelectedNewPlan(null);

      const planName = freshData.currentPlan?.name || 'new plan';
      setSuccessMsg(`Successfully switched to the ${planName} plan!`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setChangingPlan(false);
    }
  }

  /* ── Loading ── */
  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-flex items-center gap-3 text-[var(--muted-foreground)]">
          <span className="w-5 h-5 border-2 border-[var(--muted-foreground)]/30 border-t-[var(--muted-foreground)] rounded-full animate-spin" />
          Loading your dashboard…
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle size={40} className="mx-auto mb-4 text-red-500" />
          <p className="text-lg font-semibold mb-2">Could not load data</p>
          <p className="text-[var(--muted-foreground)] mb-6">
            {error || 'Please try logging in again.'}
          </p>
          <a
            href="/manage"
            className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#b91c1c] transition-all"
          >
            Go to Login <ArrowRight size={14} />
          </a>
        </div>
      </div>
    );
  }

  const { tenant, subscription, currentPlan, availablePlans } = data;
  const price = currentPlan ? currentPlan.priceInPaise / 100 : 0;

  return (
    <div className="min-h-screen">
      {/* ══════ NAV ══════ */}
      <nav className="fixed top-0 inset-x-0 z-50 glass">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <a
            href="/"
            className="font-display font-bold text-xl tracking-tight text-[var(--foreground)]"
          >
            anvix<span className="text-[var(--primary)]">.</span>one
          </a>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fetchData()}
              className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      </nav>

      {/* ══════ BACKGROUND ══════ */}
      <div className="fixed top-20 -left-40 w-[500px] h-[500px] rounded-full bg-orange-200/20 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 -right-40 w-[400px] h-[400px] rounded-full bg-amber-100/30 blur-[100px] pointer-events-none" />

      {/* ══════ MAIN ══════ */}
      <main className="relative pt-28 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* ── Welcome Header ── */}
          <div className="mb-10">
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                  {tenant.name}
                </h1>
                <p className="text-[var(--muted-foreground)] text-sm mt-1">
                  Welcome back, {tenant.principalName} · {tenant.email}
                </p>
              </div>
              <StatusBadge status={tenant.subscriptionStatus} />
            </div>
          </div>

          {/* ── Success/Error Banners ── */}
          {successMsg && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-5 py-3.5 flex items-center gap-3 animate-fade-up">
              <Check size={16} className="shrink-0" />
              {successMsg}
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-5 py-3.5 flex items-center gap-3">
              <AlertCircle size={16} className="shrink-0" />
              {error}
              <button
                type="button"
                onClick={() => setError('')}
                className="ml-auto text-red-400 hover:text-red-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ── Grid ── */}
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {/* School Info Card */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <School size={18} className="text-[var(--primary)]" />
                </div>
                <h2 className="font-display font-semibold text-lg">School Details</h2>
              </div>
              <dl className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--muted-foreground)]">School ID</dt>
                  <dd className="font-mono font-medium">{tenant.slug}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--muted-foreground)]">Board</dt>
                  <dd className="font-medium uppercase">{tenant.board}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--muted-foreground)]">Admin</dt>
                  <dd className="font-medium">{tenant.principalName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--muted-foreground)]">Phone</dt>
                  <dd className="font-medium">{tenant.principalPhone}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--muted-foreground)]">Member since</dt>
                  <dd className="font-medium">
                    {new Date(tenant.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Current Plan Card */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <CreditCard size={18} className="text-[var(--primary)]" />
                </div>
                <h2 className="font-display font-semibold text-lg">Current Plan</h2>
              </div>

              {currentPlan ? (
                <>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="font-display text-3xl font-extrabold">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[var(--muted-foreground)] text-sm">
                      /{currentPlan.billingCycle}
                    </span>
                  </div>
                  <div className="mb-5">
                    <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[var(--primary)] text-xs font-bold px-3 py-1 rounded-full">
                      <Crown size={11} /> {currentPlan.name}
                    </span>
                  </div>
                  <ul className="space-y-2 text-sm mb-5">
                    <li className="flex items-center gap-2">
                      <Users size={14} className="text-[var(--muted-foreground)]" />
                      Up to {currentPlan.maxStudents.toLocaleString('en-IN')} students
                    </li>
                    <li className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-[var(--muted-foreground)]" />
                      {currentPlan.smsQuota.toLocaleString('en-IN')} SMS/month
                    </li>
                    {subscription?.currentPeriodEnd && (
                      <li className="flex items-center gap-2">
                        <Calendar size={14} className="text-[var(--muted-foreground)]" />
                        Renews{' '}
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </li>
                    )}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlanPicker(!showPlanPicker);
                      setError('');
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 border-[var(--border)] hover:border-orange-200 hover:bg-orange-50 transition-all cursor-pointer"
                  >
                    {showPlanPicker ? 'Cancel' : 'Change Plan'}
                  </button>
                </>
              ) : (
                <p className="text-[var(--muted-foreground)] text-sm">No active plan found.</p>
              )}
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="bg-white border border-[var(--border)] rounded-2xl p-7 mb-8">
            <h2 className="font-display font-semibold text-lg mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <a
                href={`http://${tenant.slug}.localhost:3001`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] hover:border-orange-200 hover:bg-orange-50/50 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--foreground)] flex items-center justify-center shrink-0">
                  <ArrowUpRight size={16} className="text-[var(--background)]" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Go to School Dashboard</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {tenant.slug}.localhost:3001
                  </div>
                </div>
              </a>
              <a
                href="/#pricing"
                className="group flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] hover:border-orange-200 hover:bg-orange-50/50 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <CreditCard size={16} className="text-[var(--primary)]" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Compare Plans</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    View all available plans
                  </div>
                </div>
              </a>
            </div>
          </div>

          {/* ── Plan Picker (Upgrade/Downgrade) ── */}
          {showPlanPicker && (
            <div className="animate-fade-up">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-semibold text-xl">Choose a new plan</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanPicker(false);
                    setSelectedNewPlan(null);
                    setError('');
                  }}
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  ← Cancel
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                {availablePlans.map((plan) => {
                  const planPrice = plan.priceInPaise / 100;
                  const isCurrent = subscription?.planId === plan.id;
                  const isSelected = selectedNewPlan === plan.id;
                  const isUpgrade = currentPlan && plan.priceInPaise > currentPlan.priceInPaise;
                  const isDowngrade = currentPlan && plan.priceInPaise < currentPlan.priceInPaise;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => setSelectedNewPlan(plan.id)}
                      className={clsx(
                        'relative text-left rounded-2xl p-6 border-2 transition-all',
                        isCurrent
                          ? 'border-emerald-200 bg-emerald-50/50 cursor-default'
                          : isSelected
                            ? 'border-[var(--primary)] bg-white shadow-xl shadow-orange-100/60 scale-[1.02] cursor-pointer'
                            : 'border-[var(--border)] bg-white hover:border-orange-200 hover:shadow-md cursor-pointer',
                      )}
                    >
                      {isCurrent && (
                        <div className="absolute -top-3 left-5 inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          <Check size={11} /> Current
                        </div>
                      )}
                      {!isCurrent && isUpgrade && (
                        <div className="absolute -top-3 left-5 inline-flex items-center gap-1 bg-[var(--primary)] text-white text-xs font-bold px-3 py-1 rounded-full">
                          ↑ Upgrade
                        </div>
                      )}
                      {!isCurrent && isDowngrade && (
                        <div className="absolute -top-3 left-5 inline-flex items-center gap-1 bg-stone-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          ↓ Downgrade
                        </div>
                      )}

                      <h3 className="font-display font-bold text-lg mb-1">{plan.name}</h3>
                      <p className="text-[var(--muted-foreground)] text-xs mb-4">
                        {plan.description}
                      </p>

                      <div className="mb-4">
                        <span className="font-display text-3xl font-extrabold">
                          ₹{planPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[var(--muted-foreground)] text-xs ml-1">
                          /{plan.billingCycle}
                        </span>
                      </div>

                      <ul className="space-y-2 text-xs mb-4">
                        <li className="flex items-center gap-2">
                          <Check size={13} className="text-emerald-600 shrink-0" />
                          Up to {plan.maxStudents.toLocaleString('en-IN')} students
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={13} className="text-emerald-600 shrink-0" />
                          {plan.smsQuota.toLocaleString('en-IN')} SMS/month
                        </li>
                      </ul>

                      <div
                        className={clsx(
                          'w-full text-center py-2.5 rounded-xl text-xs font-semibold transition-colors',
                          isCurrent
                            ? 'bg-emerald-100 text-emerald-700'
                            : isSelected
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--muted)] text-[var(--foreground)]',
                        )}
                      >
                        {isCurrent ? 'Current Plan' : isSelected ? 'Selected' : 'Select'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedNewPlan && (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleChangePlan}
                    disabled={changingPlan}
                    className={clsx(
                      'inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer',
                      changingPlan
                        ? 'bg-orange-300 text-white cursor-wait'
                        : 'bg-[var(--primary)] text-white hover:bg-[#b91c1c] shadow-lg shadow-orange-600/20',
                    )}
                  >
                    {changingPlan ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Changing plan…
                      </span>
                    ) : (
                      <>
                        Confirm Plan Change <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNewPlan(null);
                      setError('');
                    }}
                    className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-[var(--border)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-display font-bold text-lg">
            anvix<span className="text-[var(--primary)]">.</span>one
          </div>
          <div className="flex items-center gap-6 text-sm text-[var(--muted-foreground)]">
            <a href="/" className="hover:text-[var(--foreground)] transition-colors">
              Home
            </a>
            <a href="/#pricing" className="hover:text-[var(--foreground)] transition-colors">
              Pricing
            </a>
          </div>
          <div className="text-sm text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} Anvix One
          </div>
        </div>
      </footer>
    </div>
  );
}
