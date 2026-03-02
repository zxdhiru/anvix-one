import { z } from 'zod';
import { indianPhoneSchema } from './common';

/** Schema for creating a school user (teacher, staff, etc.) */
export const createSchoolUserSchema = z.object({
  name: z.string().min(2).max(100),
  phone: indianPhoneSchema,
  email: z.string().email().optional(),
  role: z.enum(['school_admin', 'vice_principal', 'teacher', 'accountant', 'staff']),
});

/** Schema for creating a student */
export const createStudentSchema = z.object({
  name: z.string().min(2).max(100),
  dateOfBirth: z.coerce.date(),
  gender: z.enum(['male', 'female', 'other']),
  classId: z.string().uuid(),
  sectionId: z.string().uuid(),
  guardianName: z.string().min(2).max(100),
  guardianPhone: indianPhoneSchema,
});
