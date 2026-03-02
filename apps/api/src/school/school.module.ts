import { Module } from '@nestjs/common';
import { SchoolHealthController } from './health/school-health.controller';
import { SchoolHealthService } from './health/school-health.service';
import { SchoolGuardedController } from './school-guarded.controller';

/**
 * School System module.
 *
 * All school endpoints (except /school/health) pass through
 * TenantGuard → SubscriptionGuard to ensure:
 * 1. A valid tenant is identified from the request
 * 2. The tenant's subscription is active
 */
@Module({
  controllers: [SchoolHealthController, SchoolGuardedController],
  providers: [SchoolHealthService],
})
export class SchoolModule {}
