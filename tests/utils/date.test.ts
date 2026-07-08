import { describe, expect, it } from 'vitest';
import { parseDate } from '@/lib/flowchart-engine/utils/date';

// Helper to extract UTC year-month-day from ISO string.
const ymd = (iso: string) => {
  const d = new Date(iso);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
};

describe('parseDate', () => {
  describe('Kuda format (DD/MM/YY HH:MM:SS)', () => {
    it('parses two-digit year with time suffix', () => {
      const iso = parseDate('15/03/25 10:30:45');
      const d = new Date(iso);
      expect(d.getFullYear()).toBe(2025);
      expect(d.getMonth()).toBe(2); // March = 2 in local ctor
      expect(d.getDate()).toBe(15);
    });

    it('parses four-digit year with time suffix', () => {
      const iso = parseDate('15/03/2025 10:30:45');
      const d = new Date(iso);
      expect(d.getFullYear()).toBe(2025);
      expect(d.getMonth()).toBe(2);
      expect(d.getDate()).toBe(15);
    });
  });

  describe('OPay format (DD MMM YYYY)', () => {
    it('parses standard OPay date', () => {
      const iso = parseDate('05 Jan 2025');
      const d = new Date(iso);
      expect(d.getFullYear()).toBe(2025);
      expect(d.getMonth()).toBe(0);
      expect(d.getDate()).toBe(5);
    });

    it('is case-insensitive for month', () => {
      const iso = parseDate('20 DEC 2024');
      const d = new Date(iso);
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(11);
      expect(d.getDate()).toBe(20);
    });
  });

  describe('Digital/Union format (DD-MMM-YY)', () => {
    it('parses two-digit year', () => {
      const iso = parseDate('10-Feb-25');
      const d = new Date(iso);
      expect(d.getFullYear()).toBe(2025);
      expect(d.getMonth()).toBe(1);
      expect(d.getDate()).toBe(10);
    });

    it('parses four-digit year', () => {
      const iso = parseDate('01-Jul-2025');
      const d = new Date(iso);
      expect(d.getFullYear()).toBe(2025);
      expect(d.getMonth()).toBe(6);
      expect(d.getDate()).toBe(1);
    });
  });

  describe('Slashed formats (DD/MM/YYYY vs MM/DD/YYYY)', () => {
    it('reads unambiguous DD/MM/YYYY when first part > 12', () => {
      const iso = parseDate('31/12/2025');
      const d = new Date(iso);
      expect(d.getFullYear()).toBe(2025);
      expect(d.getMonth()).toBe(11);
      expect(d.getDate()).toBe(31);
    });

    it('reads unambiguous MM/DD/YYYY when second part > 12', () => {
      const iso = parseDate('12/31/2025');
      const d = new Date(iso);
      expect(d.getFullYear()).toBe(2025);
      expect(d.getMonth()).toBe(11);
      expect(d.getDate()).toBe(31);
    });

    it('defaults ambiguous dates to DD/MM/YYYY (Nigerian standard)', () => {
      const iso = parseDate('05/06/2026');
      const d = new Date(iso);
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(5); // June, not May
      expect(d.getDate()).toBe(5);
    });

    it('accepts dashes as separators', () => {
      const iso = parseDate('31-12-2025');
      const d = new Date(iso);
      expect(d.getFullYear()).toBe(2025);
      expect(d.getMonth()).toBe(11);
      expect(d.getDate()).toBe(31);
    });
  });

  describe('fallbacks', () => {
    it('returns a valid ISO string for empty input', () => {
      const iso = parseDate('');
      expect(() => new Date(iso).toISOString()).not.toThrow();
    });

    it('returns a valid ISO string for garbage input', () => {
      const iso = parseDate('not-a-date');
      expect(() => new Date(iso).toISOString()).not.toThrow();
    });

    it('parses a standard ISO string via fallback', () => {
      const iso = parseDate('2025-06-15T10:00:00Z');
      expect(ymd(iso)).toEqual({ year: 2025, month: 6, day: 15 });
    });
  });
});
