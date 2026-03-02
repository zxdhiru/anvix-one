import { IsOptional, IsEnum, IsString, MaxLength } from 'class-validator';

export class UpdateTenantStatusDto {
  @IsEnum(['active', 'suspended', 'cancelled'])
  status: 'active' | 'suspended' | 'cancelled';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
