import { Injectable } from '@nestjs/common';

interface HealthCheckResult {
  status: string;
  system: string;
  timestamp: string;
}

@Injectable()
export class SchoolHealthService {
  check(): HealthCheckResult {
    return {
      status: 'ok',
      system: 'school',
      timestamp: new Date().toISOString(),
    };
  }
}
