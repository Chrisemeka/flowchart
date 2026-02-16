'use client';

import { createClient } from '@/lib/supabase/client';

export default function LoginButtons() {
  const supabase = createClient();

  const handleLogin = async (provider: 'google' | 'apple') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Login error:', error.message);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <button
        onClick={() => handleLogin('google')}
        className="flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-all"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
        Continue with Google
      </button>
    </div>
  );
}