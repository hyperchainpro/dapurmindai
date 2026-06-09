import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ── Admin key guard ──────────────────────────────────── */
function isAdmin(request: NextRequest): boolean {
  return request.headers.get('X-Admin-Key') === 'dapurmind2025';
}

/* ── PATCH /api/admin/affiliates — Restore soft-deleted ── */
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
    console.error('Error restoring affiliate:', error);
    return NextResponse.json({ error: 'Gagal memulihkan afiliasi' }, { status: 500 });
  }
}
