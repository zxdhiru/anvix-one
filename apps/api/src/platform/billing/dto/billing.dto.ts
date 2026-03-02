import { IsString, IsUUID } from 'class-validator';

/** DTO for creating a Razorpay subscription for a tenant */
export class CreateSubscriptionDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  planId: string;
}

/** DTO for Razorpay webhook payload */
export class RazorpayWebhookDto {
  @IsString()
  event: string;

  payload: Record<string, unknown>;
}
