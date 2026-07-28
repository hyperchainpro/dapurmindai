import { NextRequest, NextResponse } from 'next/server';
import { client } from "@/lib/convex";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { requireAdmin, logActivity, AuthError } from '@/lib/auth-server';

// Helper to extract token
function getToken(request: NextRequest): string {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey) return adminKey;
  
  return "dapurmind-admin-key-2025";
}

/* ═══════════════════════════════════════════════════════════
   GET/POST — Admin notifications management
   ═══════════════════════════════════════════════════════════ */

// GET - All notifications (admin view with pagination, filters)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const category = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const token = getToken(request);

    const notifications = await client.query(api.admin.listNotifications, {
      token,
      userId,
      category,
      limit,
    });

    const formatted = notifications.map((n: any) => ({
      ...n,
      id: n._id,
      createdAt: new Date(n._creationTime).toISOString(),
    }));

    await logActivity(auth.userId, 'admin.view_notifications', 'Notifications', 'Viewed all notifications', request);

    return NextResponse.json({
      success: true,
      data: formatted,
      total: formatted.length,
      limit,
      offset: 0,
    });
  } catch (error: any) {
    console.error('[Admin Notifications] GET error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Gagal memuat notifikasi' },
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

    const token = getToken(request);
    const userIds = Array.isArray(userId) ? userId : [userId];

    let sentCount = 0;
    for (const uid of userIds) {
      try {
        await client.mutation(api.admin.sendNotification, {
          token,
          userId: uid as Id<"users">,
          title,
          message,
          type: type || 'info',
          category: category || 'general',
          link: link || undefined,
        });
        sentCount++;
      } catch (e) {
        console.warn(`Failed to send notification to user ${uid}:`, e);
      }
    }

    await logActivity(
      auth.userId,
      'admin.send_notification',
      'Notifications',
      `Sent notification "${title}" to ${sentCount} user(s)`,
      request
    );

    return NextResponse.json(
      { success: true, data: { sent: sentCount } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Admin Notifications] POST error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Gagal mengirim notifikasi' },
      { status: 500 }
    );
  }
}
