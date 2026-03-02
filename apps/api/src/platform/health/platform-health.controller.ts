import { Controller, Get } from '@nestjs/common';
import { PlatformHealthService } from './platform-health.service';

@Controller('platform/health')
export class PlatformHealthController {
  constructor(private readonly healthService: PlatformHealthService) {}

  @Get()
  check() {
    return this.healthService.check();
  }
}
