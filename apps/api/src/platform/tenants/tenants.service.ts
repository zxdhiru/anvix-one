import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
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
   * Provision a tenant — create their PostgreSQL schema.
   * Called after successful payment.
   */
  async provisionTenant(id: string) {
    const tenant = await this.findOne(id);

    if (tenant.schemaName) {
      this.logger.warn(`Tenant ${id} already provisioned with schema: ${tenant.schemaName}`);
      return tenant;
    }

    // Create schema
    const schemaName = await this.tenantDatabaseService.createTenantSchema(tenant.slug);

    // Update tenant with schema name and active status
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

    this.logger.log(`Provisioned tenant: ${updated.name} → schema: ${schemaName}`);
    return updated;
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
