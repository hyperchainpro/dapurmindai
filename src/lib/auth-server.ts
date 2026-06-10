import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/* ── Constants ─────────────────────────────────────────── */

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dapurmind-jwt-secret-change-in-production-2024'
);

const TOKEN_EXPIRY_HOURS = 24 * 7; // 7 days

// Hardcoded admin secret (matches AdminLogin.tsx credentials)
const ADMIN_API_KEY = 'dapurmind-admin-key-2025';

/* ── Password Helpers ──────────────────────────────────── */

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* ── JWT Helpers ────────────────────────────────────────── */

export async function createToken(payload: { userId: string; role: string }): Promise<string> {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRY_HOURS}h`)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      role: (payload.role as string) || 'user',
    };
  } catch {
    return null;
  }
}

/* ── Session Management ─────────────────────────────────── */

export async function createSession(
  userId: string,
  token: string,
  req?: Request
): Promise<void> {
  const ipAddress = req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || undefined;
  const userAgent = req?.headers.get('user-agent') || undefined;
  const expiresAt = Date.now() + TOKEN_EXPIRY_HOURS * 3600 * 1000;

  try {
    await client.mutation(api.auth.createSession, {
      userId: userId as any,
      token,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
      expiresAt,
    });
  } catch (error) {
    console.error('[Auth Server] createSession error:', error);
  }
}

export async function validateSession(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const user = await client.query(api.auth.verifyToken, { token });
    if (!user) return null;
    return { userId: user.userId, role: user.role };
  } catch (e) {
    console.error('[Auth Server] validateSession error:', e);
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  try {
    await client.mutation(api.auth.logout, { token });
  } catch (e) {
    console.error('[Auth Server] deleteSession error:', e);
  }
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  try {
    await client.mutation(api.auth.deleteAllUserSessions, { userId: userId as any });
  } catch (e) {
    console.error('[Auth Server] deleteAllUserSessions error:', e);
  }
}

/* ── Auth Request Helper ───────────────────────────────── */

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Also check query param for WebSocket/SSE
  const url = new URL(req.url);
  return url.searchParams.get('token');
}

export async function getAuthUser(req: Request): Promise<{ userId: string; role: string } | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return validateSession(token);
}

export async function requireAuth(req: Request): Promise<{ userId: string; role: string }> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }
  return user;
}

export async function requireAdmin(req: Request): Promise<{ userId: string; role: string }> {
  // 1. Check for admin API key header (client-side admin login)
  const adminKey = req.headers.get('x-admin-key');
  if (adminKey === ADMIN_API_KEY) {
    return { userId: 'admin-system', role: 'superadmin' };
  }

  // 2. Fall back to JWT session-based auth
  const user = await requireAuth(req);
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    throw new AuthError('Forbidden: Admin access required', 403);
  }
  return user;
}

/* ── Activity Logging ──────────────────────────────────── */

export async function logActivity(
  userId: string,
  action: string,
  target?: string,
  detail?: string,
  req?: Request
): Promise<void> {
  const ipAddress = req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || undefined;
  const userAgent = req?.headers.get('user-agent') || undefined;

  try {
    await client.mutation(api.users.logUserActivity, {
      userId,
      action,
      target: target || undefined,
      detail: detail || undefined,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });
  } catch (error) {
    console.error('[Auth] Failed to log activity:', error);
  }
}

/* ── Auth Error Class ──────────────────────────────────── */

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}