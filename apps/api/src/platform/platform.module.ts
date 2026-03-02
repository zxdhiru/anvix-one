import { Module } from '@nestjs/common';
import { PlatformHealthController } from './health/platform-health.controller';
import { PlatformHealthService } from './health/platform-health.service';

@Module({
  controllers: [PlatformHealthController],
  providers: [PlatformHealthService],
})
export class PlatformModule {}
