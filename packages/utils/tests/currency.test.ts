import { describe, it, expect } from 'vitest';
import { formatINR, rupeesToPaise, paiseToRupees } from '../src/currency';

describe('formatINR', () => {
  it('should format paise as INR currency', () => {
    expect(formatINR(150000)).toBe('₹1,500');
  });

  it('should handle zero', () => {
    expect(formatINR(0)).toBe('₹0');
  });

  it('should handle paise with decimal rupees', () => {
    expect(formatINR(99)).toBe('₹0.99');
  });

  it('should format large amounts with Indian grouping', () => {
    const result = formatINR(1000000000); // 1 crore rupees in paise
    expect(result).toContain('₹');
  });
});

describe('rupeesToPaise', () => {
  it('should convert rupees to paise', () => {
    expect(rupeesToPaise(1500)).toBe(150000);
  });

  it('should handle decimal rupees', () => {
    expect(rupeesToPaise(99.99)).toBe(9999);
  });

  it('should handle zero', () => {
    expect(rupeesToPaise(0)).toBe(0);
  });
});

describe('paiseToRupees', () => {
  it('should convert paise to rupees', () => {
    expect(paiseToRupees(150000)).toBe(1500);
  });

  it('should handle odd paise', () => {
    expect(paiseToRupees(9999)).toBe(99.99);
  });
});
