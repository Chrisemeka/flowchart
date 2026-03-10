import { parseDate, parseAmount, cleanMerchantName } from '../utils';

// Strategy for FirstBank
// Table structure: Date(DD-MMM-YYYY) Ref(Alphanumeric) Details(String) ValueDate(DD-MMM-YYYY) Withdrawal Amount Deposit Amount Balance
// E.g., 04-Feb-2026 S76182236 REM:R-1426464991... 04-Feb-2026 0.00 77,000.00 77,000.00 S76182236
const DATE_PATTERN = `\\d{2}-[A-Za-z]{3}-\\d{4}`;
const AMOUNT_PATTERN = `[\\d,]+[.:]\\d{2}`;

const FIRSTBANK_PATTERN = new RegExp(
    `(${DATE_PATTERN})\\s+(\\S+)\\s+([\\s\\S]{1,800}?)\\s+(${DATE_PATTERN})\\s+(${AMOUNT_PATTERN})\\s+(${AMOUNT_PATTERN})\\s+(${AMOUNT_PATTERN})(?:\\s+\\S+)?`,
    'g'
);

export function parseFirstBankPDF(pages: string[]) {
    const fullText = pages.join('  ');
    const transactions: Record<string, unknown>[] = [];

    let match;
    let matchCount = 0;

    while ((match = FIRSTBANK_PATTERN.exec(fullText)) !== null) {
        matchCount++;
        const [fullMatch, transDateStr, refStr, descRaw, valDateStr, withdrawalStr, depositStr, balanceStr] = match;

        const currentBalance = parseAmount(balanceStr);
        const date = parseDate(transDateStr);

        const withdrawal = parseAmount(withdrawalStr);
        const deposit = parseAmount(depositStr);

        let amount = 0;
        let type = '';

        if (deposit > 0) {
            amount = deposit;
            type = 'CREDIT';
        } else if (withdrawal > 0) {
            amount = withdrawal;
            type = 'DEBIT';
        } else {
            // Possible zero-value transaction? Just skip or record as 0
            continue;
        }

        const description = cleanMerchantName(descRaw.replace(/\\s+/g, ' ').trim());

        transactions.push({
            date,
            description,
            amount,
            type,
            balance: currentBalance,
            reference: refStr,
            originalText: fullMatch.trim()
        });
    }

    // Debugging safety net
    if (matchCount === 0) {
        console.log("--- FIRSTBANK PARSER FAILED: RAW TEXT PREVIEW ---");
        console.log(fullText.substring(0, 1500));
    }

    return transactions;
}
