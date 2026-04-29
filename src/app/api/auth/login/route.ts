import { NextRequest, NextResponse } from 'next/server';

/* ── User store (shared with register) ───────────────── */

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
  // eslint-disable-next-line no-var
  var __dapurmind_users: StoredUser[] | undefined;
}

function getUsers(): StoredUser[] {
  if (!globalThis.__dapurmind_users) {
    globalThis.__dapurmind_users = [];
  }
  return globalThis.__dapurmind_users;
}

/* ── POST /api/auth/login ─────────────────────────────── */

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

    const users = getUsers();
    const normalizedUsername = username.trim().toLowerCase();

    const user = users.find(
      (u) => u.username === normalizedUsername && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Return user without password
    const { password: _, ...safeUser } = user;

    return NextResponse.json({
      message: 'Login berhasil',
      user: safeUser,
    });
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
