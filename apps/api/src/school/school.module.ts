import { Module } from '@nestjs/common';
import { SchoolHealthController } from './health/school-health.controller';
import { SchoolHealthService } from './health/school-health.service';
import { SchoolGuardedController } from './school-guarded.controller';
import { SchoolAuthModule } from './auth/school-auth.module';
import { UsersModule } from './users/users.module';
import { AcademicsModule } from './academics/academics.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { GuardiansModule } from './guardians/guardians.module';

/**
 * School System module.
 *
 * All school endpoints (except /school/health) pass through
 * TenantGuard → SubscriptionGuard to ensure:
 * 1. A valid tenant is identified from the request
 * 2. The tenant's subscription is active
 */
@Module({
  imports: [
    SchoolAuthModule,
    UsersModule,
    AcademicsModule,
    StudentsModule,
    TeachersModule,
    GuardiansModule,
  ],
  controllers: [SchoolHealthController, SchoolGuardedController],
  providers: [SchoolHealthService],
})
export class SchoolModule {}
