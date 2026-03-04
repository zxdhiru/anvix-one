import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import Razorpay from 'razorpay';
import type { Subscriptions } from 'razorpay/dist/types/subscriptions';
import type { Plans } from 'razorpay/dist/types/plans';
import type { Customers } from 'razorpay/dist/types/customers';
import * as crypto from 'crypto';
import { DatabaseService } from '../../common/database/database.service';
import { RedisService } from '../../common/database/redis.service';
import { tenants, tenantSubscriptions } from '../../common/database/schema/platform';
import { TenantsService } from '../tenants/tenants.service';
import { PlansService } from '../plans/plans.service';
import { CreateSubscriptionDto, RegisterAndSubscribeDto } from './dto';
import type { SubscriptionStatusType } from '../../common/database/schema/platform/tenants';

/** Redis key prefix for tenant subscription status cache (matches SubscriptionGuard) */
const CACHE_PREFIX = 'tenant_status:';

/**
 * Razorpay billing service.
 * Handles subscription creation, webhook processing, and payment lifecycle.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly razorpay: Razorpay;
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
    private readonly tenantsService: TenantsService,
    private readonly plansService: PlansService,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET', '');
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET', '');

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    this.logger.log('Razorpay SDK initialized');
  }

  private get db() {
    return this.databaseService.db;
  }

  /**
   * Create a Razorpay subscription for a tenant.
   *
   * Flow:
   * 1. Find or create a Razorpay Plan matching our plan's price/billing cycle
   * 2. Create a Razorpay customer for the tenant
   * 3. Create a Razorpay subscription linking customer to plan
   * 4. Store Razorpay IDs in our tenant_subscriptions table
   * 5. Return the payment link (short_url) for the school to pay
   */
  async createSubscription(dto: CreateSubscriptionDto) {
    const tenant = await this.tenantsService.findOne(dto.tenantId);
    const plan = await this.plansService.findOne(dto.planId);

    if (!plan.isActive) {
      throw new BadRequestException('Selected plan is not available');
    }

    try {
      // Step 1: Create or reuse a Razorpay plan
      const { period, interval } = this.mapBillingCycleToPeriod(plan.billingCycle);
      const razorpayPlan = (await this.razorpay.plans.create({
        period,
        interval,
        item: {
          name: plan.name,
          amount: plan.priceInPaise,
          currency: 'INR',
          description: plan.description ?? `${plan.name} subscription`,
        },
      })) as Plans.RazorPayPlans;

      // Step 2: Create a Razorpay customer
      const customer = (await this.razorpay.customers.create({
        name: tenant.principalName ?? tenant.name,
        email: tenant.email,
        contact: tenant.principalPhone,
        notes: {
          tenantId: tenant.id,
          schoolName: tenant.name,
        },
      })) as Customers.RazorpayCustomer;

      // Step 3: Create a Razorpay subscription
      const subscription = (await this.razorpay.subscriptions.create({
        plan_id: razorpayPlan.id,
        total_count: 12, // 12 billing cycles
        customer_notify: 1,
        notes: {
          tenantId: tenant.id,
          planId: plan.id,
          customerId: customer.id,
        },
      } as Subscriptions.RazorpaySubscriptionCreateRequestBody)) as Subscriptions.RazorpaySubscription;

      // Step 4: Store Razorpay IDs
      await this.db
        .update(tenantSubscriptions)
        .set({
          razorpaySubscriptionId: subscription.id,
          razorpayCustomerId: customer.id,
          updatedAt: new Date(),
        })
        .where(eq(tenantSubscriptions.tenantId, dto.tenantId));

      this.logger.log(
        `Created Razorpay subscription for tenant ${tenant.name}: ${subscription.id}`,
      );

      // Step 5: Return payment link
      return {
        tenantId: tenant.id,
        razorpaySubscriptionId: subscription.id,
        razorpayCustomerId: customer.id,
        planName: plan.name,
        amount: plan.priceInPaise,
        paymentLink: subscription.short_url,
      };
    } catch (error) {
      this.logger.error(`Failed to create Razorpay subscription: ${error}`);
      throw new BadRequestException('Failed to create subscription. Please try again.');
    }
  }

  /**
   * Register a new tenant AND create a Razorpay subscription in one step.
   *
   * Flow:
   * 1. Register the tenant (pending status)
   * 2. Create Razorpay plan + customer + subscription
   * 3. Return subscription_id + Razorpay key so frontend can open Checkout
   *
   * The tenant stays in "pending" status until the webhook fires
   * `subscription.activated` → then it gets provisioned automatically.
   */
  async registerAndSubscribe(dto: RegisterAndSubscribeDto) {
    // Step 1: Register tenant (creates tenant + subscription records in pending state)
    const { tenant, subscription } = await this.tenantsService.register({
      schoolName: dto.schoolName,
      board: dto.board,
      principalName: dto.principalName,
      principalPhone: dto.principalPhone,
      email: dto.email,
      planId: dto.planId,
    });

    const plan = await this.plansService.findOne(dto.planId);

    try {
      // Step 2: Create Razorpay plan
      const { period, interval } = this.mapBillingCycleToPeriod(plan.billingCycle);
      const razorpayPlan = (await this.razorpay.plans.create({
        period,
        interval,
        item: {
          name: plan.name,
          amount: plan.priceInPaise,
          currency: 'INR',
          description: plan.description ?? `${plan.name} subscription`,
        },
      })) as Plans.RazorPayPlans;

      // Step 3: Create Razorpay customer
      const customer = (await this.razorpay.customers.create({
        name: dto.principalName,
        email: dto.email,
        contact: dto.principalPhone,
        notes: {
          tenantId: tenant.id,
          schoolName: dto.schoolName,
        },
      })) as Customers.RazorpayCustomer;

      // Step 4: Create Razorpay subscription
      const razorpaySubscription = (await this.razorpay.subscriptions.create({
        plan_id: razorpayPlan.id,
        total_count: 12,
        customer_notify: 1,
        notes: {
          tenantId: tenant.id,
          planId: plan.id,
          customerId: customer.id,
        },
      } as Subscriptions.RazorpaySubscriptionCreateRequestBody)) as Subscriptions.RazorpaySubscription;

      // Step 5: Store Razorpay IDs on our subscription record
      await this.db
        .update(tenantSubscriptions)
        .set({
          razorpaySubscriptionId: razorpaySubscription.id,
          razorpayCustomerId: customer.id,
          updatedAt: new Date(),
        })
        .where(eq(tenantSubscriptions.tenantId, tenant.id));

      this.logger.log(
        `Registered tenant "${tenant.name}" and created Razorpay subscription: ${razorpaySubscription.id}`,
      );

      // Step 6: Return data for frontend Razorpay Checkout
      const keyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        subscriptionId: razorpaySubscription.id,
        razorpayKeyId: keyId,
        amount: plan.priceInPaise,
        planName: plan.name,
        billingCycle: plan.billingCycle,
        customerEmail: dto.email,
        customerPhone: dto.principalPhone,
        customerName: dto.principalName,
      };
    } catch (error) {
      this.logger.error(`Failed to create Razorpay subscription for tenant ${tenant.id}: ${error}`);
      // Clean up the tenant record since payment setup failed
      try {
        await this.db
          .delete(tenantSubscriptions)
          .where(eq(tenantSubscriptions.tenantId, tenant.id));
        await this.db.delete(tenants).where(eq(tenants.id, tenant.id));
        this.logger.log(`Cleaned up tenant ${tenant.id} after failed subscription creation`);
      } catch (cleanupError) {
        this.logger.error(`Failed to clean up tenant ${tenant.id}: ${cleanupError}`);
      }
      throw new BadRequestException('Failed to set up payment. Please try again.');
    }
  }

  /**
   * Verify Razorpay webhook signature using HMAC SHA256.
   * Returns true if the signature is valid.
   */
  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('Webhook secret not configured — skipping signature verification');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
  async handleWebhook(event: string, payload: Record<string, unknown>) {
    this.logger.log(`Received Razorpay webhook: ${event}`);
    // Log full Razorpay data for debugging
    console.log('Razorpay webhook payload:', JSON.stringify(payload, null, 2));

    switch (event) {
      case 'subscription.authenticated':
        await this.handleSubscriptionAuthenticated(payload);
        break;
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

  /** Subscription authenticated — UPI autopay mandate authorized (first auth before activation) */
  private async handleSubscriptionAuthenticated(payload: Record<string, unknown>) {
    const subscriptionId = this.extractSubscriptionId(payload);
    const tenantSub = await this.findSubscriptionByRazorpayId(subscriptionId);
    if (!tenantSub) return;

    // Mark as authenticated — the activation event will handle provisioning
    this.logger.log(
      `Subscription authenticated for tenant ${tenantSub.tenantId} (awaiting activation)`,
    );
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

  /** Helper: update tenant + subscription status and invalidate cache */
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

    // Invalidate Redis cache so SubscriptionGuard picks up new status immediately
    await this.redisService.del(`${CACHE_PREFIX}${tenantId}`);
    this.logger.log(`Cache invalidated for tenant ${tenantId} after status change to ${status}`);
  }

  /** Helper: extract subscription ID from Razorpay webhook payload */
  private extractSubscriptionId(payload: Record<string, unknown>): string {
    // Razorpay webhook structure: payload.subscription.entity.id
    const subscription = payload['subscription'] as Record<string, unknown> | undefined;
    const entity = subscription?.['entity'] as Record<string, unknown> | undefined;
    return (entity?.['id'] as string) ?? '';
  }

  /** Helper: map our billing cycle to Razorpay plan period + interval */
  private mapBillingCycleToPeriod(billingCycle: string): {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
  } {
    switch (billingCycle) {
      case 'monthly':
        return { period: 'monthly', interval: 1 };
      case 'quarterly':
        return { period: 'monthly', interval: 3 };
      case 'yearly':
        return { period: 'yearly', interval: 1 };
      default:
        return { period: 'monthly', interval: 1 };
    }
  }
}
