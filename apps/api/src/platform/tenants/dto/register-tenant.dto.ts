import { IsString, IsEnum, IsEmail, Matches, MinLength, MaxLength, IsUUID } from 'class-validator';

export class RegisterTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  schoolName: string;

  @IsEnum(['cbse', 'icse', 'state', 'other'])
  board: 'cbse' | 'icse' | 'state' | 'other';

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  principalName: string;

  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Must be a valid 10-digit Indian mobile number' })
  principalPhone: string;

  @IsEmail()
  email: string;

  @IsUUID()
  planId: string;
}
