import { Module, Global } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { SubscriptionGuard } from './guards/subscription.guard';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [SubscriptionGuard],
  exports: [DatabaseModule, SubscriptionGuard],
})
export class CommonModule {}
