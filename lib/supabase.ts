import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { requireEnv, requireEnvValue } from '@/lib/requireEnv';

export function createClient() {
  return createServerClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}

// NOTE: keep literal process.env.NEXT_PUBLIC_* here so Next can inline into the client bundle (requireEnv's dynamic access would break inlining).
export function createBrowserClientInstance() {
  return createBrowserClient(
    requireEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    requireEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
}
