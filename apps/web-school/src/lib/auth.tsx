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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tenantSlug, setTenantSlugState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    const savedSlug = localStorage.getItem(SLUG_KEY);
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    if (savedSlug) {
      setTenantSlugState(savedSlug);
    }
    setIsLoading(false);
  }, []);

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
