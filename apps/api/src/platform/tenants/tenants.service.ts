import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../common/database/database.service';
import { TenantDatabaseService } from '../../common/database/tenant-database.service';
import { RedisService } from '../../common/database/redis.service';
import { MailService } from '../../common/database/mail.service';
import { tenants, tenantSubscriptions } from '../../common/database/schema/platform';
import { plans } from '../../common/database/schema/platform';
import { PlansService } from '../plans/plans.service';
import { slugify } from '@anvix/utils';
import { RegisterTenantDto, UpdateTenantStatusDto, ChangePlanDto } from './dto';
import type { SubscriptionStatusType } from '../../common/database/schema/platform/tenants';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);
  private readonly tokenSecret: string;
  private static readonly OTP_PREFIX = 'tenant_otp:';
  private static readonly OTP_TTL = 300; // 5 minutes

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly tenantDatabaseService: TenantDatabaseService,
    private readonly plansService: PlansService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {
    this.tokenSecret = this.configService.get<string>('JWT_SECRET', 'dev-secret-change-me');
  }

  private get db() {
    return this.databaseService.db;
  }

  /**
   * Register a new tenant (school).
   * Creates tenant record + subscription record + reserves subdomain.
   * Does NOT provision the schema yet — that happens after payment.
   */
  async register(dto: RegisterTenantDto) {
    // Validate plan exists and is active
    const plan = await this.plansService.findOne(dto.planId);
    if (!plan.isActive) {
      throw new BadRequestException('Selected plan is not available');
    }

    // Generate slug and subdomain
    const slug = slugify(dto.schoolName);
    const subdomain = `${slug}.anvixone.in`;

    // Check slug uniqueness
    const existing = await this.db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (existing.length > 0) {
      throw new ConflictException(
        `A school with a similar name already exists. Please choose a different name.`,
      );
    }

    // Create tenant record
    const [tenant] = await this.db
      .insert(tenants)
      .values({
        name: dto.schoolName,
        slug,
        board: dto.board,
        principalName: dto.principalName,
        principalPhone: dto.principalPhone,
        email: dto.email,
        subdomain,
        subscriptionStatus: 'pending',
      })
      .returning();

    // Create subscription record
    const [subscription] = await this.db
      .insert(tenantSubscriptions)
      .values({
        tenantId: tenant.id,
        planId: dto.planId,
        status: 'pending',
      })
      .returning();

    this.logger.log(`Registered tenant: ${tenant.name} (${tenant.id}), subdomain: ${subdomain}`);

    return {
      tenant,
      subscription,
    };
  }

  /**
   * Register AND immediately provision a tenant (dev/demo mode).
   * Combines register + provision into a single call, skipping payment.
   */
  async registerAndProvision(dto: RegisterTenantDto) {
    // Step 1: Register
    const { tenant, subscription } = await this.register(dto);

    // Step 2: Provision immediately (skip payment)
    const provisioned = await this.provisionTenant(tenant.id);

    return {
      tenant: provisioned,
      subscription,
      loginUrl: `http://localhost:3002/en/login?school=${provisioned.slug}`,
      message: `School "${tenant.name}" is ready! Log in with email: ${tenant.email}`,
    };
  }

  /** Get all tenants with optional status filter */
  async findAll(status?: SubscriptionStatusType) {
    if (status) {
      return this.db
        .select()
        .from(tenants)
        .where(eq(tenants.subscriptionStatus, status))
        .orderBy(tenants.createdAt);
    }
    return this.db.select().from(tenants).orderBy(tenants.createdAt);
  }

  /** Get a single tenant by ID */
  async findOne(id: string) {
    const [tenant] = await this.db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }
    return tenant;
  }

  /** Get a tenant by slug */
  async findBySlug(slug: string) {
    const [tenant] = await this.db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
    if (!tenant) {
      throw new NotFoundException(`Tenant with slug "${slug}" not found`);
    }
    return tenant;
  }

  /** Get tenant with subscription details */
  async findOneWithSubscription(id: string) {
    const tenant = await this.findOne(id);
    const subscriptions = await this.db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.tenantId, id))
      .orderBy(tenantSubscriptions.createdAt);

    return { ...tenant, subscriptions };
  }

  /**
   * Provision a tenant — full pipeline:
   * 1. Create PostgreSQL schema
   * 2. Run tenant-specific migrations (create tables)
   * 3. Create school admin user (phone OTP verified later)
   * 4. Send WhatsApp/SMS welcome message
   * 5. Update tenant + subscription status to active
   *
   * Atomic: if any step fails, rolls back the schema.
   * Called after successful payment via webhook.
   */
  async provisionTenant(id: string) {
    const tenant = await this.findOne(id);

    if (tenant.schemaName) {
      this.logger.warn(`Tenant ${id} already provisioned with schema: ${tenant.schemaName}`);
      return tenant;
    }

    this.logger.log(`Starting provisioning pipeline for tenant: ${tenant.name} (${id})`);

    try {
      // Steps 1-3: Create schema + run migrations + create admin (atomic with rollback)
      const { schemaName, adminUser } = await this.tenantDatabaseService.provisionTenantSchema(
        tenant.slug,
        {
          name: tenant.principalName,
          phone: tenant.principalPhone,
          email: tenant.email,
        },
      );

      // Step 4: Send WhatsApp/SMS welcome message
      await this.sendWelcomeMessage(tenant);

      // Step 5: Update tenant record with schema name and active status
      const [updated] = await this.db
        .update(tenants)
        .set({
          schemaName,
          subscriptionStatus: 'active',
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, id))
        .returning();

      // Update subscription status
      await this.db
        .update(tenantSubscriptions)
        .set({
          status: 'active',
          currentPeriodStart: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tenantSubscriptions.tenantId, id));

      this.logger.log(
        `Provisioning complete: ${updated.name} → schema: ${schemaName}, admin: ${adminUser.id}`,
      );
      return updated;
    } catch (error) {
      this.logger.error(`Provisioning failed for tenant ${id}: ${error}`);
      // If schema was partially created, TenantDatabaseService.provisionTenantSchema
      // already handles rollback (drops schema). Just update tenant status.
      await this.db
        .update(tenants)
        .set({
          subscriptionStatus: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, id));

      throw new InternalServerErrorException(
        `Failed to provision tenant. Please retry or contact support.`,
      );
    }
  }

  /**
   * Send welcome message to the school principal via WhatsApp/SMS.
   * Uses MSG91 for SMS and Interakt for WhatsApp.
   *
   * NOTE: Actual integrations require API keys. This logs the message
   * for now and will be connected to MSG91/Interakt in production.
   */
  private async sendWelcomeMessage(tenant: {
    name: string;
    principalName: string;
    principalPhone: string;
    subdomain: string;
  }) {
    const message =
      `Welcome to Anvix One, ${tenant.principalName}! ` +
      `Your school "${tenant.name}" is now live at https://${tenant.subdomain}. ` +
      `Log in with your phone number to get started.`;

    // TODO: Replace with actual MSG91 SMS API call
    // await msg91.sendSms(tenant.principalPhone, message);
    this.logger.log(`[SMS] → ${tenant.principalPhone}: ${message}`);

    // TODO: Replace with actual Interakt WhatsApp API call
    // await interakt.sendWhatsAppTemplate(tenant.principalPhone, 'welcome_school', { ... });
    this.logger.log(`[WhatsApp] → ${tenant.principalPhone}: Welcome template sent`);
  }

  /** Update tenant subscription status (suspend, reactivate, cancel) */
  async updateStatus(id: string, dto: UpdateTenantStatusDto) {
    const tenant = await this.findOne(id);

    const [updated] = await this.db
      .update(tenants)
      .set({
        subscriptionStatus: dto.status,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    // Also update subscription record
    await this.db
      .update(tenantSubscriptions)
      .set({
        status: dto.status,
        ...(dto.status === 'cancelled' ? { cancelledAt: new Date() } : {}),
        notes: dto.reason,
        updatedAt: new Date(),
      })
      .where(eq(tenantSubscriptions.tenantId, id));

    this.logger.log(`Updated tenant ${id} status: ${tenant.subscriptionStatus} → ${dto.status}`);
    return updated;
  }

  /**
   * Delete a tenant and drop their schema.
   * USE WITH EXTREME CAUTION — this destroys all tenant data.
   */
  async remove(id: string) {
    const tenant = await this.findOne(id);

    // Drop the tenant's database schema if it was provisioned
    if (tenant.schemaName) {
      await this.tenantDatabaseService.dropTenantSchema(tenant.slug);
    }

    // Delete subscription records first (FK constraint)
    await this.db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, id));

    // Delete tenant record
    await this.db.delete(tenants).where(eq(tenants.id, id));

    this.logger.warn(`Deleted tenant: ${tenant.name} (${tenant.id})`);
    return { deleted: true, id };
  }

  /* ═══════════════════════════════════════════════════════════════
     Tenant Self-Service Management (OTP-based auth for marketing site)
     ═══════════════════════════════════════════════════════════════ */

  /** Find tenant by admin email. Returns tenant + plan details. */
  async findByEmail(email: string) {
    const [tenant] = await this.db.select().from(tenants).where(eq(tenants.email, email)).limit(1);

    if (!tenant) {
      throw new NotFoundException('No school found with this email address');
    }

    return this.getTenantManageData(tenant.id);
  }

  /** Send OTP to the tenant admin email */
  async sendManageOtp(email: string): Promise<{ message: string }> {
    const [tenant] = await this.db.select().from(tenants).where(eq(tenants.email, email)).limit(1);

    if (!tenant) {
      throw new NotFoundException('No school found with this email address');
    }

    const otp = this.generateSixDigitOtp();
    const key = `${TenantsService.OTP_PREFIX}${email}`;
    await this.redisService.set(key, otp, TenantsService.OTP_TTL);

    try {
      await this.mailService.sendOtpEmail(email, otp);
      this.logger.log(`Tenant manage OTP sent to ${email}`);
    } catch {
      this.logger.warn(`Email delivery failed, OTP for ${email}: ${otp}`);
    }

    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[DEV] Tenant manage OTP for ${email}: ${otp}`);
    }

    return { message: 'OTP sent to your email' };
  }

  /** Verify OTP and return a signed management token + tenant data */
  async verifyManageOtp(email: string, otp: string) {
    const key = `${TenantsService.OTP_PREFIX}${email}`;
    const storedOtp = await this.redisService.get(key);

    if (!storedOtp || storedOtp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // OTP valid — delete it (one-time use)
    await this.redisService.del(key);

    const [tenant] = await this.db.select().from(tenants).where(eq(tenants.email, email)).limit(1);

    if (!tenant) {
      throw new NotFoundException('No school found with this email address');
    }

    // Generate a signed token for subsequent requests
    const token = this.generateManageToken(tenant.id, email);
    const data = await this.getTenantManageData(tenant.id);

    this.logger.log(`Tenant manage OTP verified for ${email} (${tenant.name})`);

    return { token, ...data };
  }

  /** Verify a management token and return the tenant ID */
  verifyManageToken(token: string): { tenantId: string; email: string } | null {
    try {
      const [payloadB64, signature] = token.split('.');
      if (!payloadB64 || !signature) return null;

      const expectedSig = crypto
        .createHmac('sha256', this.tokenSecret)
        .update(payloadB64)
        .digest('hex');

      if (signature !== expectedSig) return null;

      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as {
        tenantId: string;
        email: string;
        exp?: number;
      };

      if (payload.exp && Date.now() > payload.exp) return null;

      return { tenantId: payload.tenantId, email: payload.email };
    } catch {
      return null;
    }
  }

  /** Change the plan for a tenant (upgrade/downgrade) */
  async changePlan(tenantId: string, dto: ChangePlanDto) {
    const tenant = await this.findOne(tenantId);
    const newPlan = await this.plansService.findOne(dto.planId);

    if (!newPlan.isActive) {
      throw new BadRequestException('Selected plan is not available');
    }

    // Get current subscription
    const [currentSub] = await this.db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.tenantId, tenantId))
      .limit(1);

    if (!currentSub) {
      throw new BadRequestException('No active subscription found');
    }

    if (currentSub.planId === dto.planId) {
      throw new BadRequestException('You are already on this plan');
    }

    // Update the subscription to the new plan
    await this.db
      .update(tenantSubscriptions)
      .set({
        planId: dto.planId,
        updatedAt: new Date(),
        notes: `Plan changed from previous plan to ${newPlan.name}`,
      })
      .where(eq(tenantSubscriptions.tenantId, tenantId));

    this.logger.log(`Tenant ${tenant.name} changed plan to ${newPlan.name}`);

    return this.getTenantManageData(tenantId);
  }

  /** Get full tenant management data (tenant + subscription + plan) */
  private async getTenantManageData(tenantId: string) {
    const tenant = await this.findOne(tenantId);

    const [subscription] = await this.db
      .select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.tenantId, tenantId))
      .limit(1);

    let currentPlan = null;
    if (subscription) {
      currentPlan = await this.plansService.findOne(subscription.planId);
    }

    const allPlans = await this.plansService.findAll(true);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        board: tenant.board,
        email: tenant.email,
        principalName: tenant.principalName,
        principalPhone: tenant.principalPhone,
        subscriptionStatus: tenant.subscriptionStatus,
        createdAt: tenant.createdAt,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            planId: subscription.planId,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            razorpaySubscriptionId: subscription.razorpaySubscriptionId,
          }
        : null,
      currentPlan,
      availablePlans: allPlans,
    };
  }

  /** Generate a signed management token (24h expiry) */
  private generateManageToken(tenantId: string, email: string): string {
    const payload = {
      tenantId,
      email,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.tokenSecret)
      .update(payloadB64)
      .digest('hex');
    return `${payloadB64}.${signature}`;
  }

  /** Generate a 6-digit OTP */
  private generateSixDigitOtp(): string {
    const num = crypto.randomInt(0, 1000000);
    return String(num).padStart(6, '0');
  }
}
