import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/* ═══════════════════════════════════════════════════════════
   GET/PUT — User notifications
   ═══════════════════════════════════════════════════════════ */

// GET - List notifications for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const authHeader = request.headers.get('authorization');
    let token = '';
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const notifications = await client.query(api.notifications.getUserNotifications, {
      token,
      unreadOnly,
      limit,
    });

    // Format _id to id
    const formatted = notifications.map((n: any) => ({
      ...n,
      id: n._id,
      createdAt: new Date(n._creationTime).toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('[Notifications] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat notifikasi' },
      { status: 500 }
    );
  }
}

// PUT - Mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let token = '';
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const body = await request.json();
    const { ids, markAll } = body;

    if (markAll) {
      const result = await client.mutation(api.notifications.markAllAsRead, { token });
      return NextResponse.json({ success: true, data: { updated: result.count } });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'ids atau markAll wajib diisi' },
        { status: 400 }
      );
    }

    // Mark each specific notification as read
    let updatedCount = 0;
    for (const id of ids) {
      try {
        await client.mutation(api.notifications.markAsRead, {
          token,
          notificationId: id as Id<"notifications">,
        });
        updatedCount++;
      } catch (e) {
        console.warn(`Failed to mark notification ${id} as read:`, e);
      }
    }

    return NextResponse.json({ success: true, data: { updated: updatedCount } });
  } catch (error: any) {
    console.error('[Notifications] PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengupdate notifikasi' },
      { status: 500 }
    );
  }
}
