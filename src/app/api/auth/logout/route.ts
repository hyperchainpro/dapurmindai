import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, getAuthUser, logActivity, AuthError } from '@/lib/auth-server';

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/logout
   ═══════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 400 });
    }

    // Get user before deleting session
    const auth = await getAuthUser(request);

    // Delete session from DB
    await deleteSession(token);

    // Log activity (best effort)
    if (auth) {
      await logActivity(auth.userId, 'user.logout', 'User', 'User logged out', request);
    }

    return NextResponse.json({ message: 'Logout berhasil' });
  } catch (error) {
    console.error('[Auth Logout] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}