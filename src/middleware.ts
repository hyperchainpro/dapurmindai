import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/* == In-memory rate limiter (per IP) ============================== */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

// Clean up stale entries every 60 seconds
let lastCleanup = Date.now();
function cleanupStale() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimits) {
    if (now > entry.resetTime) rateLimits.delete(key);
  }
}

function checkRateLimit(
  ip: string,
  path: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupStale();
  const key = `${ip}:${path}`;
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetTime) {
    const newEntry = { count: 1, resetTime: now + windowMs };
    rateLimits.set(key, newEntry);
    return { allowed: true, remaining: maxRequests - 1, resetTime: newEntry.resetTime };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}

/* == Rate limit config per route pattern ========================== */

interface RateLimitConfig {
  max: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Auth endpoints: 10 requests per 15 minutes
  '/api/auth/login': { max: 10, windowMs: 15 * 60 * 1000 },
  '/api/auth/register': { max: 5, windowMs: 15 * 60 * 1000 },
  '/api/auth/reset-password': { max: 3, windowMs: 15 * 60 * 1000 },

  // AI/Chat endpoints: 20 requests per minute
  '/api/chat': { max: 20, windowMs: 60 * 1000 },
  '/api/finance/ai-advice': { max: 10, windowMs: 60 * 1000 },
  '/api/zero-waste': { max: 15, windowMs: 60 * 1000 },

  // Admin endpoints: 30 requests per minute
  '/api/admin': { max: 30, windowMs: 60 * 1000 },

  // General API: 60 requests per minute
  '/api': { max: 60, windowMs: 60 * 1000 },
};

function getRateLimitConfig(path: string): RateLimitConfig {
  // Check most specific patterns first
  for (const pattern of Object.keys(RATE_LIMITS).sort((a, b) => b.length - a.length)) {
    if (path.startsWith(pattern)) {
      return RATE_LIMITS[pattern];
    }
  }
  return { max: 60, windowMs: 60 * 1000 }; // default
}

/* == Middleware =================================================== */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate limit API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const config = getRateLimitConfig(pathname);
  const result = checkRateLimit(ip, pathname, config.max, config.windowMs);

  const response = result.allowed
    ? NextResponse.next()
    : NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', String(config.max));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
