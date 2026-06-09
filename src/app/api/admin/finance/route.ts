import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ── Admin key guard ──────────────────────────────────── */
function isAdmin(request: NextRequest): boolean {
  return request.headers.get('X-Admin-Key') === 'dapurmind2025';
}

/* ── GET /api/admin/finance ──────────────────────────── */
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '';
    const type = searchParams.get('type') || '';

    const where: Record<string, unknown> = { deletedAt: null };
    if (userId) where.userId = userId;
    if (type) where.type = type;

    const records = await db.financeRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        userId: true,
        type: true,
        category: true,
        amount: true,
        description: true,
        date: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      records: records.map((r) => ({
        id: r.id,
        userId: r.userId,
        type: r.type,
        category: r.category,
        amount: r.amount,
        description: r.description,
        date: r.date.toISOString(),
        isActive: r.isActive,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        user: r.user,
      })),
    });
  } catch (error) {
    console.error('Error fetching finance records:', error);
    return NextResponse.json({ error: 'Gagal memuat data finansial' }, { status: 500 });
  }
}
