'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth';

interface NavItem {
  key: string;
  href: string;
  icon: string;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    key: 'dashboard',
    href: '/',
    icon: '📊',
    roles: ['school_admin', 'vice_principal', 'teacher', 'parent'],
  },
  {
    key: 'students',
    href: '/students',
    icon: '🎓',
    roles: ['school_admin', 'vice_principal', 'teacher'],
  },
  { key: 'teachers', href: '/teachers', icon: '👨‍🏫', roles: ['school_admin', 'vice_principal'] },
  {
    key: 'attendance',
    href: '/attendance',
    icon: '✅',
    roles: ['school_admin', 'vice_principal', 'teacher'],
  },
  { key: 'fees', href: '/fees', icon: '💰', roles: ['school_admin', 'accountant'] },
  {
    key: 'exams',
    href: '/exams',
    icon: '📝',
    roles: ['school_admin', 'vice_principal', 'teacher'],
  },
  {
    key: 'timetable',
    href: '/timetable',
    icon: '🗓️',
    roles: ['school_admin', 'vice_principal', 'teacher', 'parent'],
  },
  { key: 'settings', href: '/settings', icon: '⚙️', roles: ['school_admin'] },
];

export function Sidebar() {
  const nav = useTranslations('nav');
  const t = useTranslations('auth');
  const common = useTranslations('common');
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const role = user?.role ?? 'school_admin';
  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 dark:border-zinc-800">
        <span className="text-lg font-bold text-zinc-900 dark:text-white">{common('appName')}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {nav(item.key as Parameters<typeof nav>[0])}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info + logout */}
      <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
        {user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
              {user.phone}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
              {user.role.replace('_', ' ')}
            </p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
