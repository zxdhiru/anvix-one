'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';
import type { TabKey } from './types';

const VALID_TABS = new Set<string>([
  'overview',
  'heads',
  'structures',
  'student-fees',
  'collect',
  'payments',
]);

/**
 * Manages fee page state via URL search params.
 * Persists: tab, class filter, status filter, search query.
 */
export function useFeeUrlState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || value === 'all') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      startTransition(() => {
        router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
      });
    },
    [searchParams, router, pathname, startTransition],
  );

  const tab = useMemo<TabKey>(() => {
    const raw = searchParams.get('tab');
    return raw && VALID_TABS.has(raw) ? (raw as TabKey) : 'overview';
  }, [searchParams]);

  const classFilter = searchParams.get('class') ?? 'all';
  const statusFilter = searchParams.get('status') ?? 'all';
  const searchQuery = searchParams.get('q') ?? '';
  const structClassFilter = searchParams.get('sclass') ?? 'all';

  const setTab = useCallback((t: TabKey) => setParams({ tab: t }), [setParams]);
  const setClassFilter = useCallback((v: string) => setParams({ class: v }), [setParams]);
  const setStatusFilter = useCallback((v: string) => setParams({ status: v }), [setParams]);
  const setSearchQuery = useCallback((v: string) => setParams({ q: v }), [setParams]);
  const setStructClassFilter = useCallback((v: string) => setParams({ sclass: v }), [setParams]);

  return {
    tab,
    classFilter,
    statusFilter,
    searchQuery,
    structClassFilter,
    setTab,
    setClassFilter,
    setStatusFilter,
    setSearchQuery,
    setStructClassFilter,
  };
}
