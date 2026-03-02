import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard that resolves the tenant slug from the request.
 * Extracts from x-tenant-slug header or subdomain.
 * Attaches tenantId (slug) to request for downstream use.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const tenantSlug = this.extractTenantSlug(request);

    if (!tenantSlug) {
      throw new ForbiddenException('Tenant not identified. Send x-tenant-slug header.');
    }

    // Attach tenantId (slug) to request for downstream use
    (request as unknown as Record<string, unknown>)['tenantId'] = tenantSlug;

    return true;
  }

  private extractTenantSlug(request: Request): string | undefined {
    // Priority 1: x-tenant-slug header (from frontend)
    const slug = request.headers['x-tenant-slug'] as string | undefined;
    if (slug) return slug;

    // Priority 2: x-tenant-id header (backwards compat)
    const headerTenantId = request.headers['x-tenant-id'] as string | undefined;
    if (headerTenantId) return headerTenantId;

    // Priority 3: Subdomain extraction (for browser requests)
    const host = request.headers.host;
    if (host) {
      const subdomain = host.split('.')[0];
      if (
        subdomain &&
        subdomain !== 'admin' &&
        subdomain !== 'www' &&
        subdomain !== 'api' &&
        subdomain !== 'localhost'
      ) {
        return subdomain;
      }
    }

    return undefined;
  }
}
