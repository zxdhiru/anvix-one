import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { RegisterTenantDto, UpdateTenantStatusDto } from './dto';
import type { SubscriptionStatusType } from '../../common/database/schema/platform/tenants';

@Controller('platform/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post('register')
  register(@Body() dto: RegisterTenantDto) {
    return this.tenantsService.register(dto);
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
}
