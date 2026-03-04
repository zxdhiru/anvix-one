import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'anvix.app';
const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL || 'https://anvix.app';

/**
 * Simple in-memory cache for tenant lookups.
 * Keeps middleware fast — avoids hitting the API on every request.
 * Cache is per-instance, cleared on cold start (fine for edge/serverless).
 */
const tenantCache = new Map<string, { data: TenantInfo | null; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  subscriptionStatus: string;
}

/**
 * Extract the subdomain slug from the hostname.
 * e.g. "demo-school.anvix.app" → "demo-school"
 *      "localhost:3002"         → null (no subdomain)
 *      "anvix.app"             → null (bare domain)
 */
function extractSlug(host: string): string | null {
  // Remove port
  const hostname = host.split(':')[0];

  // Local development: check for pattern like slug.localhost
  if (hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    const slug = hostname.split('.')[0];
    return slug && slug !== 'localhost' && slug !== 'local' ? slug : null;
  }

  // Production: *.anvix.app
  if (hostname.endsWith(`.${APP_DOMAIN}`)) {
    const slug = hostname.replace(`.${APP_DOMAIN}`, '');
    // Ignore www, admin, api subdomains
    if (slug && slug !== 'www' && slug !== 'admin' && slug !== 'api') {
      return slug;
    }
  }

  return null;
}

/**
 * Validate a tenant slug against the API.
 * Returns tenant info if exists and active, null otherwise.
 */
async function validateTenant(slug: string): Promise<TenantInfo | null> {
  // Check cache first
  const cached = tenantCache.get(slug);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  try {
    const res = await fetch(`${API_BASE}/platform/tenants/by-slug/${slug}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      tenantCache.set(slug, { data: null, expiry: Date.now() + CACHE_TTL });
      return null;
    }

    const body = await res.json();
    console.log(`[middleware] Body:`, JSON.stringify(body));
    const tenant: TenantInfo | null = body.exists ? body.tenant : null;

    tenantCache.set(slug, { data: tenant, expiry: Date.now() + CACHE_TTL });
    return tenant;
  } catch {
    // On network error, don't cache — let next request retry
    return null;
  }
}

const ACTIVE_STATUSES = new Set(['active', 'trial']);

export default async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const slug = extractSlug(host);

  // ── No subdomain → pass through (landing page / bare domain) ──
  if (!slug) {
    return intlMiddleware(request);
  }

  const { pathname } = request.nextUrl;

  // ── Skip static/internal paths ──
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // ── Allow the "no-school" page without validation ──
  if (pathname.includes('/no-school')) {
    return intlMiddleware(request);
  }

  // ── Validate tenant ──
  const tenant = await validateTenant(slug);

  if (!tenant) {
    // Tenant slug doesn't exist → redirect to marketing site purchase page
    const url = new URL(`${MARKETING_URL}/pricing?ref=invalid-school&slug=${slug}`);
    return NextResponse.redirect(url);
  }

  if (!ACTIVE_STATUSES.has(tenant.subscriptionStatus)) {
    // Tenant exists but subscription is not active → show "no-school" page
    const locale = pathname.split('/')[1] || 'en';
    const noSchoolUrl = request.nextUrl.clone();
    noSchoolUrl.pathname = `/${locale}/no-school`;
    noSchoolUrl.searchParams.set('reason', tenant.subscriptionStatus);
    noSchoolUrl.searchParams.set('school', tenant.name);
    return NextResponse.rewrite(noSchoolUrl);
  }

  // ── Tenant is valid and active → inject slug into headers for downstream use ──
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-slug', slug);
  requestHeaders.set('x-tenant-name', tenant.name);
  requestHeaders.set('x-tenant-id', tenant.id);

  const response = intlMiddleware(request);

  // Propagate tenant headers to the response (for client-side hydration)
  response.headers.set('x-tenant-slug', slug);
  response.headers.set('x-tenant-name', tenant.name);

  return response;
}

export const config = {
  matcher: ['/', '/(en|hi)/:path*', '/((?!_next|favicon\\.ico|api).*)'],
};
