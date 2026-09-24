import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth-server';

/* == GET /api/admin/finance ============================ */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error fetching finance records:', error);
    return NextResponse.json({ error: 'Gagal memuat data finansial' }, { status: 500 });
  }
}
