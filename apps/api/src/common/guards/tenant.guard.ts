import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

/**
 * Guard that resolves the tenant from request and validates subscription.
 * Phase 0: Skeleton only — full implementation in Phase 1.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const tenantId = this.extractTenantId(request);

    if (!tenantId) {
      throw new ForbiddenException('Tenant not identified');
    }

    // Attach tenantId to request for downstream use
    (request as Record<string, unknown>)['tenantId'] = tenantId;

    return true;
  }

  private extractTenantId(request: Request): string | undefined {
    // Priority 1: x-tenant-id header (for API calls)
    const headerTenantId = request.headers['x-tenant-id'] as string | undefined;
    if (headerTenantId) return headerTenantId;

    // Priority 2: Subdomain extraction (for browser requests)
    const host = request.headers.host;
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'admin' && subdomain !== 'www' && subdomain !== 'api') {
        return subdomain;
      }
    }

    return undefined;
  }
}
