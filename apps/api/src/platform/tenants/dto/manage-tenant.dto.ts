import { IsEmail, IsString, IsUUID, Length } from 'class-validator';

/** Lookup a tenant by admin email */
export class TenantLookupDto {
  @IsEmail()
  email: string;
}

/** Send OTP to tenant admin email */
export class TenantSendOtpDto {
  @IsEmail()
  email: string;
}

/** Verify OTP and get tenant access */
export class TenantVerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}

/** Change plan for a tenant (upgrade/downgrade) */
export class ChangePlanDto {
  @IsUUID()
  planId: string;
}
