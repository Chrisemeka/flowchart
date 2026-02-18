'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getUserStatements() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
        .from('statements')
        .select('id, bank_name, account_number, month, year, file_name, start_date')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

    if (error) {
        console.error('Error fetching statements:', error);
        return { error: error.message };
    }

    return { data };
}

export async function getStatementDetails(statementId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    // Fetch statement metadata
    const { data: statement, error: statementError } = await supabase
        .from('statements')
        .select('*')
        .eq('id', statementId)
        .eq('user_id', user.id)
        .single();

    if (statementError || !statement) {
        console.error('Error fetching statement details:', statementError);
        return { error: statementError?.message || 'Statement not found' };
    }

    // Fetch transactions
    const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('statement_id', statementId)
        .order('date', { ascending: true });

    if (txError) {
        console.error('Error fetching transactions:', txError);
        return { error: txError.message };
    }

    return {
        data: {
            statementId: statement.id,
            transactionCount: transactions.length,
            transactions: transactions,
            bank: statement.bank_name,
            month: statement.month,
            year: statement.year
        }
    };
}
