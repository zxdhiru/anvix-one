import { Controller, Get, Put, Param, Body, Req, UseGuards } from '@nestjs/common';
import { GuardiansService } from './guardians.service';
import type { ChildInfo, GuardianProfile } from './guardians.service';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators';

@Controller('school/guardians')
@UseGuards(TenantGuard, SubscriptionGuard, AuthGuard, RoleGuard)
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Get('my-children')
  @Roles('parent')
  getMyChildren(@Req() req: Record<string, unknown>) {
    const user = req['user'] as { userId: string };
    return this.guardiansService.getMyChildren(user.userId);
  }

  @Get('my-children/:studentId')
  @Roles('parent')
  getChildDetail(@Req() req: Record<string, unknown>, @Param('studentId') studentId: string) {
    const user = req['user'] as { userId: string };
    return this.guardiansService.getChildDetail(user.userId, studentId);
  }

  @Get('my-profile')
  @Roles('parent')
  getMyProfile(@Req() req: Record<string, unknown>) {
    const user = req['user'] as { userId: string };
    return this.guardiansService.getMyProfile(user.userId);
  }

  @Put('my-profile')
  @Roles('parent')
  updateMyProfile(
    @Req() req: Record<string, unknown>,
    @Body() body: Partial<{ email: string; occupation: string; address: string }>,
  ) {
    const user = req['user'] as { userId: string };
    return this.guardiansService.updateMyProfile(user.userId, body);
  }
}
