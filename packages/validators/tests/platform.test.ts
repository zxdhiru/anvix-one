import { describe, it, expect } from 'vitest';
import { registerTenantSchema, createPlanSchema } from '../src/platform';

describe('registerTenantSchema', () => {
  const validTenant = {
    schoolName: 'Delhi Public School',
    board: 'cbse' as const,
    principalName: 'Dr. Sharma',
    principalPhone: '9876543210',
    email: 'principal@dps.edu.in',
    planId: '550e8400-e29b-41d4-a716-446655440000',
  };

  it('should accept valid tenant registration', () => {
    expect(registerTenantSchema.safeParse(validTenant).success).toBe(true);
  });

  it('should reject missing school name', () => {
    const { schoolName: _, ...data } = validTenant;
    expect(registerTenantSchema.safeParse(data).success).toBe(false);
  });

  it('should reject invalid board', () => {
    expect(registerTenantSchema.safeParse({ ...validTenant, board: 'invalid' }).success).toBe(
      false,
    );
  });

  it('should reject invalid phone', () => {
    expect(registerTenantSchema.safeParse({ ...validTenant, principalPhone: '1234' }).success).toBe(
      false,
    );
  });
});

describe('createPlanSchema', () => {
  it('should accept valid plan', () => {
    const result = createPlanSchema.safeParse({
      name: 'Basic',
      priceInPaise: 50000,
      billingCycle: 'monthly',
      maxStudents: 500,
    });
    expect(result.success).toBe(true);
  });

  it('should default features to empty array', () => {
    const result = createPlanSchema.parse({
      name: 'Basic',
      priceInPaise: 50000,
      billingCycle: 'monthly',
      maxStudents: 500,
    });
    expect(result.features).toEqual([]);
  });
});
