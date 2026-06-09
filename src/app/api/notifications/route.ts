import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════
   GET/PUT — User notifications
   ═══════════════════════════════════════════════════════════ */

// GET - List notifications for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      userId,
      deletedAt: null,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.notification.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Notifications] GET error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat notifikasi' },
      { status: 500 }
    );
  }
}

// PUT - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, markAll, userId } = body;

    if (markAll) {
      // Mark all notifications as read for user
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID wajib diisi untuk markAll' },
          { status: 400 }
        );
      }

      const result = await db.notification.updateMany({
        where: { userId, isRead: false, deletedAt: null },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true, data: { updated: result.count } });
    }

    // Mark specific notifications as read
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids atau markAll wajib diisi' },
        { status: 400 }
      );
    }

    const result = await db.notification.updateMany({
      where: { id: { in: ids }, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, data: { updated: result.count } });
  } catch (error) {
    console.error('[Notifications] PUT error:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate notifikasi' },
      { status: 500 }
    );
  }
}
