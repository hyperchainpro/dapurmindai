import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/* ── User store (shared with auth) ───────────────────────── */

interface StoredUser {
  id: string;
  username: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
  isOnboarded: boolean;
  avatar?: string;
  language?: string;
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

/* ── Allowed file types ──────────────────────────────────── */

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/* ── POST /api/profile ───────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File avatar tidak ditemukan.' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID diperlukan.' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error:
            'Format file tidak didukung. Gunakan format JPEG, PNG, WebP, atau GIF.',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'Ukuran file terlalu besar. Maksimal 5MB.',
        },
        { status: 400 }
      );
    }

    // Find user
    const users = getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const user = users[userIndex];

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
    const filename = `avatar-${userId}-${Date.now()}${ext}`;
    const filePath = join(avatarsDir, filename);

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update user's avatar field
    const avatarUrl = `/avatars/${filename}`;
    users[userIndex].avatar = avatarUrl;

    return NextResponse.json({
      success: true,
      avatar: avatarUrl,
      message: 'Avatar berhasil diperbarui.',
    });
  } catch (error) {
    console.error('[Profile API] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat mengunggah avatar.' },
      { status: 500 }
    );
  }
}
