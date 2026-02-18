import { parseDate, parseAmount, cleanMerchantName } from '../utils';

// Regex Explanation for OPay:
// 1. Date/Time: (\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{1,2}:\d{2}:\d{2})
// 2. Value Date (Ignored): \d{1,2}\s+[A-Za-z]{3}\s+\d{4}
// 3. Description: ([\s\S]*?) -> Matches all text across lines until the columns
// 4. Debit Column: ([\d,]+[.:,]\d{2}|[-—]+) -> Matches the amount OR dashes
// 5. Credit Column: ([\d,]+[.:,]\d{2}|[-—]+) -> Matches the amount OR dashes
// 6. Balance: ([\d,]+[.:,]\d{2})
// 7. Channel: (Mobile|WEB|App|System)
const OPAY_PATTERN = /(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{1,2}:\d{2}:\d{2})\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+([\s\S]*?)\s+([\d,]+[.:,]\d{2}|[-—]+)\s+([\d,]+[.:,]\d{2}|[-—]+)\s+([\d,]+[.:,]\d{2})\s+(Mobile|WEB|App|System)/gi;

export function parseOPayPDF(pages: string[]) {
  const fullText = pages.join('  ');
  const transactions: any[] = [];
  
  let match;

  while ((match = OPAY_PATTERN.exec(fullText)) !== null) {
    const [
      fullMatch,
      dateStr,
      rawDescription,
      debitStr, // Column 1
      creditStr, // Column 2
      balanceStr // Column 3
    ] = match;

    // --- DETERMINE TYPE BASED ON COLUMNS ---
    // If the string contains digits, it's the active column
    const hasCredit = /[\d]/.test(creditStr);
    const hasDebit = /[\d]/.test(debitStr);

    let type = 'DEBIT';
    let rawAmount = debitStr;

    if (hasCredit && !hasDebit) {
      type = 'CREDIT';
      rawAmount = creditStr;
    } else if (hasDebit && !hasCredit) {
      type = 'DEBIT';
      rawAmount = debitStr;
    } else {
      // Safety Fallback just in case OCR scrambles a line
      const descLower = rawDescription.toLowerCase();
      if (descLower.includes('transfer from') || descLower.includes('refund')) {
        type = 'CREDIT';
        rawAmount = hasCredit ? creditStr : debitStr;
      }
    }

    // --- HEAL OCR ARTIFACTS ---
    // Fixes instances where OCR reads "1000,00" or "1000:00"
    const cleanAmt = rawAmount.replace(/[,:](\d{2})$/, '.$1');
    const cleanBal = balanceStr.replace(/[,:](\d{2})$/, '.$1');

    const amount = parseAmount(cleanAmt);
    const currentBalance = parseAmount(cleanBal);
    const date = parseDate(dateStr);

    transactions.push({
      date,
      description: cleanMerchantName(rawDescription),
      amount,
      type,
      balance: currentBalance,
      originalText: fullMatch.trim(),
    });
  }

  return transactions;
}