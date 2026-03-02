import { pgTable, uuid, varchar, date, boolean, timestamp } from 'drizzle-orm/pg-core';

export const academicYears = pgTable('academic_years', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 20 }).notNull(), // e.g. "2025-2026"
  startDate: date('start_date').notNull(), // April 1
  endDate: date('end_date').notNull(), // March 31
  isCurrent: boolean('is_current').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const terms = pgTable('terms', {
  id: uuid('id').defaultRandom().primaryKey(),
  academicYearId: uuid('academic_year_id')
    .notNull()
    .references(() => academicYears.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 50 }).notNull(), // e.g. "Term 1", "Quarter 1"
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  sortOrder: varchar('sort_order', { length: 5 }).notNull().default('1'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
