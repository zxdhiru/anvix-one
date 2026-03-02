import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { SchoolAuthService } from './school-auth.service';

@Controller('school/auth')
@UseGuards(TenantGuard, SubscriptionGuard)
export class SchoolAuthController {
  constructor(private readonly authService: SchoolAuthService) {}

  /**
   * POST /api/school/auth/send-otp
   * Send OTP to a phone number registered in this tenant.
   */
  @Post('send-otp')
  async sendOtp(@Body() body: { phone: string }) {
    return this.authService.sendOtp(body.phone);
  }

  /**
   * POST /api/school/auth/verify-otp
   * Verify OTP and receive an auth token.
   */
  @Post('verify-otp')
  async verifyOtp(@Body() body: { phone: string; otp: string }) {
    return this.authService.verifyOtp(body.phone, body.otp);
  }
}
