import { NextRequest, NextResponse } from 'next/server';
import { convexFetch } from '@/lib/convex-server';

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/logout
   ═══════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    // Proxy request to Convex HTTP Action
    await convexFetch('/api/auth/logout', {
      method: 'POST',
      headers: authHeader ? { 'Authorization': authHeader } : {}
    });

    return NextResponse.json({ success: true, message: 'Logout berhasil' }, { status: 200 });
  } catch (error: any) {
    console.error('[Auth Logout] Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}