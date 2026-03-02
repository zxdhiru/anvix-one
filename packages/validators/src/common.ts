import { z } from 'zod';

/** Indian phone number: 10 digits starting with 6-9 */
export const indianPhoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number');

/** Email validation */
export const emailSchema = z.string().email('Must be a valid email address');

/** Pagination params */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});
