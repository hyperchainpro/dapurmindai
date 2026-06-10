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
   GET /api/admin/stats — Dashboard statistics (admin only)
   ═══════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate days
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

    const stats = await client.query(api.admin.getDashboardStats, { token, days });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}