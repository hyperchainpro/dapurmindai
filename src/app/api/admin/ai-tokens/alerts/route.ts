import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, logActivity, AuthError } from '@/lib/auth-server';

/* ═══════════════════════════════════════════════════════════
   GET/POST/PUT — AI Token Alerts management (admin only)
   ═══════════════════════════════════════════════════════════ */

// GET - List alerts (optional ?active=true filter)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active');

    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (activeOnly === 'true') {
      where.isTriggered = true;
      where.resolvedAt = null;
    }

    const alerts = await db.aiTokenAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    await logActivity(auth.userId, 'admin.view_ai_alerts', 'AI Alerts', 'Viewed AI token alerts', request);

    return NextResponse.json({ success: true, data: alerts });
  } catch (error) {
    console.error('[AI Alerts] GET error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: 'Gagal memuat alert token AI' },
      { status: 500 }
    );
  }
}

// POST - Create new alert
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const body = await request.json();
    const { agentId, thresholdType, thresholdValue, message } = body;

    if (!thresholdType || thresholdValue === undefined) {
      return NextResponse.json(
        { error: 'thresholdType dan thresholdValue wajib diisi' },
        { status: 400 }
      );
    }

    const validTypes = ['total_tokens', 'daily_tokens', 'error_rate'];
    if (!validTypes.includes(thresholdType)) {
      return NextResponse.json(
        { error: `thresholdType harus salah satu dari: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (typeof thresholdValue !== 'number' || thresholdValue < 0) {
      return NextResponse.json(
        { error: 'thresholdValue harus berupa angka positif' },
        { status: 400 }
      );
    }

    const alert = await db.aiTokenAlert.create({
      data: {
        agentId: agentId || null,
        thresholdType,
        thresholdValue,
        message: message || `Alert: ${thresholdType} exceeds ${thresholdValue}`,
      },
    });

    await logActivity(auth.userId, 'admin.create_ai_alert', 'AI Alerts', `Created alert: ${alert.id}`, request);

    return NextResponse.json({ success: true, data: alert }, { status: 201 });
  } catch (error) {
    console.error('[AI Alerts] POST error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: 'Gagal membuat alert token AI' },
      { status: 500 }
    );
  }
}

// PUT - Resolve alert
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const body = await request.json();
    const { id, resolvedAt } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID alert wajib diisi' },
        { status: 400 }
      );
    }

    const existing = await db.aiTokenAlert.findFirst({
      where: { id, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Alert tidak ditemukan' },
        { status: 404 }
      );
    }

    const updated = await db.aiTokenAlert.update({
      where: { id },
      data: {
        resolvedAt: resolvedAt ? new Date(resolvedAt) : new Date(),
        isTriggered: false,
      },
    });

    await logActivity(auth.userId, 'admin.resolve_ai_alert', 'AI Alerts', `Resolved alert: ${id}`, request);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[AI Alerts] PUT error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: 'Gagal mengupdate alert token AI' },
      { status: 500 }
    );
  }
}
