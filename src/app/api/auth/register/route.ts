import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, createToken, createSession, getAuthUser, logActivity, AuthError } from '@/lib/auth-server';

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/register
   ═══════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, username, email, password } = body;

    // Validation
    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nama minimal 2 karakter' }, { status: 400 });
    }

    if (typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json({ error: 'Username minimal 3 karakter' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9._]+$/.test(username.trim())) {
      return NextResponse.json(
        { error: 'Username hanya boleh huruf, angka, titik, dan underscore' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    // Check uniqueness
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username: normalizedUsername },
          { email: normalizedEmail },
        ],
        deletedAt: null,
      },
    });

    if (existingUser) {
      if (existingUser.username === normalizedUsername) {
        return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await db.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        name: name.trim(),
        password: hashedPassword,
        language: 'id',
        role: 'user',
      },
    });

    // Create session
    const token = await createToken({ userId: user.id, role: user.role });
    await createSession(user.id, token, request);

    // Log activity
    await logActivity(user.id, 'user.register', 'User', `New user registered: ${normalizedUsername}`, request);

    const { password: _, ...safeUser } = user;

    return NextResponse.json(
      {
        message: 'Registrasi berhasil',
        user: safeUser,
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Auth Register] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}