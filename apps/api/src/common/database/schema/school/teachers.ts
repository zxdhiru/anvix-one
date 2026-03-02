import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Teachers — extended teacher profile linked to users table
 */
export const teachers = pgTable('teachers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  employeeId: varchar('employee_id', { length: 30 }),
  qualification: varchar('qualification', { length: 200 }),
  specialization: varchar('specialization', { length: 200 }),
  experienceYears: integer('experience_years').default(0),
  dateOfJoining: varchar('date_of_joining', { length: 10 }), // YYYY-MM-DD
  designation: varchar('designation', { length: 100 }), // PGT, TGT, PRT, etc.
  isClassTeacher: boolean('is_class_teacher').notNull().default(false),
  bio: text('bio'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Teacher-Subject mapping — which subjects a teacher is assigned to for which class
 */
export const teacherSubjects = pgTable('teacher_subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  teacherId: uuid('teacher_id')
    .notNull()
    .references(() => teachers.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').notNull(), // references subjects.id
  classId: uuid('class_id').notNull(), // references classes.id
  sectionId: uuid('section_id'), // optional — null means all sections
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
