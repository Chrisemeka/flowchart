import { parseDate, parseAmount, cleanMerchantName } from '../utils';

// We use {1,800}? to strictly limit lookahead. This prevents the "Server failed to process PDF" 
// crash (catastrophic backtracking) while still capturing the full transaction row.
const ZENITH_PATTERN = /(\d{2}\/\d{2}\/\d{4})\s+([\s\S]{1,800}?)\s+(\d{2}\/\d{2}\/\d{4})\s+([\d,]+[.:]\d{1,2})/g;

export function parseZenithBankPDF(pages: string[]) {
  const fullText = pages.join('  ');
  const transactions: any[] = [];
  
  const openingBalMatch = fullText.match(/OPENING BALANCE:\s*[A-Z]{3}\s*([\d,]+\.\d{2})/i);
  let previousBalance = openingBalMatch ? parseAmount(openingBalMatch[1]) : 0;

  let match;
  let matchCount = 0;

  while ((match = ZENITH_PATTERN.exec(fullText)) !== null) {
    matchCount++;
    const [fullMatch, dateStr, rawMiddleText, valueDate, balanceStr] = match;
    
    // Self-healing for OCR replacing decimals with colons or commas
    const cleanBal = balanceStr.replace(/[,:](\d{2})$/, '.$1');
    const currentBalance = parseAmount(cleanBal);
    const date = parseDate(dateStr);

    const diff = currentBalance - previousBalance;
    const type = diff >= 0 ? 'CREDIT' : 'DEBIT';
    const amount = Math.abs(diff);

    // Skip the opening balance row if it accidentally gets caught
    if (amount === 0 && rawMiddleText.includes('OPENING BALANCE')) continue;

    // Strip out stray numbers from the description
    const description = cleanMerchantName(rawMiddleText.replace(/[\d,]+[.:]\d{2}/g, '').trim());

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

  // Debugging safety net
  if (matchCount === 0) {
    console.log("--- ZENITH PARSER FAILED: RAW TEXT PREVIEW ---");
    console.log(fullText.substring(0, 1500));
  }

  return transactions;
}