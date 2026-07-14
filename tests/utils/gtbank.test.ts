import { describe, expect, it } from 'vitest';
import { detectSource } from '@/lib/flowchart-engine/utils/detect';
import { parseGTBankPDF, type GTItem } from '@/lib/flowchart-engine/parsers/gtbank';

describe('GTBank detection', () => {
  it('detects GTBank from GTCrea8 account-type marker', () => {
    expect(detectSource('statement.pdf', 'Account Type GTCrea8 eSavers')).toBe('GTBank');
  });
  it('detects GTBank from VIA GTWORLD narration', () => {
    expect(detectSource('stmt.pdf', 'Airtime Purchase VIA GTWORLD')).toBe('GTBank');
  });
  it('detects GTBank from filename', () => {
    expect(detectSource('gtbank-june.pdf', '')).toBe('GTBank');
  });
});

// Helper to lay out a token at a column x on a given row y.
const t = (str: string, x: number, y: number): GTItem => ({ str, x, y });
const dateTokens = (d: string, m: string, yr: string, y: number): GTItem[] => [
  t(d, 8, y), t('-', 17, y), t(m, 20, y), t('-', 33, y), t(yr, 36, y),
];

describe('parseGTBankPDF (balance-math)', () => {
  it('derives amount/type from the balance chain, incl. a credit', () => {
    const page: GTItem[] = [
      t('Opening', 25, 446), t('Balance', 64, 446), t('7,462.98', 125, 446),
      // debit 1,900 -> 5,562.98
      ...dateTokens('02', 'Jun', '2025', 386),
      t("'520509479634FOS", 153, 386), t('1,900.00', 272, 386), t('5,562.98', 453, 386),
      t('MELV LIMITED', 623, 386),
      t('520509479634 ref', 623, 377),
      // credit 500,000 -> 505,562.98
      ...dateTokens('16', 'Jun', '2025', 246),
      t('500,000.00', 359, 246), t('505,562.98', 449, 246), t('ONB TRF FROM ALICE', 623, 246),
    ];
    const txns = parseGTBankPDF([page]);
    expect(txns).toHaveLength(2);
    expect(txns[0]).toMatchObject({ amount: 1900, type: 'DEBIT', balance: 5562.98 });
    expect(txns[0].description).toContain('Melv');
    expect(txns[1]).toMatchObject({ amount: 500000, type: 'CREDIT', balance: 505562.98 });
    expect(txns[1].description).toContain('Alice');
  });

  it('handles a negative (overdrawn) balance split across tokens', () => {
    const page: GTItem[] = [
      t('Opening', 25, 446), t('Balance', 64, 446), t('2,762.98', 125, 446),
      ...dateTokens('05', 'Jun', '2025', 321),
      t('2,800.00', 272, 321), t('-', 458, 321), t('37.02', 460, 321), t('GOOGLEPLAY', 623, 321),
    ];
    const [txn] = parseGTBankPDF([page]);
    expect(txn).toMatchObject({ amount: 2800, type: 'DEBIT', balance: -37.02 });
  });
});
