import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { requireAuth, logActivity, AuthError } from '@/lib/auth-server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
    const user = await client.query(api.users.getById, { userId: auth.userId as Id<"users"> });

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
    await client.mutation(api.users.update, {
      userId: auth.userId as Id<"users">,
      avatar: avatarUrl,
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

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (language !== undefined) updateData.language = language;

    await client.mutation(api.users.update, {
      userId: auth.userId as Id<"users">,
      ...updateData,
    });

    const user = await client.query(api.users.getById, { userId: auth.userId as Id<"users"> });
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    await logActivity(auth.userId, 'profile.update', 'User', `Profile updated`, request);

    const { password: _, ...safeUser } = user as any;
    const formattedUser = {
      ...safeUser,
      id: user._id,
      createdAt: new Date(user._creationTime).toISOString(),
    };
    return NextResponse.json({ success: true, user: formattedUser });
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

    const user = await client.query(api.users.getById, { userId: auth.userId as Id<"users"> });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    const formattedUser = {
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      language: user.language,
      role: user.role,
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
      createdAt: new Date(user._creationTime).toISOString(),
    };

    return NextResponse.json({ success: true, user: formattedUser });
  } catch (error) {
    console.error('[Profile API] GET Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}