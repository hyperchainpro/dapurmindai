import { NextRequest, NextResponse } from 'next/server';
import { convexFetch } from '@/lib/convex-server';

/* ═══════════════════════════════════════════════════════════
   GET /api/auth/me
   ═══════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    // Proxy request to Convex HTTP Action
    const result = await convexFetch('/api/auth/me', {
      method: 'GET',
      headers: authHeader ? { 'Authorization': authHeader } : {}
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[Auth Me] Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 401 });
  }
}