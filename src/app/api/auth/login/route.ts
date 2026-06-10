import { NextRequest, NextResponse } from 'next/server';
import { convexFetch } from '@/lib/convex-client';

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/login
   ═══════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy request to Convex HTTP Action
    const result = await convexFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'User-Agent': request.headers.get('User-Agent') || '',
        'X-Forwarded-For': request.headers.get('X-Forwarded-For') || '',
      }
    });

    return NextResponse.json(
      {
        message: 'Login berhasil',
        ...result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Auth Login] Error:', error);
    return NextResponse.json({ error: error.message || 'Email atau password salah' }, { status: 401 });
  }
}