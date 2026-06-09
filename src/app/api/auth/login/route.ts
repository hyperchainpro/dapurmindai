import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createToken, createSession, logActivity, AuthError } from '@/lib/auth-server';

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/login
   ═══════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const normalizedUsername = username.trim().toLowerCase();

    // Find user by username or email
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username: normalizedUsername },
          { email: normalizedUsername },
        ],
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session token
    const token = await createToken({ userId: user.id, role: user.role });
    await createSession(user.id, token, request);

    // Log activity
    await logActivity(user.id, 'user.login', 'User', `User logged in: ${user.username}`, request);

    const { password: _, ...safeUser } = user;

    return NextResponse.json({
      message: 'Login berhasil',
      user: safeUser,
      token,
      avatar: user.avatar || null,
      language: user.language || 'id',
    });
  } catch (error) {
    console.error('[Auth Login] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}