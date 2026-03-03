import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import {
  RegisterTenantDto,
  UpdateTenantStatusDto,
  TenantSendOtpDto,
  TenantVerifyOtpDto,
  ChangePlanDto,
} from './dto';
import type { SubscriptionStatusType } from '../../common/database/schema/platform/tenants';

@Controller('platform/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /* ─── Self-service management (OTP-based auth) ─── */

  @Post('send-otp')
  sendOtp(@Body() dto: TenantSendOtpDto) {
    return this.tenantsService.sendManageOtp(dto.email);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: TenantVerifyOtpDto) {
    return this.tenantsService.verifyManageOtp(dto.email, dto.otp);
  }

  /** GET /api/platform/tenants/me — get current tenant's subscription data */
  @Get('me')
  me(@Headers('authorization') auth: string) {
    const payload = this.extractToken(auth);
    return this.tenantsService.findByEmail(payload.email);
  }

  /** PUT /api/platform/tenants/me/change-plan */
  @Put('me/change-plan')
  changePlan(@Headers('authorization') auth: string, @Body() dto: ChangePlanDto) {
    const payload = this.extractToken(auth);
    return this.tenantsService.changePlan(payload.tenantId, dto);
  }

  /* ─── Admin endpoints ─── */

  @Post('register')
  register(@Body() dto: RegisterTenantDto) {
    return this.tenantsService.register(dto);
  }

  /**
   * POST /api/platform/tenants/register-and-provision
   * Register a tenant AND auto-provision (dev/demo mode — skips payment).
   * Returns the tenant + subscription + admin user + login URL.
   */
  @Post('register-and-provision')
  registerAndProvision(@Body() dto: RegisterTenantDto) {
    return this.tenantsService.registerAndProvision(dto);
  }

  @Get()
  findAll(@Query('status') status?: SubscriptionStatusType) {
    return this.tenantsService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOneWithSubscription(id);
  }

  @Post(':id/provision')
  provision(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.provisionTenant(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantStatusDto) {
    return this.tenantsService.updateStatus(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.remove(id);
  }

  /* ─── Helpers ─── */

  private extractToken(auth: string): { tenantId: string; email: string } {
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }
    const token = auth.slice(7);
    const payload = this.tenantsService.verifyManageToken(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return payload;
  }
}
