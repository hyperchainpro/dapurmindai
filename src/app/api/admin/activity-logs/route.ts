import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, logActivity, AuthError } from '@/lib/auth-server';

/* ═══════════════════════════════════════════════════════════
   GET /api/admin/activity-logs — List activity logs (admin only)
   Query params: page, limit, userId, action, startDate, endDate
   ═══════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const userId = searchParams.get('userId') || '';
    const action = searchParams.get('action') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true, name: true, avatar: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.activityLog.count({ where }),
    ]);

    await logActivity(auth.userId, 'admin.list_activity_logs', 'ActivityLog', `Listed activity logs (page ${page})`, request);

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Activity Logs] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}