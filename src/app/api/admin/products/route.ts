import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ── Admin key guard ──────────────────────────────────── */
function isAdmin(request: NextRequest): boolean {
  return request.headers.get('X-Admin-Key') === 'dapurmind2025';
}

/* ── PATCH /api/admin/products — Restore soft-deleted ─── */
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const product = await db.productLink.update({
      where: { id },
      data: { deletedAt: null },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error restoring product:', error);
    return NextResponse.json({ error: 'Gagal memulihkan produk' }, { status: 500 });
  }
}
