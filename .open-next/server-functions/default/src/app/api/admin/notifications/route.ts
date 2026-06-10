import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, logActivity, AuthError } from '@/lib/auth-server';

/* ═══════════════════════════════════════════════════════════
   GET/POST — Admin notifications management
   ═══════════════════════════════════════════════════════════ */

// GET - All notifications (admin view with pagination, filters)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (userId) where.userId = userId;
    if (category) where.category = category;

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, username: true, name: true },
          },
        },
      }),
      db.notification.count({ where }),
    ]);

    await logActivity(auth.userId, 'admin.view_notifications', 'Notifications', 'Viewed all notifications', request);

    return NextResponse.json({
      success: true,
      data: notifications,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Admin Notifications] GET error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: 'Gagal memuat notifikasi' },
      { status: 500 }
    );
  }
}

// POST - Send notification to user(s)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const body = await request.json();
    const { userId, title, message, type, category, link } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'User ID, judul, dan pesan wajib diisi' },
        { status: 400 }
      );
    }

    const validTypes = ['info', 'warning', 'success', 'error'];
    const validCategories = ['general', 'finance', 'creator', 'ai', 'system'];

    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Tipe harus salah satu dari: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Kategori harus salah satu dari: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Support sending to multiple users
    const userIds = Array.isArray(userId) ? userId : [userId];

    const notifications = await db.notification.createMany({
      data: userIds.map((uid: string) => ({
        userId: uid,
        title,
        message,
        type: type || 'info',
        category: category || 'general',
        link: link || null,
      })),
    });

    await logActivity(
      auth.userId,
      'admin.send_notification',
      'Notifications',
      `Sent notification "${title}" to ${userIds.length} user(s)`,
      request
    );

    return NextResponse.json(
      { success: true, data: { sent: notifications.count } },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Admin Notifications] POST error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: 'Gagal mengirim notifikasi' },
      { status: 500 }
    );
  }
}
