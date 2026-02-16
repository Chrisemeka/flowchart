import { GoogleGenerativeAI } from '@google/generative-ai';

export async function categorizeTransactions(transactions: any[]) {
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is not set');
        return {};
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Prepare a simplified list of transactions for the prompt to save tokens
    const simplifiedTransactions = transactions.map((t) => ({
        id: t.id, // Using hash or temporary ID for mapping back
        description: t.description || t.originalText,
        amount: t.amount,
    }));

    const prompt = `
    You are an expert financial assistant specializing in Nigerian bank statements. Your task is to categorize bank transactions strictly into one of the predefined categories based on their description, amount, and type (Debit/Credit).

ALLOWED CATEGORIES (You MUST choose ONLY from this list):
- Food & Dining
- Groceries
- Transport
- Housing & Utilities
- Shopping & Services
- Health & Wellness
- Subscriptions & Entertainment
- Bank Fees & Taxes
- Transfers (Use only if no specific purpose is mentioned)
- Income
- Refunds
- Miscellaneous

RULES FOR CATEGORIZATION:
1. Bank Fees & Taxes: Any transaction containing "VAT", "Stamp Duty", "Card Maint Fee", "SMS Alert", or "Commission" MUST be categorized as "Bank Fees & Taxes". 
2. Transfer Purposes: If a transfer description contains a clear purpose (e.g., "/food/", "/Phone repairs/", "/Transport allowance/"), prioritize the purpose (e.g., "Food & Dining", "Shopping & Services", "Transport") rather than defaulting to "Transfers".
3. Identical Descriptions: If a transaction description is identical to a transfer but the amount is exactly 10.00, 25.00, 50.00 (Commission) or 0.75, 1.88, 3.75 (VAT), categorize it as "Bank Fees & Taxes".
4. Credits vs. Debits: Treat inward credits with generic names (like "Transfer from...") as "Income" or "Refunds", not "Transfers".

Return ONLY a valid JSON object where the keys are the transaction IDs and the values are the exact category names from the allowed list. Do not include markdown blocks (e.g., json code blocks), backticks, or any explanations.
    ${JSON.stringify(simplifiedTransactions)}
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up potential markdown code blocks if Gemini adds them despite instructions
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(cleanText);
    } catch (error) {
        console.error('Error categorizing transactions with Gemini:', error);
        return {};
    }
}
