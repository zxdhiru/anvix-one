'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';

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

  // Check if school needs setup (no profile yet)
  useEffect(() => {
    if (!user || !tenantSlug) {
      setCheckingSetup(false);
      return;
    }

    // Don't redirect if already on setup page
    if (pathname.includes('/setup')) {
      setCheckingSetup(false);
      return;
    }

    apiClient('/school/academics/profile', {
      tenantSlug,
      token: token ?? undefined,
    })
      .then((profile) => {
        // If no profile or profile name is empty, redirect to setup
        if (!profile || !profile.name) {
          router.push('/setup');
        }
        setCheckingSetup(false);
      })
      .catch(() => {
        // Profile doesn't exist => needs setup
        router.push('/setup');
        setCheckingSetup(false);
      });
  }, [user, tenantSlug, token, router, pathname]);

  if (isLoading || checkingSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
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
