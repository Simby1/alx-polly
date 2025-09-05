import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client configured for server-side usage in Next.js App Router.
 * 
 * This function creates a Supabase client instance optimized for server-side
 * operations such as Server Actions, Route Handlers, and Server Components.
 * It uses the server client from @supabase/ssr which properly handles cookies
 * and authentication state in the server environment.
 * 
 * The client is configured with:
 * - Environment variables for Supabase connection
 * - Cookie management for authentication state
 * - Proper error handling for server-side operations
 * 
 * @returns Promise resolving to configured Supabase client instance for server usage
 * 
 * @example
 * ```typescript
 * // In a Server Action
 * export async function createPoll(data: CreatePollFormData) {
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   
 *   if (!user) {
 *     throw new Error('User not authenticated');
 *   }
 *   
 *   const { data: poll, error } = await supabase
 *     .from('polls')
 *     .insert({ ...data, user_id: user.id })
 *     .select()
 *     .single();
 * }
 * ```
 * 
 * @security Note: This client has access to the user's session through cookies
 * and can perform operations on behalf of the authenticated user. Always verify
 * user authentication before performing sensitive operations.
 * 
 * @see {@link https://supabase.com/docs/guides/auth/server-side/nextjs} - Supabase SSR documentation
 */
export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Retrieves all cookies from the request.
         * This is used by Supabase to read authentication cookies.
         */
        getAll() {
          return cookieStore.getAll()
        },
        /**
         * Sets cookies in the response.
         * This handles authentication state updates and session management.
         * 
         * Note: The try/catch block handles cases where setAll is called from
         * Server Components, which can be safely ignored when middleware is
         * handling session refresh.
         */
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}