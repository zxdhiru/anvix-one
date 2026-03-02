import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';

/**
 * School profile table for a tenant schema.
 * Stores school-level configuration that the admin fills out after onboarding.
 */
export const schoolProfile = pgTable('school_profile', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  pincode: varchar('pincode', { length: 10 }),
  board: varchar('board', { length: 20 }).notNull(),
  udiseCode: varchar('udise_code', { length: 20 }),
  affiliationNumber: varchar('affiliation_number', { length: 50 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  phone: varchar('phone', { length: 15 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
