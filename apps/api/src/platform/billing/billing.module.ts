import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { TenantsModule } from '../tenants/tenants.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [TenantsModule, PlansModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
