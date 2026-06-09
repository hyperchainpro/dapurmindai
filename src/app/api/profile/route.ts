import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, logActivity, AuthError } from '@/lib/auth-server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/* ── Allowed file types ──────────────────────────────────── */

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/* ═══════════════════════════════════════════════════════════
   POST /api/profile — Upload avatar (requires auth)
   ═══════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File avatar tidak ditemukan.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan format JPEG, PNG, WebP, atau GIF.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 5MB.' },
        { status: 400 }
      );
    }

    // Get current user
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { avatar: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Ensure avatars directory exists
    const avatarsDir = join(process.cwd(), 'public', 'avatars');
    if (!existsSync(avatarsDir)) {
      await mkdir(avatarsDir, { recursive: true });
    }

    // Delete old avatar file if exists
    if (user.avatar) {
      try {
        const oldPath = join(process.cwd(), 'public', user.avatar);
        if (existsSync(oldPath)) {
          await unlink(oldPath);
        }
      } catch (err) {
        console.warn('[Profile API] Failed to delete old avatar:', err);
      }
    }

    // Generate unique filename
    const ext = ALLOWED_EXTENSIONS[file.type] || '.jpg';
    const filename = `avatar-${auth.userId}-${Date.now()}${ext}`;
    const filePath = join(avatarsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update user avatar
    const avatarUrl = `/avatars/${filename}`;
    await db.user.update({
      where: { id: auth.userId },
      data: { avatar: avatarUrl },
    });

    await logActivity(auth.userId, 'profile.update_avatar', 'User', `Avatar updated: ${avatarUrl}`, request);

    return NextResponse.json({
      success: true,
      avatar: avatarUrl,
      message: 'Avatar berhasil diperbarui.',
    });
  } catch (error) {
    console.error('[Profile API] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat mengunggah avatar.' },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════
   PUT /api/profile — Update profile data (requires auth)
   ═══════════════════════════════════════════════════════════ */

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();
    const { name, language } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (language !== undefined) updateData.language = language;

    const user = await db.user.update({
      where: { id: auth.userId },
      data: updateData,
    });

    await logActivity(auth.userId, 'profile.update', 'User', `Profile updated`, request);

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('[Profile API] PUT Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════
   GET /api/profile — Get current user profile (requires auth)
   ═══════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatar: true,
        language: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('[Profile API] GET Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}