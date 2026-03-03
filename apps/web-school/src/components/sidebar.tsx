'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@anvix/ui/components/ui/button';
import { Separator } from '@anvix/ui/components/ui/separator';
import { Badge } from '@anvix/ui/components/ui/badge';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ClipboardCheck,
  IndianRupee,
  FileText,
  CalendarDays,
  Settings,
  LogOut,
  School,
  Heart,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    key: 'dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['school_admin', 'vice_principal', 'teacher', 'parent'],
  },
  {
    key: 'myChildren',
    href: '/my-children',
    icon: Heart,
    roles: ['parent'],
  },
  {
    key: 'students',
    href: '/students',
    icon: GraduationCap,
    roles: ['school_admin', 'vice_principal', 'teacher'],
  },
  {
    key: 'admission',
    href: '/admission',
    icon: UserPlus,
    roles: ['school_admin'],
  },
  {
    key: 'classes',
    href: '/classes',
    icon: School,
    roles: ['school_admin', 'vice_principal', 'teacher'],
  },
  {
    key: 'teachers',
    href: '/teachers',
    icon: Users,
    roles: ['school_admin', 'vice_principal'],
  },
  {
    key: 'attendance',
    href: '/attendance',
    icon: ClipboardCheck,
    roles: ['school_admin', 'vice_principal', 'teacher'],
  },
  {
    key: 'fees',
    href: '/fees',
    icon: IndianRupee,
    roles: ['school_admin', 'accountant'],
  },
  {
    key: 'exams',
    href: '/exams',
    icon: FileText,
    roles: ['school_admin', 'vice_principal', 'teacher'],
  },
  {
    key: 'timetable',
    href: '/timetable',
    icon: CalendarDays,
    roles: ['school_admin', 'vice_principal', 'teacher', 'parent'],
  },
  {
    key: 'settings',
    href: '/settings',
    icon: Settings,
    roles: ['school_admin'],
  },
];

const roleLabels: Record<string, string> = {
  school_admin: 'Admin',
  vice_principal: 'Vice Principal',
  teacher: 'Teacher',
  parent: 'Parent',
  accountant: 'Accountant',
  staff: 'Staff',
};

export function Sidebar() {
  const nav = useTranslations('nav');
  const t = useTranslations('auth');
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const role = user?.role ?? 'school_admin';
  const visibleItems = navItems.filter((item) => item.roles.includes(role));
  console.log(user);
  return (
    <aside className="flex h-screen w-[260px] flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-accent">
          <School className="size-4 text-sidebar-accent-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-white">Anvix One</span>
          <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50">
            School Portal
          </span>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon
                    className={`size-[18px] transition-colors ${
                      isActive
                        ? 'text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
                    }`}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {nav(item.key as Parameters<typeof nav>[0])}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User info + logout */}
      <div className="px-3 py-3">
        {user && (
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
              {(user.name?.[0] ?? 'U').toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-xs font-medium text-sidebar-foreground">{user.name}</p>
              <Badge
                variant="secondary"
                className="mt-0.5 h-4 bg-sidebar-accent px-1.5 text-[9px] uppercase tracking-wider text-sidebar-accent-foreground"
              >
                {roleLabels[user.role] ?? user.role}
              </Badge>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="size-4" />
          <span className="text-xs">{t('logout')}</span>
        </Button>
      </div>
    </aside>
  );
}
