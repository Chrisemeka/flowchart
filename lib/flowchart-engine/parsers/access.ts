import { parseDate, parseAmount, cleanMerchantName } from '../utils';

// Regex Explanation:
// 1. Date: 09-JAN-26
// 2. Value Date (Ignored): 09-JAN-26
// 3. Description: Anything in between
// 4. Debit Col: Either a Number OR a '-'
// 5. Credit Col: Either a Number OR a '-'
// 6. Balance Col: Always a Number
const TRANSACTION_PATTERN = /(\d{2}-[A-Za-z]{3}-\d{2})\s+\d{2}-[A-Za-z]{3}-\d{2}\s+(.*?)\s+([0-9,]+\.\d{2}|-)\s+([0-9,]+\.\d{2}|-)\s+([0-9,]+\.\d{2})/g;

export function parseAccessBankPDF(pages: string[]) {
  // Join all pages into one giant text blob
  // We double-space join to ensure separation between end of one page and start of next
  const fullText = pages.join('  ');
  
  const transactions: any[] = [];
  let match;

  // Global Regex Loop: Finds EVERY match in the text blob
  while ((match = TRANSACTION_PATTERN.exec(fullText)) !== null) {
    const [
      fullMatch, 
      dateStr, 
      rawDescription, 
      debitStr, 
      creditStr, 
      balanceStr
    ] = match;

    // 1. Parse Amounts
    // If the column is '-', the amount is 0
    const debitVal = debitStr === '-' ? 0 : parseAmount(debitStr);
    const creditVal = creditStr === '-' ? 0 : parseAmount(creditStr);
    const balance = parseAmount(balanceStr);

    // 2. Determine Type & Final Amount
    let amount = 0;
    let type = 'UNKNOWN';

    if (debitVal > 0) {
      amount = debitVal;
      type = 'DEBIT';
    } else if (creditVal > 0) {
      amount = creditVal;
      type = 'CREDIT';
    } else {
      // Rare edge case: 0 amount transaction
      continue;
    }

    // 3. Clean Description
    // The description might be messy because of the non-greedy match. 
    // It captures everything between the Date and the Debit column.
    const description = cleanMerchantName(rawDescription);

    // Skip Header Rows (if regex accidentally caught them)
    if (description.includes("Opening Balance") || description.includes("Description")) {
      continue;
    }

    transactions.push({
      date: parseDate(dateStr),
      description,
      amount,
      type,
      balance,
      originalText: fullMatch.trim() // Save the exact snippet matched
    });
  }

  return transactions;
}