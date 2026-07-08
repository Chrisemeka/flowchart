import { describe, expect, it } from 'vitest';
import { parseAmount } from '@/lib/flowchart-engine/utils/currency';

describe('parseAmount', () => {
  describe('numeric input', () => {
    it('returns absolute value for positive numbers', () => {
      expect(parseAmount(1000)).toBe(1000);
    });

    it('returns absolute value for negative numbers', () => {
      expect(parseAmount(-1500.5)).toBe(1500.5);
    });

    it('returns 0 for numeric 0', () => {
      expect(parseAmount(0)).toBe(0);
    });
  });

  describe('empty and invalid input', () => {
    it('returns 0 for empty string', () => {
      expect(parseAmount('')).toBe(0);
    });

    it('returns 0 for non-numeric string', () => {
      expect(parseAmount('abc')).toBe(0);
    });

    it('returns 0 for just currency symbols', () => {
      expect(parseAmount('₦')).toBe(0);
    });
  });

  describe('currency symbol stripping', () => {
    it('strips naira symbol', () => {
      expect(parseAmount('₦1000')).toBe(1000);
    });

    it('strips NGN prefix', () => {
      expect(parseAmount('NGN 1000')).toBe(1000);
    });

    it('strips dollar sign', () => {
      expect(parseAmount('$1000')).toBe(1000);
    });

    it('strips whitespace', () => {
      expect(parseAmount('  1000.00  ')).toBe(1000);
    });
  });

  describe('Nigerian formatting (comma thousands, dot decimal)', () => {
    it('parses 1,000.00 as 1000', () => {
      expect(parseAmount('1,000.00')).toBe(1000);
    });

    it('parses 1,234,567.89', () => {
      expect(parseAmount('1,234,567.89')).toBe(1234567.89);
    });

    it('parses ₦1,500.50', () => {
      expect(parseAmount('₦1,500.50')).toBe(1500.5);
    });
  });

  describe('comma-only formatting', () => {
    it('treats comma as thousands separator when trailing group is 3 digits', () => {
      expect(parseAmount('1,000')).toBe(1000);
    });

    it('treats comma as decimal when trailing group is 2 digits', () => {
      expect(parseAmount('50,00')).toBe(50);
    });

    it('parses 1,234,567 as 1234567', () => {
      expect(parseAmount('1,234,567')).toBe(1234567);
    });
  });

  describe('negative and edge cases', () => {
    it('returns absolute value of negative string', () => {
      expect(parseAmount('-500.00')).toBe(500);
    });

    it('handles Infinity gracefully', () => {
      expect(parseAmount('Infinity')).toBe(0);
    });
  });
});
