'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface User {
  userId: string;
  name: string;
  phone: string;
  role: string;
  tenantSchema: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  tenantSlug: string | null;
  isLoading: boolean;
  login: (token: string, user: User, slug?: string) => void;
  logout: () => void;
  setTenantSlug: (slug: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'anvix_school_token';
const USER_KEY = 'anvix_school_user';
const SLUG_KEY = 'anvix_tenant_slug';

/**
 * Extract the tenant slug from the current hostname (subdomain).
 * e.g. "demo-school.anvix.app" → "demo-school"
 */
function getSlugFromSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'anvix.app';

  // Production: *.anvix.app
  if (hostname.endsWith(`.${appDomain}`)) {
    const slug = hostname.replace(`.${appDomain}`, '');
    if (slug && slug !== 'www' && slug !== 'admin' && slug !== 'api') {
      return slug;
    }
  }

  // Local dev: *.localhost
  if (hostname.endsWith('.localhost') || hostname.match(/^[^.]+\.localhost$/)) {
    const slug = hostname.split('.')[0];
    if (slug && slug !== 'localhost') return slug;
  }

  return null;
}

interface AuthProviderProps {
  children: ReactNode;
  /** Tenant slug injected from server (middleware). Takes priority over subdomain/localStorage. */
  initialSlug?: string | null;
}

export function AuthProvider({ children, initialSlug }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tenantSlug, setTenantSlugState] = useState<string | null>(initialSlug ?? null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }

    // Resolve tenant slug: server prop > subdomain > localStorage
    if (!tenantSlug) {
      const subdomainSlug = getSlugFromSubdomain();
      const savedSlug = localStorage.getItem(SLUG_KEY);
      const resolved = subdomainSlug || savedSlug;
      if (resolved) {
        setTenantSlugState(resolved);
        localStorage.setItem(SLUG_KEY, resolved);
      }
    } else {
      // Sync server-provided slug to localStorage
      localStorage.setItem(SLUG_KEY, tenantSlug);
    }

    setIsLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setTenantSlug = useCallback((slug: string) => {
    localStorage.setItem(SLUG_KEY, slug);
    setTenantSlugState(slug);
  }, []);

  const login = useCallback((newToken: string, newUser: User, slug?: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    if (slug) {
      localStorage.setItem(SLUG_KEY, slug);
      setTenantSlugState(slug);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(SLUG_KEY);
    setToken(null);
    setUser(null);
    setTenantSlugState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, tenantSlug, isLoading, login, logout, setTenantSlug }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
