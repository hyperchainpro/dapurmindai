import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth-server';

/* ═══════════════════════════════════════════════════════════
   GET /api/auth/me — Get current authenticated user
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
        // Include related counts
        _count: {
          select: {
            creatorRecipes: { where: { isActive: true, isPublished: true } },
            financeRecords: { where: { isActive: true } },
            sessions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('[Auth Me] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}