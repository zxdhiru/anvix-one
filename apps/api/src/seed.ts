/**
 * Platform seed script.
 * Creates initial plans, a demo tenant, provisions the tenant schema,
 * and creates the school admin user.
 *
 * Usage: npm run db:seed
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseService } from './common/database/database.service';
import { TenantDatabaseService } from './common/database/tenant-database.service';
import { plans, planFeatures } from './common/database/schema/platform';
import { tenants, tenantSubscriptions } from './common/database/schema/platform';
import { eq } from 'drizzle-orm';
import { Logger } from '@nestjs/common';

const logger = new Logger('Seed');

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const databaseService = app.get(DatabaseService);
  const tenantDbService = app.get(TenantDatabaseService);
  const db = databaseService.db;

  try {
    // =========================================
    // 1. Seed Plans
    // =========================================
    logger.log('Seeding plans...');

    const existingPlans = await db.select().from(plans);
    if (existingPlans.length > 0) {
      logger.log(`Plans already exist (${existingPlans.length}), skipping plan seed.`);
    } else {
      const [starterPlan] = await db
        .insert(plans)
        .values({
          name: 'Starter',
          slug: 'starter',
          description: 'Perfect for small schools up to 200 students',
          priceInPaise: 99900, // ₹999/month
          billingCycle: 'monthly',
          maxStudents: 200,
          smsQuota: 500,
          isActive: true,
          sortOrder: 1,
        })
        .returning();

      const [growthPlan] = await db
        .insert(plans)
        .values({
          name: 'Growth',
          slug: 'growth',
          description: 'For growing schools up to 500 students',
          priceInPaise: 249900, // ₹2,499/month
          billingCycle: 'monthly',
          maxStudents: 500,
          smsQuota: 2000,
          isActive: true,
          sortOrder: 2,
        })
        .returning();

      const [proPlan] = await db
        .insert(plans)
        .values({
          name: 'Pro',
          slug: 'pro',
          description: 'Full-featured for large schools up to 2000 students',
          priceInPaise: 499900, // ₹4,999/month
          billingCycle: 'monthly',
          maxStudents: 2000,
          smsQuota: 5000,
          isActive: true,
          sortOrder: 3,
        })
        .returning();

      // Add features for each plan
      const starterFeatures = [
        'student_management',
        'attendance',
        'fee_management',
        'basic_reports',
      ];
      const growthFeatures = [
        ...starterFeatures,
        'exam_management',
        'sms_notifications',
        'parent_portal',
        'advanced_reports',
      ];
      const proFeatures = [
        ...growthFeatures,
        'transport',
        'library',
        'hostel',
        'custom_reports',
        'api_access',
      ];

      for (const feature of starterFeatures) {
        await db.insert(planFeatures).values({
          planId: starterPlan.id,
          featureKey: feature,
          featureValue: 'true',
        });
      }
      for (const feature of growthFeatures) {
        await db.insert(planFeatures).values({
          planId: growthPlan.id,
          featureKey: feature,
          featureValue: 'true',
        });
      }
      for (const feature of proFeatures) {
        await db.insert(planFeatures).values({
          planId: proPlan.id,
          featureKey: feature,
          featureValue: 'true',
        });
      }

      logger.log(
        `Created 3 plans: Starter (${starterPlan.id}), Growth (${growthPlan.id}), Pro (${proPlan.id})`,
      );
    }

    // =========================================
    // 2. Seed Demo Tenant
    // =========================================
    logger.log('Seeding demo tenant...');

    const existingTenants = await db.select().from(tenants).where(eq(tenants.slug, 'demo-school'));
    let demoTenant: (typeof existingTenants)[0];

    if (existingTenants.length > 0) {
      demoTenant = existingTenants[0];
      logger.log(`Demo tenant already exists: ${demoTenant.id}`);
    } else {
      // Get the starter plan
      const [starterPlan] = await db.select().from(plans).where(eq(plans.slug, 'starter')).limit(1);

      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: 'Demo Public School',
          slug: 'demo-school',
          board: 'cbse',
          principalName: 'Dr. Rajesh Kumar',
          principalPhone: '9876543210',
          email: 'admin@demo-school.anvixone.in',
          subdomain: 'demo-school.anvixone.in',
          subscriptionStatus: 'active',
        })
        .returning();

      // Create subscription
      await db.insert(tenantSubscriptions).values({
        tenantId: newTenant.id,
        planId: starterPlan.id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      demoTenant = newTenant;
      logger.log(`Created demo tenant: ${newTenant.name} (${newTenant.id})`);
    }

    // =========================================
    // 3. Provision tenant schema
    // =========================================
    const schemaExists = await tenantDbService.schemaExists('demo-school');

    if (schemaExists) {
      logger.log('Demo tenant schema already provisioned, skipping.');
    } else {
      logger.log('Provisioning demo tenant schema...');

      const { schemaName, adminUser } = await tenantDbService.provisionTenantSchema('demo-school', {
        name: 'Dr. Rajesh Kumar',
        phone: '9876543210',
        email: 'admin@demo-school.anvixone.in',
      });

      // Update tenant with schema name
      await db
        .update(tenants)
        .set({ schemaName, updatedAt: new Date() })
        .where(eq(tenants.id, demoTenant.id));

      logger.log(`Provisioned schema: ${schemaName}, admin user: ${adminUser.id}`);
    }

    // =========================================
    // Summary
    // =========================================
    const allPlans = await db.select().from(plans);
    const allTenants = await db.select().from(tenants);

    logger.log('');
    logger.log('=== Seed Complete ===');
    logger.log(`Plans: ${allPlans.length}`);
    logger.log(`Tenants: ${allTenants.length}`);
    logger.log('');
    logger.log('Demo school login credentials:');
    logger.log(`  Tenant slug: demo-school`);
    logger.log(`  Admin email: admin@demo-school.anvixone.in`);
    logger.log(`  Send OTP to this email, check Mailhog at http://localhost:8025`);
    logger.log('');
  } catch (error) {
    logger.error('Seed failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
