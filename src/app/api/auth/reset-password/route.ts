import { NextRequest, NextResponse } from 'next/server';

/* ── User store (shared with register/login) ─────────── */

interface StoredUser {
  id: string;
  username: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
  isOnboarded: boolean;
}

declare global {
  var __dapurmind_users: StoredUser[] | undefined;
}

function getUsers(): StoredUser[] {
  if (!globalThis.__dapurmind_users) {
    globalThis.__dapurmind_users = [];
  }
  return globalThis.__dapurmind_users;
}

/* ── POST /api/auth/reset-password ────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { step, email, newPassword } = body;

    if (!step || !email) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();

    // Step 1: Verify email exists
    if (step === 'verify') {
      const user = users.find((u) => u.email === normalizedEmail);

      if (!user) {
        return NextResponse.json(
          { error: 'Email tidak ditemukan dalam sistem kami' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Email terverifikasi',
        found: true,
      });
    }

    // Step 2: Reset password
    if (step === 'reset') {
      if (!newPassword) {
        return NextResponse.json(
          { error: 'Password baru wajib diisi' },
          { status: 400 }
        );
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password minimal 6 karakter' },
          { status: 400 }
        );
      }

      const userIndex = users.findIndex((u) => u.email === normalizedEmail);

      if (userIndex === -1) {
        return NextResponse.json(
          { error: 'Email tidak ditemukan' },
          { status: 404 }
        );
      }

      // Update password
      users[userIndex].password = newPassword;

      // Return user without password
      const { password: _, ...safeUser } = users[userIndex];

      return NextResponse.json({
        message: 'Password berhasil diubah',
        user: safeUser,
      });
    }

    return NextResponse.json(
      { error: 'Step tidak valid' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
