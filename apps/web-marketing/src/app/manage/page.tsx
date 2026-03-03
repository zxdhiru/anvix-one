'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/* ═══════════════════════════════════════════════════════════════
   Manage Login – OTP-based auth for school admins
   ═══════════════════════════════════════════════════════════════ */

export default function ManageLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // If already logged in, redirect
  useEffect(() => {
    const token = localStorage.getItem('manage_token');
    if (token) {
      router.replace('/manage/dashboard');
    }
  }, [router]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/platform/tenants/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Could not send OTP');
      }
      setStep('otp');
      setCountdown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/platform/tenants/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Invalid OTP');
      }
      const data = await res.json();
      localStorage.setItem('manage_token', data.token);
      localStorage.setItem('manage_data', JSON.stringify(data));
      router.push('/manage/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/platform/tenants/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'Could not resend OTP');
      }
      setCountdown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* ══════ NAV ══════ */}
      <nav className="fixed top-0 inset-x-0 z-50 glass">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <a
            href="/"
            className="font-display font-bold text-xl tracking-tight text-[var(--foreground)]"
          >
            anvix<span className="text-[var(--primary)]">.</span>one
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft size={14} /> Back to home
          </a>
        </div>
      </nav>

      {/* ══════ BACKGROUND ══════ */}
      <div className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full bg-orange-200/30 blur-[120px]" />
      <div className="absolute bottom-0 -right-40 w-[400px] h-[400px] rounded-full bg-amber-100/40 blur-[100px]" />

      {/* ══════ MAIN ══════ */}
      <main className="relative pt-36 pb-24 px-6 noise">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="animate-fade-up inline-flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-amber-200/60">
              <ShieldCheck size={13} />
              Secure Login
            </div>
            <h1 className="animate-fade-up delay-100 font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Manage your school
            </h1>
            <p className="animate-fade-up delay-200 text-[var(--muted-foreground)] text-base">
              View your subscription, upgrade or downgrade your plan and more.
            </p>
          </div>

          {/* Card */}
          <div className="animate-fade-up delay-300 bg-white border border-[var(--border)] rounded-3xl p-8 sm:p-10 shadow-xl">
            {/* Steps indicator */}
            <div className="flex gap-2 mb-8">
              <div
                className={clsx(
                  'h-1.5 rounded-full flex-1 transition-colors',
                  'bg-[var(--primary)]',
                )}
              />
              <div
                className={clsx(
                  'h-1.5 rounded-full flex-1 transition-colors',
                  step === 'otp' ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]',
                )}
              />
            </div>

            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                      <Mail size={18} className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg">Enter your email</h3>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        We&apos;ll send a 6-digit code to verify
                      </p>
                    </div>
                  </div>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@yourschool.com"
                    className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30 focus:border-[var(--primary)] transition-all placeholder:text-[var(--muted-foreground)]/50"
                  />
                  <p className="text-xs text-[var(--muted-foreground)] mt-2">
                    Use the email address you registered your school with.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={clsx(
                    'w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer',
                    loading
                      ? 'bg-orange-300 text-white cursor-wait'
                      : 'bg-[var(--primary)] text-white hover:bg-[#b91c1c]',
                  )}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending code…
                    </span>
                  ) : (
                    <>
                      Send Verification Code <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                      <KeyRound size={18} className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg">
                        Enter verification code
                      </h3>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Sent to{' '}
                        <span className="font-medium text-[var(--foreground)]">{email}</span>
                      </p>
                    </div>
                  </div>

                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="\d{6}"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30 focus:border-[var(--primary)] transition-all placeholder:text-[var(--muted-foreground)]/30"
                    autoFocus
                  />

                  <div className="flex items-center justify-between mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setOtp('');
                        setError('');
                      }}
                      className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                    >
                      ← Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={countdown > 0 || loading}
                      className={clsx(
                        'text-xs transition-colors cursor-pointer',
                        countdown > 0
                          ? 'text-[var(--muted-foreground)]'
                          : 'text-[var(--primary)] hover:text-[#b91c1c]',
                      )}
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className={clsx(
                    'w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all cursor-pointer',
                    loading
                      ? 'bg-orange-300 text-white cursor-wait'
                      : otp.length < 6
                        ? 'bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed'
                        : 'bg-[var(--primary)] text-white hover:bg-[#b91c1c]',
                  )}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying…
                    </span>
                  ) : (
                    <>
                      Verify & Continue <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer hint */}
          <p className="text-center text-xs text-[var(--muted-foreground)] mt-6">
            Don&apos;t have an account?{' '}
            <a
              href="/#pricing"
              className="text-[var(--primary)] hover:text-[#b91c1c] font-medium transition-colors"
            >
              Register your school →
            </a>
          </p>
        </div>
      </main>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-[var(--border)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-display font-bold text-lg">
            anvix<span className="text-[var(--primary)]">.</span>one
          </div>
          <div className="text-sm text-[var(--muted-foreground)]">
            © {new Date().getFullYear()} Anvix One · Made with ♥ for Indian schools
          </div>
        </div>
      </footer>
    </div>
  );
}
