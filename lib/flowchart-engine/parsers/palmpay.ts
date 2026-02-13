import { parseDate, parseAmount, cleanMerchantName } from '../utils';

// Regex for PalmPay Transactions
// Pattern: Date (MM/DD/YYYY) ... Description ... Amount (+/-) ... TxID
const PALMPAY_PATTERN = /(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}\s+[AP]M)\s+(.*?)\s+([+\-][0-9,]+\.\d{2})\s+([a-zA-Z0-9_]+)/g;

export function parsePalmPayPDF(pages: string[]) {
  // Join all pages into one text blob
  const fullText = pages.join('  ');
  
  const transactions: any[] = [];
  let match;

  // Global Regex Loop
  while ((match = PALMPAY_PATTERN.exec(fullText)) !== null) {
    const [
      fullMatch, 
      dateStr, 
      rawDescription, 
      amountStr,
      txId
    ] = match;

    // 1. Parse Amount & Type
    // PalmPay explicitly gives '+' for credit and '-' for debit
    const isCredit = amountStr.startsWith('+');
    const amount = parseAmount(amountStr);
    
    // 2. Clean Description
    const description = cleanMerchantName(rawDescription);

    // 3. Clean Date
    const date = parseDate(dateStr);

    transactions.push({
      date,
      description,
      amount,
      type: isCredit ? 'CREDIT' : 'DEBIT',
      balance: 0, // PalmPay PDF doesn't show running balance on rows
      originalText: fullMatch.trim(),
      meta: {
        transactionId: txId
      }
    });
  }

  return transactions;
}