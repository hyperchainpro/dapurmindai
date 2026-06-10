import { NextRequest, NextResponse } from 'next/server';
import { convexFetch } from '@/lib/convex-server';

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/register
   ═══════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy request to Convex HTTP Action
    const result = await convexFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json(
      {
        message: 'Registrasi berhasil',
        ...result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[Auth Register] Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server' }, { status: 400 });
  }
}