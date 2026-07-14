import { parseDate, parseAmount, cleanMerchantName } from '../utils';

// GTBank statements render as a positional table, not clean text rows: on
// continuation pages PDF.js reads column-by-column, so the flattened string
// scrambles row order. We instead reconstruct rows from (x, y) positions.
//
// Each transaction has one "primary row" carrying a Trans. Date (x < 60) and a
// Balance (x ~450). Amount/type come from balance-math (like the Zenith/Union
// parsers) because every balance is printed and self-consistent — GTBank's
// Debit/Credit columns are ambiguous once flattened, the balance chain isn't.
export interface GTItem {
  str: string;
  x: number;
  y: number;
}

// Column x-bands (see the sample statement's positional dump).
const TRANSDATE_MAX_X = 60;   // "16 - Jun - 2025"
const REF_MIN_X = 130, REF_MAX_X = 245;
const BAL_MIN_X = 400, BAL_MAX_X = 505;
const REMARK_MIN_X = 600;

const DATE_RE = /^\d{1,2}-[A-Za-z]{3}-\d{4}$/;
const BAL_RE = /-?[\d,]+\.\d{2}/;

// parseAmount() abs's its result; balances can be negative (overdrawn), so we
// need a sign-preserving parse for the balance-math to work.
function parseSignedAmount(s: string): number {
  const num = parseFloat(s.replace(/[^\d.\-]/g, ''));
  return isNaN(num) ? 0 : num;
}

interface Draft {
  date: string;
  amount: number;
  type: string;
  balance: number;
  reference: string;
  remarks: string[];
}

export function parseGTBankPDF(pages: GTItem[][]) {
  const allText = pages.flat().map((i) => i.str).join(' ');
  const openingMatch = allText.match(/Opening\s+Balance\s+([\d,]+\.\d{2})/i);
  let previousBalance = openingMatch ? parseAmount(openingMatch[1]) : 0;

  const drafts: Draft[] = [];

  for (const items of pages) {
    // Group items into visual rows by their (rounded) y-coordinate.
    const rows = new Map<number, GTItem[]>();
    for (const it of items) {
      if (!it.str.trim()) continue;
      const y = Math.round(it.y);
      (rows.get(y) ?? rows.set(y, []).get(y)!).push(it);
    }

    // Top of page to bottom = chronological order.
    const ys = [...rows.keys()].sort((a, b) => b - a);
    let current: Draft | null = null;

    for (const y of ys) {
      const row = rows.get(y)!.sort((a, b) => a.x - b.x);
      const col = (min: number, max: number) =>
        row.filter((t) => t.x >= min && t.x < max);

      const dateStr = col(0, TRANSDATE_MAX_X).map((t) => t.str).join('');
      const balStr = col(BAL_MIN_X, BAL_MAX_X).map((t) => t.str).join('');
      const balMatch = balStr.match(BAL_RE);
      const remarks = row.filter((t) => t.x >= REMARK_MIN_X).map((t) => t.str);

      if (DATE_RE.test(dateStr) && balMatch) {
        // Primary row: a new transaction.
        const currentBalance = parseSignedAmount(balMatch[0]);
        const diff = currentBalance - previousBalance;
        previousBalance = currentBalance;

        current = {
          date: parseDate(dateStr),
          amount: Math.round(Math.abs(diff) * 100) / 100,
          type: diff >= 0 ? 'CREDIT' : 'DEBIT',
          balance: currentBalance,
          reference: col(REF_MIN_X, REF_MAX_X).map((t) => t.str).join('').replace(/^'/, ''),
          remarks,
        };
        drafts.push(current);
      } else if (current && remarks.length) {
        // Continuation row: extra remark lines (counterparty, narration).
        current.remarks.push(...remarks);
      }
    }
  }

  if (drafts.length === 0) {
    console.log('--- GTBANK PARSER FAILED: RAW TEXT PREVIEW ---');
    console.log(allText.substring(0, 1500));
  }

  return drafts
    .filter((d) => d.amount > 0)
    .map((d) => {
      const raw = d.remarks.join(' ').trim();
      return {
        date: d.date,
        description: cleanMerchantName(raw),
        amount: d.amount,
        type: d.type,
        balance: d.balance,
        reference: d.reference,
        originalText: raw,
      };
    });
}
