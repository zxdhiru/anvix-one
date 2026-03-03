import { z } from 'zod';
import { indianPhoneSchema } from './common.js';

// =========================================
// School Profile
// =========================================

export const updateSchoolProfileSchema = z.object({
  name: z.string().min(2).max(200),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/, 'Must be 6-digit PIN code')
    .optional(),
  board: z.enum(['cbse', 'icse', 'state']),
  udiseCode: z.string().max(20).optional(),
  affiliationNumber: z.string().max(50).optional(),
  logoUrl: z.string().url().max(500).optional(),
  phone: indianPhoneSchema.optional(),
  email: z.string().email().optional(),
  website: z.string().url().max(255).optional(),
});

// =========================================
// Academic Year & Terms
// =========================================

export const createAcademicYearSchema = z.object({
  name: z.string().min(4).max(20), // "2025-2026"
  startDate: z.string(), // ISO date
  endDate: z.string(),
  isCurrent: z.boolean().optional(),
});

export const createTermSchema = z.object({
  academicYearId: z.string().uuid(),
  name: z.string().min(1).max(50),
  startDate: z.string(),
  endDate: z.string(),
  sortOrder: z.string().optional(),
});

// =========================================
// Users
// =========================================

/** Schema for creating a school user (teacher, staff, etc.) */
export const createSchoolUserSchema = z.object({
  name: z.string().min(2).max(100),
  phone: indianPhoneSchema,
  email: z.string().email().optional(),
  role: z.enum(['school_admin', 'vice_principal', 'teacher', 'accountant', 'staff']),
});

// =========================================
// Classes & Sections
// =========================================

export const createClassSchema = z.object({
  name: z.string().min(1).max(30),
  numericOrder: z.number().int().min(0).max(20),
  academicYearId: z.string().uuid(),
  classTeacherId: z.string().uuid().optional(),
});

export const createSectionSchema = z.object({
  classId: z.string().uuid(),
  name: z.string().min(1).max(10),
  capacity: z.number().int().positive().optional(),
});

export const createSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(20).optional(),
  subjectType: z.enum(['scholastic', 'co_scholastic']).optional(),
});

export const assignClassSubjectSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid().optional(),
  periodsPerWeek: z.number().int().min(0).optional(),
});

// =========================================
// Students
// =========================================

/** Schema for creating a student */
export const createStudentSchema = z.object({
  name: z.string().min(2).max(200),
  dateOfBirth: z.coerce.date(),
  gender: z.enum(['male', 'female', 'other']),
  bloodGroup: z.string().max(5).optional(),
  category: z.string().max(20).optional(),
  religion: z.string().max(30).optional(),
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, 'Aadhaar must be 12 digits')
    .optional(),
  phone: indianPhoneSchema.optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  rollNumber: z.number().int().optional(),
  admissionDate: z.string().optional(),
  guardians: z
    .array(
      z.object({
        name: z.string().min(2).max(200),
        relation: z.enum(['father', 'mother', 'guardian']),
        phone: indianPhoneSchema,
        email: z.string().email().optional(),
        occupation: z.string().max(100).optional(),
        address: z.string().max(500).optional(),
        isPrimary: z.boolean().optional(),
        whatsappNumber: indianPhoneSchema.optional(),
      }),
    )
    .min(1, 'At least one guardian is required'),
});

/** Schema for CSV bulk import row */
export const csvStudentRowSchema = z.object({
  name: z.string().min(2).max(200),
  dateOfBirth: z.string(), // parsed later
  gender: z.enum(['male', 'female', 'other']),
  className: z.string(), // matched to class by name
  sectionName: z.string(), // matched to section by name
  guardianName: z.string().min(2).max(200),
  guardianRelation: z.enum(['father', 'mother', 'guardian']).optional(),
  guardianPhone: indianPhoneSchema,
  guardianEmail: z.string().email().optional(),
  bloodGroup: z.string().optional(),
  category: z.string().optional(),
  religion: z.string().optional(),
  address: z.string().optional(),
});

// =========================================
// Teachers
// =========================================

export const createTeacherSchema = z.object({
  userId: z.string().uuid(),
  employeeId: z.string().max(30).optional(),
  qualification: z.string().max(200).optional(),
  specialization: z.string().max(200).optional(),
  experienceYears: z.number().int().min(0).optional(),
  dateOfJoining: z.string().optional(),
  designation: z.string().max(100).optional(),
});

export const assignTeacherSubjectSchema = z.object({
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
  classId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
});

// =========================================
// Fee Management
// =========================================

export const createFeeHeadSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().max(20).optional(),
  description: z.string().max(500).optional(),
  isRecurring: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createFeeStructureSchema = z.object({
  name: z.string().min(2).max(100),
  academicYearId: z.string().uuid(),
  classId: z.string().uuid(),
  feeHeadId: z.string().uuid(),
  amount: z.number().int().min(0), // in paise
  dueDate: z.string().optional(),
  termId: z.string().uuid().optional(),
});

export const createFeeDiscountSchema = z.object({
  name: z.string().min(2).max(100),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.number().int().min(0),
  applicableTo: z.enum(['all', 'category', 'individual']).optional(),
  category: z.string().max(30).optional(),
  description: z.string().max(500).optional(),
});

export const assignFeesToClassSchema = z.object({
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  feeStructureIds: z.array(z.string().uuid()).optional(),
});

export const collectFeePaymentSchema = z.object({
  studentFeeId: z.string().uuid(),
  amount: z.number().int().min(1),
  paymentMode: z.enum(['cash', 'upi', 'card', 'netbanking', 'cheque', 'dd']),
  paymentDate: z.string().optional(),
  transactionId: z.string().max(100).optional(),
  remarks: z.string().max(500).optional(),
});

// =========================================
// Auth (OTP)
// =========================================

export const sendOtpSchema = z.object({
  phone: indianPhoneSchema,
});

export const verifyOtpSchema = z.object({
  phone: indianPhoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
});
