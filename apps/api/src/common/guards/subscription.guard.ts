import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../database/redis.service';
import { tenants } from '../database/schema/platform';

/** Redis key prefix for tenant subscription status cache */
const CACHE_PREFIX = 'tenant_status:';
/** Cache TTL: 10 minutes */
const CACHE_TTL_SECONDS = 600;

/**
 * Guard that validates tenant subscription status before allowing access.
 * Blocks requests for suspended/cancelled/pending tenants.
 *
 * Requires TenantGuard to run first (to set tenantId on request).
 *
 * Uses Redis for caching with 10-min TTL. Falls back to in-memory
 * if Redis is unavailable.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name);

  // In-memory fallback cache (used when Redis is down)
  private readonly fallbackCache = new Map<string, { status: string; expiresAt: number }>();
  private readonly FALLBACK_TTL_MS = 10 * 60 * 1000; // 10 minutes

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

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

  /** Get tenant status with Redis caching (falls back to in-memory) */
  private async getTenantStatus(tenantId: string): Promise<string | null> {
    const cacheKey = `${CACHE_PREFIX}${tenantId}`;

    // Try Redis cache first
    if (this.redisService.isReady()) {
      const cached = await this.redisService.get(cacheKey);
      if (cached) return cached;
    } else {
      // Fallback to in-memory cache
      const cached = this.fallbackCache.get(tenantId);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.status;
      }
    }

    // Query database
    const [tenant] = await this.databaseService.db
      .select({ subscriptionStatus: tenants.subscriptionStatus })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) return null;

    // Cache the result
    if (this.redisService.isReady()) {
      await this.redisService.set(cacheKey, tenant.subscriptionStatus, CACHE_TTL_SECONDS);
    } else {
      this.fallbackCache.set(tenantId, {
        status: tenant.subscriptionStatus,
        expiresAt: Date.now() + this.FALLBACK_TTL_MS,
      });
    }

    return tenant.subscriptionStatus;
  }

  /**
   * Invalidate cache for a specific tenant.
   * Called from webhooks when subscription status changes.
   */
  async invalidateCache(tenantId: string) {
    const cacheKey = `${CACHE_PREFIX}${tenantId}`;

    // Clear from Redis
    await this.redisService.del(cacheKey);

    // Also clear from fallback
    this.fallbackCache.delete(tenantId);

    this.logger.log(`Cache invalidated for tenant: ${tenantId}`);
  }

  /** Clear entire subscription status cache */
  async clearCache() {
    await this.redisService.delPattern(`${CACHE_PREFIX}*`);
    this.fallbackCache.clear();
    this.logger.log('Subscription status cache cleared');
  }
}
