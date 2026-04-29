import { NextRequest, NextResponse } from 'next/server';

/* ── Simple in-memory user store (for demo) ─────────── */
// In production, use a database. We use a global to persist across hot reloads.

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

/* ── POST /api/auth/register ──────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, username, email, password } = body;

    // Basic validation
    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      );
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nama minimal 2 karakter' },
        { status: 400 }
      );
    }

    if (typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username minimal 3 karakter' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9._]+$/.test(username.trim())) {
      return NextResponse.json(
        { error: 'Username hanya boleh huruf, angka, titik, dan underscore' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      );
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    const users = getUsers();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    // Check uniqueness
    const existingUsername = users.find((u) => u.username === normalizedUsername);
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 409 }
      );
    }

    const existingEmail = users.find((u) => u.email === normalizedEmail);
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    // Create user (password stored as plain text for demo - in production, use bcrypt)
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      username: normalizedUsername,
      email: normalizedEmail,
      name: name.trim(),
      password: password,
      createdAt: new Date().toISOString(),
      isOnboarded: false,
    };

    users.push(newUser);

    // Return user without password
    const { password: _, ...safeUser } = newUser;

    return NextResponse.json(
      {
        message: 'Registrasi berhasil',
        user: safeUser,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
