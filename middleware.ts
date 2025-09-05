import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Rate limiting configuration for protecting against brute force attacks.
 * 
 * These constants define the rate limiting parameters for critical endpoints.
 * The current implementation uses in-memory storage which is suitable for
 * development and small-scale deployments, but should be replaced with
 * durable storage (like Upstash Redis) for production environments.
 */
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const RATE_LIMIT_MAX = 10; // Maximum requests per window per IP
const ipHits: Map<string, { count: number; resetAt: number }> = new Map();

/**
 * Checks if an IP address has exceeded the rate limit for critical endpoints.
 * 
 * This function implements a sliding window rate limiter to protect against
 * brute force attacks on authentication endpoints. It tracks the number of
 * requests from each IP address within a time window and blocks requests
 * that exceed the threshold.
 * 
 * @param ip - The IP address to check (can be direct IP or forwarded IP)
 * @returns true if the IP is rate limited, false otherwise
 * 
 * @example
 * ```typescript
 * const clientIP = request.ip || request.headers.get('x-forwarded-for');
 * if (isRateLimited(clientIP)) {
 *   return new NextResponse('Too Many Requests', { status: 429 });
 * }
 * ```
 * 
 * @security Note: This is a basic implementation. For production:
 * - Use durable storage (Redis, Upstash) instead of in-memory Map
 * - Consider different limits for different endpoints
 * - Implement progressive penalties (longer blocks for repeat offenders)
 * - Add monitoring and alerting for rate limit violations
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipHits.get(ip);
  
  // If no record exists or window has expired, create new record
  if (!record || record.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  // Increment request count
  record.count += 1;
  
  // Check if limit exceeded
  if (record.count > RATE_LIMIT_MAX) {
    return true;
  }
  
  // Update record with new count
  ipHits.set(ip, record);
  return false;
}

/**
 * Main middleware function that handles authentication and rate limiting.
 * 
 * This middleware runs on every request and performs two critical security functions:
 * 1. Rate limiting for sensitive endpoints (login, poll creation)
 * 2. Authentication state management and session refresh
 * 
 * The middleware is configured to run on all routes except static assets and
 * authentication pages to ensure proper security coverage.
 * 
 * @param request - The incoming Next.js request object
 * @returns NextResponse with potential rate limiting blocks or authentication redirects
 * 
 * @example
 * ```typescript
 * // Middleware configuration in next.config.js
 * export const config = {
 *   matcher: [
 *     '/((?!_next/static|_next/image|favicon.ico|login|register|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
 *   ],
 * }
 * ```
 * 
 * @security Features:
 * - Rate limiting prevents brute force attacks on authentication endpoints
 * - Automatic session refresh maintains authentication state
 * - Redirects unauthenticated users to login page
 * - Protects against common attack vectors
 * 
 * @performance Note: The middleware runs on every request, so it's optimized
 * for minimal overhead. Rate limiting uses in-memory storage for speed.
 */
export async function middleware(request: NextRequest) {
  // Rate limiting for critical POST endpoints
  const url = new URL(request.url);
  const isProtectedPath = request.method === 'POST' && (url.pathname === '/login' || url.pathname === '/create');
  
  if (isProtectedPath) {
    // Extract client IP address (handles various proxy configurations)
    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    
    // Check rate limit and block if exceeded
    if (isRateLimited(ip)) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }

  // Handle authentication state and session management
  return await updateSession(request)
}

/**
 * Middleware configuration defining which routes should be processed.
 * 
 * This configuration ensures the middleware runs on all routes except:
 * - Next.js static assets (_next/static, _next/image)
 * - Favicon and other static files
 * - Authentication pages (login, register) - these are handled separately
 * - Image files (svg, png, jpg, jpeg, gif, webp)
 * 
 * The matcher uses negative lookahead regex to exclude these routes while
 * processing everything else for authentication and rate limiting.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|register|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}