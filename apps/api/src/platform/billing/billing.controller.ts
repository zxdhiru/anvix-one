import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { CreateSubscriptionDto, RegisterAndSubscribeDto } from './dto';

@Controller('platform/billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  /**
   * Register a school and create a Razorpay subscription in one step.
   * Returns the subscription_id + Razorpay key for frontend Checkout.
   *
   * Frontend flow:
   * 1. Collect school details → call this endpoint
   * 2. Get back { subscriptionId, razorpayKeyId, ... }
   * 3. Open Razorpay Checkout with subscription_id
   * 4. User completes UPI autopay setup
   * 5. Webhook fires subscription.activated → tenant is provisioned
   */
  @Post('register-and-subscribe')
  registerAndSubscribe(@Body() dto: RegisterAndSubscribeDto) {
    return this.billingService.registerAndSubscribe(dto);
  }

  /** Create a Razorpay subscription for an existing tenant */
  @Post('subscribe')
  createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.billingService.createSubscription(dto);
  }

  /**
   * Razorpay webhook endpoint.
   * Verifies the webhook signature before processing.
   */
  @Post('webhook/razorpay')
  async handleRazorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: Record<string, unknown>,
  ) {
    // Verify webhook signature using raw body + HMAC SHA256
    if (signature && req.rawBody) {
      const isValid = this.billingService.verifyWebhookSignature(req.rawBody, signature);
      if (!isValid) {
        this.logger.warn('Invalid Razorpay webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    const event = body['event'] as string;
    const payload = body['payload'] as Record<string, unknown>;

    if (!event || !payload) {
      this.logger.warn('Invalid webhook payload received');
      return { received: false };
    }

    return this.billingService.handleWebhook(event, payload);
  }
}
