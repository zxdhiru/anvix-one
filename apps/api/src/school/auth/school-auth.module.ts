import { Module } from '@nestjs/common';
import { SchoolAuthController } from './school-auth.controller';
import { SchoolAuthService } from './school-auth.service';
import { OtpService } from './otp.service';

@Module({
  controllers: [SchoolAuthController],
  providers: [SchoolAuthService, OtpService],
  exports: [SchoolAuthService, OtpService],
})
export class SchoolAuthModule {}
