import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { requireAuth, logActivity, AuthError } from '@/lib/auth-server';

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const simpleHash = (pw: string) => Buffer.from(unescape(encodeURIComponent(pw))).toString('base64');

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
      const user = await client.query(api.users.getByEmail, { email: normalizedEmail });

      if (!user || !user.isActive || user.deletedAt) {
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

      const user = await client.query(api.users.getByEmail, { email: normalizedEmail });

      if (!user || !user.isActive || user.deletedAt) {
        return NextResponse.json({ error: 'Email tidak ditemukan' }, { status: 404 });
      }

      // If currentPassword provided, verify it
      if (currentPassword && user.password) {
        const isMatch = simpleHash(currentPassword) === user.password;
        if (!isMatch) {
          return NextResponse.json({ error: 'Password saat ini salah' }, { status: 401 });
        }
      }

      // Hash and update password, which also invalidates all sessions
      await client.mutation(api.auth.resetPasswordByEmail, {
        email: normalizedEmail,
        newPassword,
      });

      const { password: _, ...safeUser } = user as any;

      return NextResponse.json({
        message: 'Password berhasil diubah. Silakan login kembali.',
        user: {
          ...safeUser,
          id: user._id,
        },
      });
    }

    return NextResponse.json({ error: 'Step tidak valid' }, { status: 400 });
  } catch (error: any) {
    console.error('[Auth Reset Password] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}