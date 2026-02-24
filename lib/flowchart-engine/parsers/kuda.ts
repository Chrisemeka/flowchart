import { parseDate, parseAmount, cleanMerchantName } from '../utils';

export function parseKudaBankPDF(pages: string[]) {
  // Flatten all text into a single line to destroy OCR gaps
  const flatText = pages.join(' ').replace(/\s+/g, ' ');
  const transactions: any[] = [];
  
  const openingBalMatch = flatText.match(/Opening Balance [N#₦]?([\d,]+[.:]\d{2})/i);
  let previousBalance = openingBalMatch ? parseAmount(openingBalMatch[1].replace(':', '.')) : 0;

  // Kuda transactions start with a specific timestamp. 
  // Splitting by this ignores header dates and isolates every transaction perfectly.
  const chunks = flatText.split(/(\d{2}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})/);
  
  // chunks[0] is the intro text
  // chunks[1] is Date 1
  // chunks[2] is Description + Amounts 1
  // chunks[3] is Date 2 ...
  for (let i = 1; i < chunks.length - 1; i += 2) {
    const dateStr = chunks[i];
    const rowText = chunks[i + 1];
    
    // Find all valid currency numbers in this chunk
    const numberMatches = rowText.match(/[\d,]+[.:]\d{2}/g);
    if (!numberMatches || numberMatches.length < 1) continue;

    // The LAST number in the Kuda row chunk is always the Running Balance
    const balanceStr = numberMatches[numberMatches.length - 1];
    const cleanBal = balanceStr.replace(/[,:](\d{2})$/, '.$1');
    const currentBalance = parseAmount(cleanBal);
    
    const diff = currentBalance - previousBalance;
    const type = diff >= 0 ? 'CREDIT' : 'DEBIT';
    const amount = Math.abs(diff);

    // Skip summary footer strings
    if (amount === 0 && rowText.toLowerCase().includes('closing balance')) continue;

    const description = cleanMerchantName(rowText.replace(/[\d,]+[.:]\d{2}/g, '').replace(/[N#₦]/g, '').trim());

    transactions.push({
      date: parseDate(dateStr),
      description,
      amount,
      type,
      balance: currentBalance,
      originalText: dateStr + ' ' + rowText
    });

    previousBalance = currentBalance;
  }

  if (transactions.length === 0) {
    console.log("--- KUDA PARSER FAILED: RAW TEXT PREVIEW ---");
    console.log(flatText.substring(0, 1500));
  }

  return transactions;
}