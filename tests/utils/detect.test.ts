import { describe, expect, it } from 'vitest';
import { detectSource } from '@/lib/flowchart-engine/utils/detect';

describe('detectSource', () => {
  describe('by filename', () => {
    it('detects Kuda from filename', () => {
      expect(detectSource('kuda-statement.pdf', '')).toBe('Kuda Bank');
    });

    it('detects Zenith from filename', () => {
      expect(detectSource('zenith_march.pdf', '')).toBe('Zenith Bank');
    });

    it('detects Union from filename', () => {
      expect(detectSource('union-may.pdf', '')).toBe('Union Bank');
    });

    it('detects OPay from filename', () => {
      expect(detectSource('opay-april.pdf', '')).toBe('OPay');
    });

    it('detects PalmPay from filename', () => {
      expect(detectSource('palmpay-jan.pdf', '')).toBe('PalmPay');
    });

    it('detects Access from filename', () => {
      expect(detectSource('access_statement.pdf', '')).toBe('Access Bank');
    });

    it('detects First Bank from filename', () => {
      expect(detectSource('firstbank-q1.pdf', '')).toBe('First Bank');
    });

    it('detects First Bank via first_bank filename', () => {
      expect(detectSource('first_bank-q1.pdf', '')).toBe('First Bank');
    });

    it('is case-insensitive for filenames', () => {
      expect(detectSource('KUDA.PDF', '')).toBe('Kuda Bank');
    });
  });

  describe('by content', () => {
    it('detects Kuda from Kuda Microfinance signature', () => {
      expect(detectSource('statement.pdf', 'Kuda Microfinance Bank Ltd')).toBe('Kuda Bank');
    });

    it('detects Zenith from ZENITH BANK PLC signature', () => {
      expect(detectSource('statement.pdf', 'ZENITH BANK PLC statement')).toBe('Zenith Bank');
    });

    it('detects Union from Union Bank of Nigeria signature', () => {
      expect(detectSource('statement.pdf', 'Union Bank of Nigeria')).toBe('Union Bank');
    });

    it('detects OPay from column signature', () => {
      const content = 'Wallet Account 1234 Trans. Time Balance After';
      expect(detectSource('statement.pdf', content)).toBe('OPay');
    });

    it('detects PalmPay from PalmPay text', () => {
      expect(detectSource('statement.pdf', 'PalmPay Digital Finance')).toBe('PalmPay');
    });

    it('detects Access Bank from Access Bank signature', () => {
      expect(detectSource('statement.pdf', 'Access Bank Statement')).toBe('Access Bank');
    });

    it('detects First Bank from Since 1894 signature', () => {
      expect(detectSource('statement.pdf', 'FirstBank Since 1894')).toBe('First Bank');
    });
  });

  describe('precedence', () => {
    it('detects Kuda before OPay when both signatures present (Kuda-first rule)', () => {
      const filename = 'kuda-opay.pdf';
      expect(detectSource(filename, '')).toBe('Kuda Bank');
    });
  });

  describe('unknown', () => {
    it('returns "Unknown" for unrecognized content', () => {
      expect(detectSource('random.pdf', 'Just some random text')).toBe('Unknown');
    });

    it('returns "Unknown" for empty inputs', () => {
      expect(detectSource('', '')).toBe('Unknown');
    });

    it('handles missing arguments', () => {
      expect(detectSource()).toBe('Unknown');
    });
  });
});
