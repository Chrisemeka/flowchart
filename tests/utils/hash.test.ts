import { describe, expect, it } from 'vitest';
import { generateTransactionHash } from '@/utils/hash';

const baseTx = {
  date: '2025-03-15T00:00:00.000Z',
  amount: 1500.5,
  type: 'DEBIT',
  description: 'SHOPRITE LEKKI',
};

describe('generateTransactionHash', () => {
  it('produces a 64-character hex string (SHA-256)', () => {
    const hash = generateTransactionHash(baseTx);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic - same input produces same hash', () => {
    const h1 = generateTransactionHash(baseTx);
    const h2 = generateTransactionHash(baseTx);
    expect(h1).toBe(h2);
  });

  it('produces different hash when date changes', () => {
    const h1 = generateTransactionHash(baseTx);
    const h2 = generateTransactionHash({ ...baseTx, date: '2025-03-16T00:00:00.000Z' });
    expect(h1).not.toBe(h2);
  });

  it('produces different hash when amount changes', () => {
    const h1 = generateTransactionHash(baseTx);
    const h2 = generateTransactionHash({ ...baseTx, amount: 1500.51 });
    expect(h1).not.toBe(h2);
  });

  it('produces different hash when type changes', () => {
    const h1 = generateTransactionHash(baseTx);
    const h2 = generateTransactionHash({ ...baseTx, type: 'CREDIT' });
    expect(h1).not.toBe(h2);
  });

  it('produces different hash when description changes', () => {
    const h1 = generateTransactionHash(baseTx);
    const h2 = generateTransactionHash({ ...baseTx, description: 'JUMIA' });
    expect(h1).not.toBe(h2);
  });

  it('is stable against floating point noise via toFixed(2)', () => {
    // 0.1 + 0.2 = 0.30000000000000004 in JS, but toFixed(2) normalizes it
    const h1 = generateTransactionHash({ ...baseTx, amount: 0.1 + 0.2 });
    const h2 = generateTransactionHash({ ...baseTx, amount: 0.3 });
    expect(h1).toBe(h2);
  });

  it('trims description whitespace before hashing', () => {
    const h1 = generateTransactionHash({ ...baseTx, description: 'SHOPRITE LEKKI' });
    const h2 = generateTransactionHash({ ...baseTx, description: '  SHOPRITE LEKKI  ' });
    expect(h1).toBe(h2);
  });
});
