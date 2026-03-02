import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../common/database/database.service';
import { TenantDatabaseService } from '../../common/database/tenant-database.service';
import { tenants, tenantSubscriptions } from '../../common/database/schema/platform';
import { PlansService } from '../plans/plans.service';
import { slugify } from '@anvix/utils';
import { RegisterTenantDto, UpdateTenantStatusDto } from './dto';
import type { SubscriptionStatusType } from '../../common/database/schema/platform/tenants';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly tenantDatabaseService: TenantDatabaseService,
    private readonly plansService: PlansService,
  ) {}

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
}
