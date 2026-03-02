import { Injectable } from '@nestjs/common';

interface HealthCheckResult {
  status: string;
  system: string;
  timestamp: string;
}

@Injectable()
export class PlatformHealthService {
  check(): HealthCheckResult {
    return {
      status: 'ok',
      system: 'platform',
      timestamp: new Date().toISOString(),
    };
  }
}
