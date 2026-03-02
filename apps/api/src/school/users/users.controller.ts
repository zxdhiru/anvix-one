import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RoleGuard } from '../../common/guards/role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import type { UserRow } from './users.service';

@Controller('school/users')
@UseGuards(TenantGuard, SubscriptionGuard, AuthGuard, RoleGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('school_admin', 'vice_principal')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('school_admin', 'vice_principal')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('school_admin')
  create(@Body() body: { name: string; phone: string; email?: string; role: string }) {
    return this.usersService.create(body);
  }

  @Put(':id')
  @Roles('school_admin')
  update(
    @Param('id') id: string,
    @Body()
    body: { name?: string; phone?: string; email?: string; role?: string; isActive?: boolean },
  ) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  @Roles('school_admin')
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
