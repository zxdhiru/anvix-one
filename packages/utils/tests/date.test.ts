import { describe, it, expect } from 'vitest';
import { formatDateIN, getCurrentAcademicYear } from '../src/date';

describe('formatDateIN', () => {
  it('should format date in DD/MM/YYYY format', () => {
    const date = new Date('2026-03-15');
    const result = formatDateIN(date);
    expect(result).toContain('03');
    expect(result).toContain('2026');
  });
});

describe('getCurrentAcademicYear', () => {
  it('should return 2025-2026 for March 2026', () => {
    const march2026 = new Date('2026-03-15');
    expect(getCurrentAcademicYear(march2026)).toBe('2025-2026');
  });

  it('should return 2026-2027 for April 2026', () => {
    const april2026 = new Date('2026-04-15');
    expect(getCurrentAcademicYear(april2026)).toBe('2026-2027');
  });

  it('should return 2025-2026 for January 2026', () => {
    const jan2026 = new Date('2026-01-15');
    expect(getCurrentAcademicYear(jan2026)).toBe('2025-2026');
  });

  it('should return 2026-2027 for December 2026', () => {
    const dec2026 = new Date('2026-12-15');
    expect(getCurrentAcademicYear(dec2026)).toBe('2026-2027');
  });
});
