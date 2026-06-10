import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
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

/* ═══════════════════════════════════════════════════════════
   GET /api/admin/ai-tokens — Comprehensive AI token monitoring (admin only)
   ═══════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const token = getToken(request);

    const stats = await client.query(api.admin.getAiTokenStats, { token });

    await logActivity(auth.userId, 'admin.view_ai_tokens', 'AI Tokens', 'Viewed AI token monitoring', request);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('[Admin AI Tokens] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error.message || 'Gagal memuat data token AI' },
      { status: 500 }
    );
  }
}
