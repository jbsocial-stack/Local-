import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from './types';

/**
 * Supabase client bound to the current request's cookies — used in Route
 * Handlers and Server Components to read the signed-in owner/ops user's
 * session (set by the magic-link callback and refreshed by middleware.ts).
 * This is a normal anon-key client subject to RLS, distinct from
 * createServiceClient() which bypasses RLS for the app's own writes.
 */
export async function createRouteHandlerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render — middleware.ts already
            // refreshes the session cookie on the next request.
          }
        },
      },
    },
  );
}
