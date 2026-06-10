import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { requireAdmin, logActivity, AuthError } from '@/lib/auth-server';

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

// Helper to format alert
function formatAlert(a: any) {
  if (!a) return null;
  return {
    ...a,
    id: a._id,
    createdAt: new Date(a._creationTime).toISOString(),
    triggeredAt: a.triggeredAt ? new Date(a.triggeredAt).toISOString() : null,
    resolvedAt: a.resolvedAt ? new Date(a.resolvedAt).toISOString() : null,
  };
}

/* ═══════════════════════════════════════════════════════════
   GET/POST/PUT — AI Token Alerts management (admin only)
   ═══════════════════════════════════════════════════════════ */

// GET - List alerts (optional ?active=true filter)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active');

    const token = getToken(request);
    const alerts = await client.query(api.admin.listTokenAlerts, {
      token,
      active: activeOnly === 'true' ? true : undefined,
    });

    const formatted = alerts.map((a: any) => formatAlert(a));

    await logActivity(auth.userId, 'admin.view_ai_alerts', 'AI Alerts', 'Viewed AI token alerts', request);

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('[AI Alerts] GET error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Gagal memuat alert token AI' },
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

    const token = getToken(request);
    const alert = await client.mutation(api.admin.createTokenAlert, {
      token,
      agentId: agentId ? (agentId as Id<"aiAgents">) : undefined,
      thresholdType,
      thresholdValue,
      message: message || `Alert: ${thresholdType} exceeds ${thresholdValue}`,
    });

    if (alert === null || alert === undefined) {
      return NextResponse.json({ error: 'Gagal membuat alert' }, { status: 500 });
    }

    const alertId = alert._id;
    await logActivity(auth.userId, 'admin.create_ai_alert', 'AI Alerts', `Created alert: ${alertId}`, request);

    return NextResponse.json({ success: true, data: formatAlert(alert) }, { status: 201 });
  } catch (error: any) {
    console.error('[AI Alerts] POST error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Gagal membuat alert token AI' },
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

    const token = getToken(request);
    const updated = await client.mutation(api.admin.resolveTokenAlert, {
      token,
      alertId: id as Id<"aiTokenAlerts">,
      resolvedAt: resolvedAt ? new Date(resolvedAt).getTime() : undefined,
    });

    await logActivity(auth.userId, 'admin.resolve_ai_alert', 'AI Alerts', `Resolved alert: ${id}`, request);

    return NextResponse.json({ success: true, data: formatAlert(updated) });
  } catch (error: any) {
    console.error('[AI Alerts] PUT error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Gagal mengupdate alert token AI' },
      { status: 500 }
    );
  }
}
