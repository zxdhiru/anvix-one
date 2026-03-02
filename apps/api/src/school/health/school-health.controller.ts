import { Controller, Get } from '@nestjs/common';
import { SchoolHealthService } from './school-health.service';
import type { HealthCheckResult } from './school-health.service';

@Controller('school/health')
export class SchoolHealthController {
  constructor(private readonly healthService: SchoolHealthService) {}

  @Get()
  check(): HealthCheckResult {
    return this.healthService.check();
  }
}
