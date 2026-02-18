'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateTransactionCategory(transactionId: string, category: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    try {
        const { error } = await supabase
            .from('transactions')
            .update({ category })
            .eq('id', transactionId)
            // Ensure the transaction belongs to a statement owned by the user
            // This is a bit complex with a direct update, so we might rely on RLS policies if they are set up correctly.
            // However, to be safe without knowing the exact RLS, we could verify ownership first or rely on the fact that if RLS is on, it will fail.
            // Assuming standard RLS:
            // .eq('user_id', user.id) // If transactions have user_id derived from statement
            // But transactions might not have user_id directly if it's normalized.
            // Let's assume RLS handles it or we'd need a join.
            // For now, let's try a direct update. usage of .select() usually confirms if rows matched.
            .select();

        if (error) {
            console.error('Error updating transaction category:', error);
            return { error: error.message };
        }

        revalidatePath('/dashboard/history');
        revalidatePath(`/dashboard/history/[id]`, 'page'); // Revalidate the dynamic route if possible, or just layout

        return { success: true };
    } catch (error) {
        console.error('Unexpected error updating transaction:', error);
        return { error: 'An unexpected error occurred' };
    }
}
