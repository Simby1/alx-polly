import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Simple in-memory rate limit (per Vercel/Edge instance). For production, use durable storage (Upstash/Redis).
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max POSTs per window
const ipHits: Map<string, { count: number; resetAt: number }> = new Map();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipHits.get(ip);
  if (!record || record.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  record.count += 1;
  if (record.count > RATE_LIMIT_MAX) return true;
  ipHits.set(ip, record);
  return false;
}

export async function middleware(request: NextRequest) {
  // Basic rate limiting for POSTs to /login and /create
  const url = new URL(request.url);
  const isProtectedPath = request.method === 'POST' && (url.pathname === '/login' || url.pathname === '/create');
  if (isProtectedPath) {
    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|register|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}