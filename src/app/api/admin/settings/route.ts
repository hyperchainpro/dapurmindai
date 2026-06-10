import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper to extract token
function getToken(request: NextRequest): string {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey) return adminKey;
  
  return "dapurmind-admin-key-2025"; // fallback
}

/* ═══════════════════════════════════════════════════════════
   GET /api/admin/settings — List all system settings (admin only)
   ═══════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group') || '';

    let settings = await client.query(api.admin.getSettings, { token });
    
    if (group) {
      settings = settings.filter((s: any) => s.group === group);
    }

    // Convert to key-value object for convenience
    const settingsMap: Record<string, { value: string; type: string; group: string; isPublic: boolean }> = {};
    for (const s of settings) {
      settingsMap[s.key] = { value: s.value, type: s.type, group: s.group, isPublic: s.isPublic };
    }

    return NextResponse.json({ success: true, data: settings, map: settingsMap });
  } catch (error: any) {
    console.error('[Admin Settings GET] Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════
   PUT /api/admin/settings — Update settings (admin only)
   Body: { settings: { key: value, ... } }
   ═══════════════════════════════════════════════════════════ */

export async function PUT(request: NextRequest) {
  try {
    const token = getToken(request);
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Format settings tidak valid' }, { status: 400 });
    }

    const updatedSettings = [];

    for (const [key, value] of Object.entries(settings)) {
      const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      await client.mutation(api.admin.updateSetting, {
        token,
        key,
        value: settingValue,
        type: typeof value === 'object' ? 'json' : typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
      });

      updatedSettings.push({ key, value: settingValue });
    }

    return NextResponse.json({ success: true, data: updatedSettings });
  } catch (error: any) {
    console.error('[Admin Settings PUT] Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════
   POST /api/admin/settings — Create a single setting
   ═══════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);
    const body = await request.json();
    const { key, value, type, group, isPublic } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key wajib diisi' }, { status: 400 });
    }

    await client.mutation(api.admin.updateSetting, {
      token,
      key,
      value: value ?? '',
      type: type || 'string',
      group: group || 'general',
      isPublic: isPublic ?? false,
    });

    return NextResponse.json({ success: true, data: { key, value } });
  } catch (error: any) {
    console.error('[Admin Settings POST] Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}