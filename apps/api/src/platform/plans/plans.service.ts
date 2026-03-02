import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../../common/database/database.service';
import { plans, planFeatures } from '../../common/database/schema/platform';
import { slugify } from '@anvix/utils';
import { CreatePlanDto, UpdatePlanDto } from './dto';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  private get db() {
    return this.databaseService.db;
  }

  /** Create a new subscription plan */
  async create(dto: CreatePlanDto) {
    const slug = slugify(dto.name);

    // Check for duplicate slug
    const existing = await this.db.select().from(plans).where(eq(plans.slug, slug)).limit(1);
    if (existing.length > 0) {
      throw new ConflictException(`Plan with name "${dto.name}" already exists`);
    }

    const [plan] = await this.db
      .insert(plans)
      .values({
        name: dto.name,
        slug,
        description: dto.description,
        priceInPaise: dto.priceInPaise,
        billingCycle: dto.billingCycle,
        maxStudents: dto.maxStudents,
        smsQuota: dto.smsQuota ?? 0,
      })
      .returning();

    // Insert features if provided
    if (dto.features?.length) {
      await this.db.insert(planFeatures).values(
        dto.features.map((feature) => ({
          planId: plan.id,
          featureKey: feature,
          featureValue: 'true',
        })),
      );
    }

    this.logger.log(`Created plan: ${plan.name} (${plan.id})`);
    return plan;
  }

  /** Get all plans, optionally filtering by active status */
  async findAll(activeOnly = false) {
    if (activeOnly) {
      return this.db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder);
    }
    return this.db.select().from(plans).orderBy(plans.sortOrder);
  }

  /** Get a single plan by ID */
  async findOne(id: string) {
    const [plan] = await this.db.select().from(plans).where(eq(plans.id, id)).limit(1);
    if (!plan) {
      throw new NotFoundException(`Plan with ID "${id}" not found`);
    }
    return plan;
  }

  /** Get a plan with its features */
  async findOneWithFeatures(id: string) {
    const plan = await this.findOne(id);
    const features = await this.db.select().from(planFeatures).where(eq(planFeatures.planId, id));

    return { ...plan, features };
  }

  /** Update a plan */
  async update(id: string, dto: UpdatePlanDto) {
    await this.findOne(id); // Ensure exists

    const [updated] = await this.db
      .update(plans)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, id))
      .returning();

    this.logger.log(`Updated plan: ${updated.name} (${updated.id})`);
    return updated;
  }

  /** Soft-delete a plan by deactivating it */
  async remove(id: string) {
    await this.findOne(id); // Ensure exists

    const [deactivated] = await this.db
      .update(plans)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(plans.id, id))
      .returning();

    this.logger.log(`Deactivated plan: ${deactivated.name} (${deactivated.id})`);
    return deactivated;
  }
}
