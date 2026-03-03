import { IsString, IsUUID, IsEnum, IsEmail, Matches, MinLength, MaxLength } from 'class-validator';

/** DTO for creating a Razorpay subscription for a tenant */
export class CreateSubscriptionDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  planId: string;
}

/**
 * DTO for the combined register + subscribe flow.
 * Collects school details and creates a Razorpay subscription in one step.
 * Returns subscription ID + key for frontend Razorpay Checkout.
 */
export class RegisterAndSubscribeDto {
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

/** DTO for Razorpay webhook payload */
export class RazorpayWebhookDto {
  @IsString()
  event: string;

  payload: Record<string, unknown>;
}
