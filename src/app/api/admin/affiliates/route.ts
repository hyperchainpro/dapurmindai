import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth-server';

/* ── PATCH /api/admin/affiliates — Restore soft-deleted ── */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Affiliate ID is required' }, { status: 400 });
    }

    const account = await db.affiliateAccount.update({
      where: { id },
      data: { deletedAt: null },
    });

    return NextResponse.json({ account });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error restoring affiliate:', error);
    return NextResponse.json({ error: 'Gagal memulihkan afiliasi' }, { status: 500 });
  }
}
