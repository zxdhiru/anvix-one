import { pgTable, uuid, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { academicYears } from './academic-years';

/**
 * Classes — e.g. Nursery, LKG, UKG, 1–12
 */
export const classes = pgTable('classes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 30 }).notNull(), // "Nursery", "LKG", "1", "12"
  numericOrder: integer('numeric_order').notNull(), // 0=Nursery, 1=LKG, 2=UKG, 3=Class 1, ...14=Class 12
  academicYearId: uuid('academic_year_id')
    .notNull()
    .references(() => academicYears.id, { onDelete: 'cascade' }),
  classTeacherId: uuid('class_teacher_id'), // references users.id — assigned later
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Sections — A, B, C, D per class
 */
export const sections = pgTable('sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  classId: uuid('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 10 }).notNull(), // "A", "B", "C"
  capacity: integer('capacity'), // max students
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Subjects — Math, Science, English, etc.
 */
export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 20 }), // e.g. "MATH", "SCI"
  subjectType: varchar('subject_type', { length: 20 }).notNull().default('scholastic'), // scholastic, co_scholastic
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Class-Subject mapping — which subjects are taught in which class
 */
export const classSubjects = pgTable('class_subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  classId: uuid('class_id')
    .notNull()
    .references(() => classes.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  teacherId: uuid('teacher_id'), // references users.id — subject teacher for this class
  periodsPerWeek: integer('periods_per_week').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
