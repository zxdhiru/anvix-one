import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  date,
  timestamp,
} from 'drizzle-orm/pg-core';
import { academicYears, terms } from './academic-years';
import { classes } from './classes';
import { students } from './students';
import { users } from './users';

// =========================================
// Fee Heads — types of fees (Tuition, Transport, Lab, etc.)
// =========================================

export const feeHeads = pgTable('fee_heads', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 20 }),
  description: text('description'),
  isRecurring: boolean('is_recurring').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =========================================
// Fee Structures — amount per fee head per class
// =========================================

export const feeStructures = pgTable('fee_structures', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  academicYearId: uuid('academic_year_id')
    .notNull()
    .references(() => academicYears.id),
  classId: uuid('class_id')
    .notNull()
    .references(() => classes.id),
  feeHeadId: uuid('fee_head_id')
    .notNull()
    .references(() => feeHeads.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull().default(0), // in paise
  dueDate: date('due_date'),
  termId: uuid('term_id').references(() => terms.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =========================================
// Fee Discounts — RTE, sibling, scholarship, etc.
// =========================================

export const feeDiscounts = pgTable('fee_discounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  discountType: varchar('discount_type', { length: 20 }).notNull().default('percentage'), // 'percentage' | 'fixed'
  value: integer('value').notNull().default(0), // percentage (0-100) or paise
  applicableTo: varchar('applicable_to', { length: 30 }).notNull().default('all'), // 'all' | 'category' | 'individual'
  category: varchar('category', { length: 30 }), // SC, ST, OBC, RTE, sibling
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// =========================================
// Student Fees — assigned fee per student
// =========================================

export const studentFees = pgTable('student_fees', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  feeStructureId: uuid('fee_structure_id')
    .notNull()
    .references(() => feeStructures.id, { onDelete: 'cascade' }),
  discountId: uuid('discount_id').references(() => feeDiscounts.id),
  originalAmount: integer('original_amount').notNull(),
  discountAmount: integer('discount_amount').notNull().default(0),
  netAmount: integer('net_amount').notNull(),
  paidAmount: integer('paid_amount').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, partial, paid, overdue, waived
  dueDate: date('due_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// =========================================
// Fee Payments — individual payment records
// =========================================

export const feePayments = pgTable('fee_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  studentFeeId: uuid('student_fee_id')
    .notNull()
    .references(() => studentFees.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id')
    .notNull()
    .references(() => students.id),
  amount: integer('amount').notNull(), // in paise
  paymentMode: varchar('payment_mode', { length: 30 }).notNull().default('cash'), // cash, upi, card, netbanking, cheque, dd
  paymentDate: date('payment_date').notNull().defaultNow(),
  transactionId: varchar('transaction_id', { length: 100 }),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 100 }),
  receiptNumber: varchar('receipt_number', { length: 30 }),
  remarks: text('remarks'),
  collectedBy: uuid('collected_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
