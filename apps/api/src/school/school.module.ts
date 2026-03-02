import { Module } from '@nestjs/common';
import { SchoolHealthController } from './health/school-health.controller';
import { SchoolHealthService } from './health/school-health.service';

@Module({
  controllers: [SchoolHealthController],
  providers: [SchoolHealthService],
})
export class SchoolModule {}
