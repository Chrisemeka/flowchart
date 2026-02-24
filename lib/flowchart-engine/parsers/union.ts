import { parseDate, parseAmount, cleanMerchantName } from '../utils';

// Union Bank PDF Row Pattern
// Matches: Date (DD-MMM-YYYY) ... [Variable Text] ... Balance (Last number on the line)
const UNION_PATTERN = /(\d{2}-[A-Za-z]{3}-\d{4})\s+([\s\S]+?)\s+([\d,]+\.\d{2})/g;

export function parseUnionBankPDF(pages: string[]) {
  const fullText = pages.join('  ');
  const transactions: any[] = [];
  
  // Try to find the Opening Balance to anchor our math
  // Union Bank usually says "Opening Balance" followed by the amount
  const openingBalMatch = fullText.match(/Opening\s+Balance[^\d]*([\d,]+\.\d{2})/i);
  let previousBalance = openingBalMatch ? parseAmount(openingBalMatch[1]) : 0;

  let match;
  while ((match = UNION_PATTERN.exec(fullText)) !== null) {
    const [fullMatch, dateStr, rawMiddleText, balanceStr] = match;
    const currentBalance = parseAmount(balanceStr);
    const date = parseDate(dateStr);

    // Balance Math to figure out if money came in or went out
    const diff = currentBalance - previousBalance;
    const type = diff >= 0 ? 'CREDIT' : 'DEBIT';
    const amount = Math.abs(diff);

    // Skip header rows that might accidentally match
    if (amount === 0 && rawMiddleText.toLowerCase().includes('balance')) continue;

    // Clean up the description by stripping stray dates/numbers from the middle text
    const cleanDesc = rawMiddleText
      .replace(/\d{2}-[A-Za-z]{3}-\d{4}/g, '') // Remove secondary value dates
      .replace(/[\d,]+\.\d{2}/g, '') // Remove the transaction amount (since we calculated it via math)
      .trim();

    const description = cleanMerchantName(cleanDesc);

    transactions.push({
      date, 
      description, 
      amount, 
      type, 
      balance: currentBalance, 
      originalText: fullMatch.trim()
    });

    previousBalance = currentBalance;
  }
  
  // Debugging fallback just like OPay
  if (transactions.length === 0) {
    console.log("--- UNION PARSER FAILED: RAW TEXT PREVIEW ---");
    console.log(fullText.substring(0, 1500));
  }

  return transactions;
}