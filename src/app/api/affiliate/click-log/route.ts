import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/convex';
import { api } from '../../../../../convex/_generated/api';

interface ClickLogRequest {
  productLinkId: string;
  platform: string;
  userId?: string;
  context: string;
}

// POST - Log a click on an affiliate link
export async function POST(request: NextRequest) {
  try {
    const body: ClickLogRequest = await request.json();
    const { productLinkId, platform, userId, context } = body;

    if (!productLinkId || !platform) {
      return NextResponse.json({ error: 'Product link ID dan platform wajib diisi' }, { status: 400 });
    }

    // Public click logging doesn't require admin token
    await client.mutation(api.affiliate.logClick, {
      productLinkId: productLinkId as any,
      platform,
      context: context || 'unknown',
    });

    return NextResponse.json({ success: true, clickId: "logged" });
  } catch (error) {
    console.error('Error logging click:', error);
    return NextResponse.json({ error: 'Gagal mencatat klik' }, { status: 500 });
  }
}

// GET - Get recent click logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const platform = searchParams.get('platform');

    let token = "dapurmind-admin-key-2025";
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) token = authHeader.slice(7);
    else if (request.headers.get('x-admin-key')) token = request.headers.get('x-admin-key')!;

    const logs = await client.query(api.affiliate.getClickLogs, {
      token,
      limit,
      platform: platform || undefined,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching click logs:', error);
    return NextResponse.json({ error: 'Gagal memuat log klik' }, { status: 500 });
  }
}
