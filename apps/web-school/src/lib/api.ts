const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/** Recursively transform snake_case keys to camelCase */
function toCamel(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(toCamel);
  if (data !== null && typeof data === 'object' && !(data instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      const ck = k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
      out[ck] = toCamel(v);
    }
    return out;
  }
  return data;
}

export async function apiClient(
  path: string,
  options: RequestInit & { tenantSlug?: string; token?: string } = {},
) {
  const { tenantSlug, token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `API error: ${res.status}`);
  }

  const text = await res.text();
  if (!text) return null;
  return toCamel(JSON.parse(text));
}
