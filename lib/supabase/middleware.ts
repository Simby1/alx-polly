import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Updates the Supabase session in middleware for authentication state management.
 * 
 * This middleware function handles Supabase authentication state across requests
 * in the Next.js App Router. It's responsible for:
 * - Reading authentication cookies from incoming requests
 * - Refreshing expired sessions automatically
 * - Setting updated authentication cookies in responses
 * - Redirecting unauthenticated users to the login page
 * 
 * The middleware runs on every request (except static assets) and ensures that
 * authentication state is properly maintained across server and client components.
 * 
 * @param request - The incoming Next.js request object
 * @returns NextResponse with updated authentication cookies and potential redirects
 * 
 * @example
 * ```typescript
 * // In middleware.ts
 * import { updateSession } from '@/lib/supabase/middleware'
 * 
 * export async function middleware(request: NextRequest) {
 *   return await updateSession(request)
 * }
 * ```
 * 
 * @security Features:
 * - Automatic session refresh prevents expired token issues
 * - Secure cookie handling with proper options
 * - Protection against unauthorized access to protected routes
 * - Proper cleanup of invalid sessions
 * 
 * @see {@link https://supabase.com/docs/guides/auth/server-side/nextjs} - Supabase middleware documentation
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Create Supabase client with cookie handling for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Reads cookies from the incoming request.
         * This allows the middleware to access the current authentication state.
         */
        getAll() {
          return request.cookies.getAll()
        },
        /**
         * Sets cookies in the response for authentication state updates.
         * This handles session refresh, login, and logout cookie updates.
         * 
         * The function updates both the request cookies and response cookies
         * to ensure proper state management across the request lifecycle.
         */
        setAll(cookiesToSet) {
          // Update request cookies for current request
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          
          // Create new response with updated cookies
          supabaseResponse = NextResponse.next({
            request,
          })
          
          // Set cookies in the response for client-side access
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get current user from the session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login page
  // Skip redirect for login/register pages and auth-related routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Return response with updated authentication state
  return supabaseResponse
}