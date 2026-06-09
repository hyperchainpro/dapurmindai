import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword, getAuthUser, logActivity, deleteSession, deleteAllUserSessions, AuthError } from '@/lib/auth-server';

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/reset-password
   Step 1 (verify): Check if email exists
   Step 2 (reset): Change password (requires auth or email match)
   ═══════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { step, email, currentPassword, newPassword } = body;

    if (!step || !email) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Step 1: Verify email exists
    if (step === 'verify') {
      const user = await db.user.findFirst({
        where: { email: normalizedEmail, isActive: true, deletedAt: null },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Email tidak ditemukan dalam sistem kami' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'Email terverifikasi',
        found: true,
        name: user.name,
      });
    }

    // Step 2: Reset password
    if (step === 'reset') {
      if (!newPassword) {
        return NextResponse.json({ error: 'Password baru wajib diisi' }, { status: 400 });
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
      }

      const user = await db.user.findFirst({
        where: { email: normalizedEmail, isActive: true, deletedAt: null },
      });

      if (!user) {
        return NextResponse.json({ error: 'Email tidak ditemukan' }, { status: 404 });
      }

      // If currentPassword provided, verify it
      if (currentPassword && user.password) {
        const isMatch = await verifyPassword(currentPassword, user.password);
        if (!isMatch) {
          return NextResponse.json({ error: 'Password saat ini salah' }, { status: 401 });
        }
      }

      // Hash and update password
      const hashedPassword = await hashPassword(newPassword);
      await db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Invalidate all sessions (force re-login)
      await deleteAllUserSessions(user.id);

      // Log activity
      await logActivity(user.id, 'user.reset_password', 'User', 'Password was reset', request);

      const { password: _, ...safeUser } = user;

      return NextResponse.json({
        message: 'Password berhasil diubah. Silakan login kembali.',
        user: safeUser,
      });
    }

    return NextResponse.json({ error: 'Step tidak valid' }, { status: 400 });
  } catch (error) {
    console.error('[Auth Reset Password] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}