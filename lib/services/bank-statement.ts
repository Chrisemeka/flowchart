import { SupabaseClient } from '@supabase/supabase-js';
import { parseBankStatement } from '@/lib/flowchart-engine';
import { generateTransactionHash } from '@/utils/hash';
import { User } from '@supabase/supabase-js';
import { categorizeTransactions } from './gemini';

export interface ProcessedStatementResult {
    status: 'success' | 'error';
    message: string;
    data?: {
        statementId: string;
        transactionCount: number;
        transactions?: any[];
        bank?: string;
    };
    details?: string;
}

export async function processBankStatement(
    file: File,
    user: User,
    supabase: SupabaseClient
): Promise<ProcessedStatementResult> {
    try {
        // 1. Validate File
        if (!file) {
            return { status: 'error', message: 'No file provided' };
        }

        const buffer = await file.arrayBuffer();

        // 2. Run the Flowchart Parsing Engine
        const parsedData = await parseBankStatement(buffer);

        if (parsedData.status === 'error') {
            return { status: 'error', message: parsedData.message || 'Parsing failed' };
        }

        const transactions = parsedData.transactions || [];

        if (transactions.length === 0) {
            return {
                status: 'error',
                message: 'No transactions found in this document.'
            };
        }

        // 3. Calculate Statement Metadata (Start/End Dates)
        const { startDate, endDate, statementMonth, statementYear } = calculateStatementMetadata(transactions);

        // 4. Insert Statement into Supabase
        const statementResult = await saveStatementToDb(supabase, user, parsedData, startDate, endDate, statementMonth, statementYear, file.name);

        if (statementResult.error) {
            // 23505 is the Postgres error code for unique_violation
            if (statementResult.error.code === '23505') {
                return {
                    status: 'error',
                    message: `You have already uploaded a ${parsedData.bank} statement for ${statementMonth}/${statementYear}.`
                };
            }
            throw statementResult.error;
        }

        const statement = statementResult.data;

        // 5. Categorize Transacitons
        const categories = await categorizeTransactions(transactions.map((t, index) => ({
            id: index, // Temporary ID for mapping
            description: t.originalText || t.description,
            amount: t.amount
        })));

        // 6. Prepare and Hash Transactions
        const transactionsToInsert = prepareTransactions(transactions, statement.id, categories);

        // 6. Insert Transactions into Supabase
        const txError = await saveTransactionsToDb(supabase, transactionsToInsert);

        if (txError) {
            // If transactions fail to insert, we should ideally delete the statement to prevent orphan data
            await supabase.from('statements').delete().eq('id', statement.id);
            throw txError;
        }

        // 7. Success
        return {
            status: 'success',
            message: `Successfully saved ${transactions.length} transactions.`,
            data: {
                statementId: statement.id,
                transactionCount: transactions.length,
                transactions: transactionsToInsert,
                bank: parsedData.bank
            }
        };

    } catch (error: any) {
        console.error('Service Error:', error);
        return {
            status: 'error',
            message: 'Server error while processing document',
            details: error.message
        };
    }
}

function calculateStatementMetadata(transactions: any[]) {
    const dates = transactions.map((t: any) => new Date(t.date).getTime());
    const startDate = new Date(Math.min(...dates));
    const endDate = new Date(Math.max(...dates));

    const statementMonth = startDate.getMonth() + 1; // JS months are 0-indexed
    const statementYear = startDate.getFullYear();

    return { startDate, endDate, statementMonth, statementYear };
}

async function saveStatementToDb(
    supabase: SupabaseClient,
    user: User,
    parsedData: any,
    startDate: Date,
    endDate: Date,
    statementMonth: number,
    statementYear: number,
    fileName: string
) {
    return await supabase
        .from('statements')
        .insert({
            user_id: user.id,
            bank_name: parsedData.bank,
            account_number: 'UNKNOWN', // Update engine later to extract this from the PDF header
            month: statementMonth,
            year: statementYear,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            file_name: fileName
        })
        .select('id')
        .single();
}

function prepareTransactions(transactions: any[], statementId: string, categories: Record<string, string> = {}) {
    return transactions.map((t: any, index: number) => ({
        statement_id: statementId,
        amount: t.amount,
        type: t.type,
        date: new Date(t.date).toISOString(),
        narration: t.originalText || t.description,
        clean_name: t.description,
        category: categories[index] || 'Uncategorized', // Use Gemini category or default
        hash: generateTransactionHash({
            date: t.date,
            amount: t.amount,
            type: t.type,
            description: t.originalText || t.description
        })
    }));
}

async function saveTransactionsToDb(supabase: SupabaseClient, transactions: any[]) {
    const { error } = await supabase
        .from('transactions')
        .insert(transactions);
    return error;
}
