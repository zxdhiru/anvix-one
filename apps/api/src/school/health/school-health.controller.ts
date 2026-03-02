import { Controller, Get } from '@nestjs/common';
import { SchoolHealthService } from './school-health.service';

@Controller('school/health')
export class SchoolHealthController {
  constructor(private readonly healthService: SchoolHealthService) {}

  @Get()
  check() {
    return this.healthService.check();
  }
}
