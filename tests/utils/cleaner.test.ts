import { describe, expect, it } from 'vitest';
import { cleanMerchantName } from '@/lib/flowchart-engine/utils/cleaner';

describe('cleanMerchantName', () => {
  describe('empty input', () => {
    it('returns "Unknown Merchant" for empty string', () => {
      expect(cleanMerchantName('')).toBe('Unknown Merchant');
    });

    it('returns "Unknown Merchant" for undefined-like input', () => {
      expect(cleanMerchantName(null as unknown as string)).toBe('Unknown Merchant');
    });
  });

  describe('HTML entity decoding', () => {
    it('decodes apostrophe entity', () => {
      expect(cleanMerchantName("MCDONALD&#039;S")).toBe("Mcdonald's");
    });

    it('decodes ampersand entity', () => {
      expect(cleanMerchantName('JOHNSON &amp; JOHNSON')).toBe('Johnson & Johnson');
    });
  });

  describe('garbage prefix stripping', () => {
    it('strips POS PYMT prefix', () => {
      expect(cleanMerchantName('POS PYMT SHOPRITE LEKKI')).toContain('Shoprite');
      expect(cleanMerchantName('POS PYMT SHOPRITE LEKKI')).not.toContain('Pos');
    });

    it('strips WEB PAYMENT prefix', () => {
      const result = cleanMerchantName('WEB PAYMENT NETFLIX');
      expect(result).toContain('Netflix');
      expect(result).not.toContain('Web');
    });

    it('strips NIP TRANSFER prefix', () => {
      const result = cleanMerchantName('NIP TRANSFER JOHN DOE');
      expect(result).toContain('John Doe');
    });

    it('strips VAT prefix', () => {
      const result = cleanMerchantName('VAT REVERSAL');
      expect(result).toBe('Reversal');
    });
  });

  describe('trailing garbage stripping', () => {
    it('strips trailing "LAGOS NG"', () => {
      expect(cleanMerchantName('CHICKEN REPUBLIC LAGOS NG')).not.toContain('Lagos');
    });

    it('strips trailing "NIGERIA"', () => {
      expect(cleanMerchantName('KFC NIGERIA')).not.toContain('Nigeria');
    });

    it('strips trailing long transaction IDs', () => {
      const result = cleanMerchantName('DOMINOS PIZZA 0000142600001');
      expect(result).not.toMatch(/\d{10,}/);
      expect(result).toContain('Dominos');
    });
  });

  describe('URL and email removal', () => {
    it('removes URLs', () => {
      const result = cleanMerchantName('AMAZON https://amazon.com');
      expect(result).not.toContain('http');
      expect(result).toContain('Amazon');
    });

    it('removes email addresses', () => {
      const result = cleanMerchantName('PAYPAL support@paypal.com');
      expect(result).not.toContain('@');
      expect(result).toContain('Paypal');
    });
  });

  describe('formatting', () => {
    it('collapses multiple spaces', () => {
      expect(cleanMerchantName('ZINNY    ONE    STOP')).toBe('Zinny One Stop');
    });

    it('title-cases the output', () => {
      expect(cleanMerchantName('SHOPRITE LEKKI')).toBe('Shoprite Lekki');
    });

    it('trims surrounding whitespace', () => {
      expect(cleanMerchantName('   JUMIA   ')).toBe('Jumia');
    });
  });
});
