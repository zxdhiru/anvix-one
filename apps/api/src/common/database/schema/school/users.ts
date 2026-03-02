import { pgTable, uuid, varchar, timestamp, boolean } from 'drizzle-orm/pg-core';

/**
 * Users table for a tenant schema.
 * Stores school admin, teachers, staff etc.
 * This table is created inside each tenant's schema (tenant_{slug}.users).
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  phone: varchar('phone', { length: 15 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  role: varchar('role', { length: 30 }).notNull().default('admin'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
