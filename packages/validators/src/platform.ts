import { z } from 'zod';
import { indianPhoneSchema, emailSchema } from './common';

/** Schema for creating a new subscription plan */
export const createPlanSchema = z.object({
  name: z.string().min(2).max(100),
  priceInPaise: z.number().int().min(0),
  billingCycle: z.enum(['monthly', 'quarterly', 'yearly']),
  maxStudents: z.number().int().min(1),
  features: z.array(z.string()).default([]),
});

/** Schema for tenant (school) registration */
export const registerTenantSchema = z.object({
  schoolName: z.string().min(2).max(200),
  board: z.enum(['cbse', 'icse', 'state', 'other']),
  principalName: z.string().min(2).max(100),
  principalPhone: indianPhoneSchema,
  email: emailSchema,
  planId: z.string().uuid(),
});
