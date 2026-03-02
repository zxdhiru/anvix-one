import { describe, it, expect } from 'vitest';
import { slugify, isValidSlug } from '../src/slug';

describe('slugify', () => {
  it('should convert school name to slug', () => {
    expect(slugify('DPS Bangalore North')).toBe('dps-bangalore-north');
  });

  it('should handle special characters', () => {
    expect(slugify("St. Mary's School")).toBe('st-marys-school');
  });

  it('should handle multiple spaces', () => {
    expect(slugify('Delhi   Public   School')).toBe('delhi-public-school');
  });

  it('should trim whitespace', () => {
    expect(slugify('  School Name  ')).toBe('school-name');
  });

  it('should handle already lowercase', () => {
    expect(slugify('simple-name')).toBe('simple-name');
  });
});

describe('isValidSlug', () => {
  it('should accept valid slugs', () => {
    expect(isValidSlug('dps-bangalore')).toBe(true);
    expect(isValidSlug('school123')).toBe(true);
    expect(isValidSlug('my-school-2026')).toBe(true);
  });

  it('should reject invalid slugs', () => {
    expect(isValidSlug('DPS-Bangalore')).toBe(false);
    expect(isValidSlug('school name')).toBe(false);
    expect(isValidSlug('-leading-dash')).toBe(false);
    expect(isValidSlug('trailing-dash-')).toBe(false);
    expect(isValidSlug('')).toBe(false);
  });
});
