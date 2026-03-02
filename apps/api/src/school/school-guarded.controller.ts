import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../common/guards/tenant.guard';
import { SubscriptionGuard } from '../common/guards/subscription.guard';

/**
 * Base controller for all guarded school endpoints.
 * TenantGuard runs first to extract tenantId from the request,
 * then SubscriptionGuard checks the tenant's subscription status.
 *
 * All school feature controllers (students, attendance, fees, etc.)
 * should extend or be grouped under this guard setup.
 */
@Controller('school')
@UseGuards(TenantGuard, SubscriptionGuard)
export class SchoolGuardedController {
  /**
   * Verify school access — used by frontends to check
   * if the current tenant's subscription is active.
   */
  @Get('verify')
  verify() {
    return {
      status: 'ok',
      message: 'School access verified. Subscription is active.',
    };
  }

  /**
   * Get school dashboard overview.
   * Placeholder for Phase 2 when real data modules are added.
   */
  @Get('dashboard')
  dashboard() {
    return {
      message: 'School dashboard — data modules coming in Phase 2.',
      modules: {
        users: 'Phase 2',
        students: 'Phase 2',
        attendance: 'Phase 3',
        fees: 'Phase 4',
        exams: 'Phase 5',
      },
    };
  }
}
