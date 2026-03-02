import { Module } from '@nestjs/common';
import { PlatformHealthController } from './health/platform-health.controller';
import { PlatformHealthService } from './health/platform-health.service';
import { PlansModule } from './plans/plans.module';
import { TenantsModule } from './tenants/tenants.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [PlansModule, TenantsModule, BillingModule],
  controllers: [PlatformHealthController],
  providers: [PlatformHealthService],
})
export class PlatformModule {}
