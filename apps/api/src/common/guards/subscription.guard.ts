import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { tenants } from '../database/schema/platform';

/**
 * Guard that validates tenant subscription status before allowing access.
 * Blocks requests for suspended/cancelled tenants.
 *
 * Requires TenantGuard to run first (to set tenantId on request).
 *
 * TODO Phase 1: Add Redis caching with 10-min TTL.
 * TODO Phase 1: Add webhook-driven cache invalidation.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name);

  // In-memory cache (replace with Redis in production)
  private readonly statusCache = new Map<string, { status: string; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  constructor(private readonly databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const tenantId = request['tenantId'] as string;

    if (!tenantId) {
      throw new ForbiddenException('Tenant not identified');
    }

    const status = await this.getTenantStatus(tenantId);

    if (!status) {
      throw new ForbiddenException('Tenant not found');
    }

    if (status === 'suspended') {
      throw new ForbiddenException(
        'Your school subscription is suspended. Please contact support or renew your subscription.',
      );
    }

    if (status === 'cancelled') {
      throw new ForbiddenException(
        'Your school subscription has been cancelled. Please contact support.',
      );
    }

    if (status === 'pending') {
      throw new ForbiddenException(
        'Your school is pending activation. Please complete payment to get started.',
      );
    }

    return true;
  }

  /** Get tenant status with caching */
  private async getTenantStatus(tenantId: string): Promise<string | null> {
    // Check cache first
    const cached = this.statusCache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.status;
    }

    // Query database
    const [tenant] = await this.databaseService.db
      .select({ subscriptionStatus: tenants.subscriptionStatus })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) return null;

    // Cache the result
    this.statusCache.set(tenantId, {
      status: tenant.subscriptionStatus,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    return tenant.subscriptionStatus;
  }

  /** Invalidate cache for a specific tenant (called from webhooks) */
  invalidateCache(tenantId: string) {
    this.statusCache.delete(tenantId);
    this.logger.log(`Cache invalidated for tenant: ${tenantId}`);
  }

  /** Clear entire cache */
  clearCache() {
    this.statusCache.clear();
    this.logger.log('Subscription status cache cleared');
  }
}
