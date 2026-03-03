import { headers } from 'next/headers';

/**
 * Server-side helper to get the tenant info injected by middleware.
 * Use in Server Components and Route Handlers.
 */
export async function getTenantFromHeaders() {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  const name = headersList.get('x-tenant-name');
  const id = headersList.get('x-tenant-id');

  if (!slug) return null;

  return { slug, name, id };
}
