import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client configured for browser/client-side usage.
 * 
 * This function creates a Supabase client instance optimized for client-side
 * operations. It uses the browser client from @supabase/ssr which handles
 * authentication state management, cookie storage, and automatic token refresh
 * in the browser environment.
 * 
 * The client is configured with environment variables for security:
 * - NEXT_PUBLIC_SUPABASE_URL: The Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: The public anonymous key for client operations
 * 
 * @returns Configured Supabase client instance for browser usage
 * 
 * @example
 * ```typescript
 * const supabase = createClient();
 * 
 * // Use for authentication
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email: 'user@example.com',
 *   password: 'password'
 * });
 * 
 * // Use for database operations
 * const { data, error } = await supabase
 *   .from('polls')
 *   .select('*')
 *   .eq('user_id', user.id);
 * ```
 * 
 * @security Note: This client uses the public anonymous key which is safe to expose
 * in the browser. Row Level Security (RLS) policies in Supabase handle authorization.
 * 
 * @see {@link https://supabase.com/docs/guides/auth/server-side/nextjs} - Supabase SSR documentation
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
