import { z } from 'zod';
import { indianPhoneSchema, emailSchema } from './common.js';

/** Schema for creating a new subscription plan */
export const createPlanSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  priceInPaise: z.number().int().min(0),
  billingCycle: z.enum(['monthly', 'quarterly', 'yearly']),
  maxStudents: z.number().int().min(1),
  smsQuota: z.number().int().min(0).default(0),
  features: z.array(z.string()).default([]),
});

/** Schema for updating a subscription plan */
export const updatePlanSchema = createPlanSchema.partial().extend({
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
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

/** Schema for updating tenant status */
export const updateTenantStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'cancelled']),
  reason: z.string().max(500).optional(),
});

/** Schema for creating a billing subscription */
export const createSubscriptionSchema = z.object({
  tenantId: z.string().uuid(),
  planId: z.string().uuid(),
});
