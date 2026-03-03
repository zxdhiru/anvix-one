import {
  pgTable,
  uuid,
  varchar,
  date,
  text,
  boolean,
  timestamp,
  integer,
} from 'drizzle-orm/pg-core';
import { classes } from './classes';
import { sections } from './classes';

/**
 * Students — core student records within a tenant
 */
export const students = pgTable('students', {
  id: uuid('id').defaultRandom().primaryKey(),
  admissionNumber: varchar('admission_number', { length: 30 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  gender: varchar('gender', { length: 10 }).notNull(), // male, female, other
  bloodGroup: varchar('blood_group', { length: 5 }), // A+, B-, O+, etc.
  category: varchar('category', { length: 20 }), // General, OBC, SC, ST
  religion: varchar('religion', { length: 30 }),
  nationality: varchar('nationality', { length: 30 }).default('Indian'),
  aadhaarNumber: varchar('aadhaar_number', { length: 12 }),
  phone: varchar('phone', { length: 15 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  pincode: varchar('pincode', { length: 10 }),
  classId: uuid('class_id')
    .notNull()
    .references(() => classes.id),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => sections.id),
  rollNumber: integer('roll_number'),
  admissionDate: date('admission_date'),
  isActive: boolean('is_active').notNull().default(true),
  photoUrl: varchar('photo_url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Student Guardians — parents/guardians linked to students
 */
export const studentGuardians = pgTable('student_guardians', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  relation: varchar('relation', { length: 30 }).notNull(), // father, mother, guardian
  phone: varchar('phone', { length: 15 }).notNull(),
  email: varchar('email', { length: 255 }),
  occupation: varchar('occupation', { length: 100 }),
  address: text('address'),
  whatsappNumber: varchar('whatsapp_number', { length: 15 }),
  isPrimary: boolean('is_primary').notNull().default(false), // primary contact
  userId: uuid('user_id'), // linked to users table when parent has portal access
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Student Class History — tracking promotions/transfers
 */
export const studentClassHistory = pgTable('student_class_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  classId: uuid('class_id')
    .notNull()
    .references(() => classes.id),
  sectionId: uuid('section_id')
    .notNull()
    .references(() => sections.id),
  academicYearId: uuid('academic_year_id').notNull(),
  rollNumber: integer('roll_number'),
  action: varchar('action', { length: 20 }).notNull(), // admitted, promoted, transferred, detained
  remarks: text('remarks'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
