import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Safe Supabase client — returns a mock client if env vars are missing
function createSafeSupabaseClient(): SupabaseClient {
  if (
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('xyzcompany')
  ) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  // Return a mock that never throws so the app works offline / in dev
  const noop = () => Promise.resolve({ data: null, error: null });
  const mockAuth = {
    signInWithPassword: noop,
    signUp: noop,
    signInWithOAuth: noop,
    signOut: noop,
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: (_event: any, _cb: any) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  };
  return { auth: mockAuth } as unknown as SupabaseClient;
}

export const supabase = createSafeSupabaseClient();

export interface UserSession {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  } | null;
  accessToken: string | null;
}
