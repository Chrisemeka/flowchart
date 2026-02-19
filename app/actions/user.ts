'use server';

import { createClient } from '@/lib/supabase/server';

export async function getUserTermsStatus() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'User not authenticated' };
    }

    // Fetch the user's current status from the public.users table (or wherever user profile is stored)
    // Assuming there is a 'users' table or similar that extends auth.users, or columns on auth.users (less likely to be directly accessible via standard client)
    // The user request mentions "terms_accepted_at" and "privacy_accepted_at" timestampz fields in the "users" table.

    const { data, error } = await supabase
        .from('users')
        .select('terms_accepted_at, privacy_accepted_at')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching user terms status:', error);
        return { error: error.message };
    }

    return {
        termsAcceptedAt: data?.terms_accepted_at,
        privacyAcceptedAt: data?.privacy_accepted_at,
    };
}

export async function acceptTermsAndPrivacy() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'User not authenticated' };
    }

    const now = new Date().toISOString();

    const { error } = await supabase
        .from('users')
        .update({
            terms_accepted_at: now,
            privacy_accepted_at: now,
        })
        .eq('id', user.id);

    if (error) {
        console.error('Error updating user terms status:', error);
        return { error: error.message };
    }

    return { success: true };
}
