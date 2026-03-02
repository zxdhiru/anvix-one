import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { plans } from './plans';

/** Subscription status enum values */
export type SubscriptionStatusType =
  | 'active'
  | 'past_due'
  | 'suspended'
  | 'cancelled'
  | 'trial'
  | 'pending';

/** Tenants representing registered schools */
export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  board: varchar('board', { length: 20 }).notNull(),
  principalName: varchar('principal_name', { length: 100 }).notNull(),
  principalPhone: varchar('principal_phone', { length: 15 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subdomain: varchar('subdomain', { length: 100 }).notNull().unique(),
  schemaName: varchar('schema_name', { length: 100 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Tracks subscription lifecycle per tenant */
export const tenantSubscriptions = pgTable('tenant_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  razorpaySubscriptionId: varchar('razorpay_subscription_id', { length: 100 }),
  razorpayCustomerId: varchar('razorpay_customer_id', { length: 100 }),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
