'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AuthProvider } from '@/lib/auth';
import { Button } from '@anvix/ui/components/ui/button';
import { Input } from '@anvix/ui/components/ui/input';
import { Label } from '@anvix/ui/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@anvix/ui/components/ui/card';
import { Badge } from '@anvix/ui/components/ui/badge';
import { School, Mail, KeyRound, ArrowLeft, Loader2 } from 'lucide-react';

type Step = 'email' | 'otp';

function LoginForm() {
  const t = useTranslations('auth');
  const common = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login: authLogin, setTenantSlug } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [tenantSlug, setTenantSlugLocal] = useState('');

  useEffect(() => {
    // Priority: subdomain > query param > localStorage
    const hostname = window.location.hostname;
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'anvix.app';
    let subdomainSlug: string | null = null;

    if (hostname.endsWith(`.${appDomain}`)) {
      subdomainSlug = hostname.replace(`.${appDomain}`, '');
    } else if (hostname.endsWith('.localhost') || hostname.match(/^[^.]+\.localhost$/)) {
      const part = hostname.split('.')[0];
      if (part !== 'localhost') subdomainSlug = part;
    }

    const fromQuery = searchParams.get('school');
    const fromStorage = localStorage.getItem('anvix_tenant_slug');
    const resolved = subdomainSlug || fromQuery || fromStorage || '';

    if (resolved) {
      setTenantSlugLocal(resolved);
      setTenantSlug(resolved);
    }
  }, [searchParams, setTenantSlug]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient('/school/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
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
        body: JSON.stringify({ email, otp }),
        tenantSlug,
      })) as {
        token: string;
        user: { id: string; name: string; phone: string; email: string | null; role: string };
      };
      authLogin(
        data.token,
        {
          userId: data.user.id,
          name: data.user.name,
          phone: data.user.phone || data.user.email || '',
          role: data.user.role,
          tenantSchema: `tenant_${tenantSlug.replace(/[^a-z0-9_]/g, '_')}`,
        },
        tenantSlug,
      );
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('invalidOtp'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Subtle background pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative w-full max-w-[400px] page-fade-in">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <School className="size-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight">{common('appName')}</h1>
            {tenantSlug && (
              <Badge variant="secondary" className="mt-1.5 text-[10px] uppercase tracking-wider">
                {tenantSlug}
              </Badge>
            )}
          </div>
        </div>

        <Card className="border-border/60 shadow-lg shadow-black/[0.03]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              {step === 'email' ? t('login') : t('enterOtp')}
            </CardTitle>
            <CardDescription className="text-xs">
              {step === 'email' ? (
                'Enter your registered email to receive a one-time code'
              ) : (
                <>
                  Code sent to <span className="font-medium text-foreground">{email}</span>
                </>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                {error}
              </div>
            )}

            {step === 'email' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium">
                    {t('email')}
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@school.com"
                      className="pl-10 h-10"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading || !email.includes('@')}
                  className="w-full h-10"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    t('sendOtp')
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-xs font-medium">
                    {t('enterOtp')}
                  </Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus={true}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="pl-10 h-10 text-center text-lg tracking-[0.4em] font-mono"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full h-10"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    t('verifyOtp')
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setError('');
                  }}
                  className="w-full text-xs text-muted-foreground"
                >
                  <ArrowLeft className="size-3" />
                  {t('resendOtp')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[10px] uppercase tracking-widest text-muted-foreground/60">
          Powered by Anvix One
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
