import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../common/database/database.service';
import { tenants, tenantSubscriptions } from '../../common/database/schema/platform';
import { TenantsService } from '../tenants/tenants.service';
import { PlansService } from '../plans/plans.service';
import { CreateSubscriptionDto } from './dto';
import type { SubscriptionStatusType } from '../../common/database/schema/platform/tenants';

/**
 * Razorpay billing service.
 *
 * NOTE: Actual Razorpay SDK integration requires `razorpay` npm package
 * and live API keys. This service contains the full workflow logic with
 * placeholder Razorpay calls that should be swapped with real SDK calls.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly razorpayKeyId: string;
  private readonly razorpayKeySecret: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly tenantsService: TenantsService,
    private readonly plansService: PlansService,
  ) {
    this.razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');
    this.razorpayKeySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', '');
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET', '');
  }

  private get db() {
    return this.databaseService.db;
  }

  /**
   * Create a Razorpay subscription for a tenant.
   * Returns subscription details with payment link.
   */
  async createSubscription(dto: CreateSubscriptionDto) {
    const tenant = await this.tenantsService.findOne(dto.tenantId);
    const plan = await this.plansService.findOne(dto.planId);

    if (!plan.isActive) {
      throw new BadRequestException('Selected plan is not available');
    }

    // TODO: Replace with actual Razorpay SDK call
    // const razorpay = new Razorpay({ key_id: this.razorpayKeyId, key_secret: this.razorpayKeySecret });
    // const subscription = await razorpay.subscriptions.create({ plan_id: ..., customer: ... });

    const mockRazorpaySubscriptionId = `sub_mock_${Date.now()}`;
    const mockRazorpayCustomerId = `cust_mock_${Date.now()}`;

    // Update subscription record with Razorpay IDs
    await this.db
      .update(tenantSubscriptions)
      .set({
        razorpaySubscriptionId: mockRazorpaySubscriptionId,
        razorpayCustomerId: mockRazorpayCustomerId,
        updatedAt: new Date(),
      })
      .where(eq(tenantSubscriptions.tenantId, dto.tenantId));

    this.logger.log(
      `Created Razorpay subscription for tenant ${tenant.name}: ${mockRazorpaySubscriptionId}`,
    );

    return {
      tenantId: tenant.id,
      razorpaySubscriptionId: mockRazorpaySubscriptionId,
      razorpayCustomerId: mockRazorpayCustomerId,
      planName: plan.name,
      amount: plan.priceInPaise,
      // TODO: Return actual Razorpay payment link / short URL
      paymentLink: `https://rzp.io/mock/${mockRazorpaySubscriptionId}`,
    };
  }

  /**
   * Handle Razorpay webhook events.
   * Maps Razorpay events to internal tenant status updates.
   */
  async handleWebhook(event: string, payload: Record<string, unknown>) {
    this.logger.log(`Received Razorpay webhook: ${event}`);

    switch (event) {
      case 'subscription.activated':
        await this.handleSubscriptionActivated(payload);
        break;
      case 'subscription.charged':
        await this.handleSubscriptionCharged(payload);
        break;
      case 'subscription.pending':
        await this.handleSubscriptionPending(payload);
        break;
      case 'subscription.halted':
        await this.handleSubscriptionHalted(payload);
        break;
      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(payload);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(payload);
        break;
      default:
        this.logger.warn(`Unhandled webhook event: ${event}`);
    }

    return { received: true };
  }

  /** Subscription activated → provision tenant */
  private async handleSubscriptionActivated(payload: Record<string, unknown>) {
    const subscriptionId = this.extractSubscriptionId(payload);
    const tenantSub = await this.findSubscriptionByRazorpayId(subscriptionId);
    if (!tenantSub) return;

    // Provision the tenant (create schema, etc.)
    await this.tenantsService.provisionTenant(tenantSub.tenantId);
    this.logger.log(`Tenant ${tenantSub.tenantId} provisioned via webhook`);
  }

  /** Subscription charged (recurring payment success) */
  private async handleSubscriptionCharged(payload: Record<string, unknown>) {
    const subscriptionId = this.extractSubscriptionId(payload);
    const tenantSub = await this.findSubscriptionByRazorpayId(subscriptionId);
    if (!tenantSub) return;

    await this.updateTenantStatus(tenantSub.tenantId, 'active');
    this.logger.log(`Subscription charged for tenant ${tenantSub.tenantId}`);
  }

  /** Subscription pending (payment retry) */
  private async handleSubscriptionPending(payload: Record<string, unknown>) {
    const subscriptionId = this.extractSubscriptionId(payload);
    const tenantSub = await this.findSubscriptionByRazorpayId(subscriptionId);
    if (!tenantSub) return;

    await this.updateTenantStatus(tenantSub.tenantId, 'past_due');
    this.logger.log(`Subscription past_due for tenant ${tenantSub.tenantId}`);
  }

  /** Subscription halted (all retries failed) */
  private async handleSubscriptionHalted(payload: Record<string, unknown>) {
    const subscriptionId = this.extractSubscriptionId(payload);
    const tenantSub = await this.findSubscriptionByRazorpayId(subscriptionId);
    if (!tenantSub) return;

    await this.updateTenantStatus(tenantSub.tenantId, 'suspended');
    this.logger.log(`Subscription suspended for tenant ${tenantSub.tenantId}`);
  }

  /** Subscription cancelled */
  private async handleSubscriptionCancelled(payload: Record<string, unknown>) {
    const subscriptionId = this.extractSubscriptionId(payload);
    const tenantSub = await this.findSubscriptionByRazorpayId(subscriptionId);
    if (!tenantSub) return;

    await this.updateTenantStatus(tenantSub.tenantId, 'cancelled');
    this.logger.log(`Subscription cancelled for tenant ${tenantSub.tenantId}`);
  }

  /** Payment failed */
  private async handlePaymentFailed(payload: Record<string, unknown>) {
    const subscriptionId = this.extractSubscriptionId(payload);
    if (!subscriptionId) return;

    const tenantSub = await this.findSubscriptionByRazorpayId(subscriptionId);
    if (!tenantSub) return;

    await this.updateTenantStatus(tenantSub.tenantId, 'past_due');
    this.logger.log(`Payment failed for tenant ${tenantSub.tenantId}`);
  }

  /** Helper: find subscription by Razorpay subscription ID */
  private async findSubscriptionByRazorpayId(razorpaySubscriptionId: string) {
    const [sub] = await this.db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.razorpaySubscriptionId, razorpaySubscriptionId))
      .limit(1);
    return sub ?? null;
  }

  /** Helper: update tenant + subscription status */
  private async updateTenantStatus(tenantId: string, status: SubscriptionStatusType) {
    await this.db
      .update(tenants)
      .set({ subscriptionStatus: status, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));

    await this.db
      .update(tenantSubscriptions)
      .set({
        status,
        ...(status === 'cancelled' ? { cancelledAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(tenantSubscriptions.tenantId, tenantId));
  }

  /** Helper: extract subscription ID from Razorpay webhook payload */
  private extractSubscriptionId(payload: Record<string, unknown>): string {
    // Razorpay webhook structure: payload.subscription.entity.id
    const subscription = payload['subscription'] as Record<string, unknown> | undefined;
    const entity = subscription?.['entity'] as Record<string, unknown> | undefined;
    return (entity?.['id'] as string) ?? '';
  }
}
