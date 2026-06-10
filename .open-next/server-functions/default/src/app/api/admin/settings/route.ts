import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, logActivity, AuthError } from '@/lib/auth-server';

/* ═══════════════════════════════════════════════════════════
   GET /api/admin/settings — List all system settings (admin only)
   ═══════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group') || '';

    const where: Record<string, unknown> = {};
    if (group) where.group = group;

    const settings = await db.systemSetting.findMany({
      where,
      orderBy: { group: 'asc' },
    });

    await logActivity(auth.userId, 'admin.list_settings', 'SystemSetting', 'Listed system settings', request);

    // Convert to key-value object for convenience
    const settingsMap: Record<string, { value: string; type: string; group: string; isPublic: boolean }> = {};
    for (const s of settings) {
      settingsMap[s.key] = { value: s.value, type: s.type, group: s.group, isPublic: s.isPublic };
    }

    return NextResponse.json({ success: true, data: settings, map: settingsMap });
  } catch (error) {
    console.error('[Admin Settings GET] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════
   PUT /api/admin/settings — Update settings (admin only)
   Body: { settings: { key: value, ... } }
   ═══════════════════════════════════════════════════════════ */

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Format settings tidak valid' }, { status: 400 });
    }

    const updatedSettings = [];

    for (const [key, value] of Object.entries(settings)) {
      const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      const upserted = await db.systemSetting.upsert({
        where: { key },
        update: { value: settingValue },
        create: {
          key,
          value: settingValue,
          type: typeof value === 'object' ? 'json' : typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
        },
      });

      updatedSettings.push(upserted);
    }

    await logActivity(auth.userId, 'admin.update_settings', 'SystemSetting', `Updated ${updatedSettings.length} settings`, request);

    return NextResponse.json({ success: true, data: updatedSettings });
  } catch (error) {
    console.error('[Admin Settings PUT] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════
   POST /api/admin/settings — Create a single setting
   ═══════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const body = await request.json();
    const { key, value, type, group, isPublic } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key wajib diisi' }, { status: 400 });
    }

    const setting = await db.systemSetting.upsert({
      where: { key },
      update: {
        value: value ?? '',
        type: type || 'string',
        group: group || 'general',
        isPublic: isPublic ?? false,
      },
      create: {
        key,
        value: value ?? '',
        type: type || 'string',
        group: group || 'general',
        isPublic: isPublic ?? false,
      },
    });

    await logActivity(auth.userId, 'admin.set_setting', 'SystemSetting', `Set ${key} = ${value}`, request);

    return NextResponse.json({ success: true, data: setting });
  } catch (error) {
    console.error('[Admin Settings POST] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}