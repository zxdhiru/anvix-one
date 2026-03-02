'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const t = useTranslations('auth');
  const common = useTranslations('common');
  const router = useRouter();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // In a real app, tenant slug comes from subdomain or URL
  const tenantSlug =
    typeof window !== 'undefined' ? window.location.hostname.split('.')[0] : 'demo';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient('/school/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
        tenantSlug,
      });
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = (await apiClient('/school/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
        tenantSlug,
      })) as { token: string; user: Record<string, unknown> };
      localStorage.setItem('anvix_school_token', data.token);
      localStorage.setItem('anvix_school_user', JSON.stringify(data.user));
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('invalidOtp'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{common('appName')}</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t('login')}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t('phoneNumber')}
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91XXXXXXXXXX"
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:ring-blue-900"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? common('loading') : t('verifyOtp')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('otpSent')}</p>
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {t('enterOtp')}
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-center text-2xl tracking-[0.5em] text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 dark:focus:ring-blue-900"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? common('loading') : t('verifyOtp')}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setOtp('');
                setError('');
              }}
              className="w-full text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              {t('resendOtp')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
