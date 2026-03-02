import { describe, it, expect } from 'vitest';
import { indianPhoneSchema, emailSchema, paginationSchema } from '../src/common';

describe('indianPhoneSchema', () => {
  it('should accept valid Indian phone numbers', () => {
    expect(indianPhoneSchema.safeParse('9876543210').success).toBe(true);
    expect(indianPhoneSchema.safeParse('6123456789').success).toBe(true);
    expect(indianPhoneSchema.safeParse('7000000000').success).toBe(true);
    expect(indianPhoneSchema.safeParse('8999999999').success).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(indianPhoneSchema.safeParse('1234567890').success).toBe(false); // starts with 1
    expect(indianPhoneSchema.safeParse('5123456789').success).toBe(false); // starts with 5
    expect(indianPhoneSchema.safeParse('987654321').success).toBe(false); // 9 digits
    expect(indianPhoneSchema.safeParse('98765432100').success).toBe(false); // 11 digits
    expect(indianPhoneSchema.safeParse('').success).toBe(false);
    expect(indianPhoneSchema.safeParse('abcdefghij').success).toBe(false);
  });
});

describe('emailSchema', () => {
  it('should accept valid emails', () => {
    expect(emailSchema.safeParse('admin@school.in').success).toBe(true);
    expect(emailSchema.safeParse('teacher@dps.edu.in').success).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
    expect(emailSchema.safeParse('').success).toBe(false);
  });
});

describe('paginationSchema', () => {
  it('should provide defaults', () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
  });

  it('should accept valid values', () => {
    const result = paginationSchema.parse({ page: '3', perPage: '50' });
    expect(result.page).toBe(3);
    expect(result.perPage).toBe(50);
  });

  it('should reject perPage > 100', () => {
    expect(paginationSchema.safeParse({ perPage: 200 }).success).toBe(false);
  });
});
