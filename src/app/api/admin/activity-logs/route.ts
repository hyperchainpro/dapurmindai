import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/convex';
import { api } from '../../../../../convex/_generated/api';
import { requireAdmin } from '@/lib/auth-server';

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

    let token = "dapurmind-admin-key-2025";
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (request.headers.get('x-admin-key')) {
      token = request.headers.get('x-admin-key')!;
    }

    const allLogs = await client.query(api.admin.getActivityLogs, {
      token,
      userId: userId || undefined,
      action: action || undefined,
    });

    const total = allLogs.length;
    const start = (page - 1) * limit;
    const logs = allLogs.slice(start, start + limit);

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
  } catch (error: any) {
    console.error('[Admin Activity Logs] Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}