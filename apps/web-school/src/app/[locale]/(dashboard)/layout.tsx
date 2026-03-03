'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';
import { Loader2 } from 'lucide-react';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, token, tenantSlug, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user || !tenantSlug) {
      setCheckingSetup(false);
      return;
    }
    if (pathname.includes('/setup')) {
      setCheckingSetup(false);
      return;
    }
    apiClient('/school/academics/profile', {
      tenantSlug,
      token: token ?? undefined,
    })
      .then((profile) => {
        if (!profile || !(profile as Record<string, unknown>).name) {
          router.push('/setup');
        }
        setCheckingSetup(false);
      })
      .catch((err) => {
        // Only redirect to setup for 404 (profile not found), not transient errors
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('404') || msg.includes('Not Found') || msg.includes('Cannot GET')) {
          router.push('/setup');
        }
        setCheckingSetup(false);
      });
  }, [user, tenantSlug, token, router, pathname]);

  if (isLoading || checkingSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
