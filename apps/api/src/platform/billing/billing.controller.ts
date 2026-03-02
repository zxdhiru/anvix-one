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
import { CreateSubscriptionDto } from './dto';

@Controller('platform/billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  /** Create a Razorpay subscription for a tenant */
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
