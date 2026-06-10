import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
      return NextResponse.json(
        { error: 'Product link ID dan platform wajib diisi' },
        { status: 400 }
      );
    }

    const clickLog = await db.clickLog.create({
      data: {
        productLinkId,
        platform,
        userId: userId || null,
        context: context || 'unknown',
        clickedAt: Math.floor(Date.now() / 1000),
      },
    });

    return NextResponse.json({ success: true, clickId: clickLog.id });
  } catch (error) {
    console.error('Error logging click:', error);
    return NextResponse.json(
      { error: 'Gagal mencatat klik' },
      { status: 500 }
    );
  }
}

// GET - Get recent click logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const platform = searchParams.get('platform');

    const where = platform ? { platform } : {};

    const logs = await db.clickLog.findMany({
      where,
      orderBy: { clickedAt: 'desc' },
      take: limit,
      include: {
        productLink: {
          select: { productName: true, platform: true },
        },
      },
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        productLinkId: l.productLinkId,
        platform: l.platform,
        userId: l.userId,
        context: l.context,
        clickedAt: l.clickedAt,
        productName: l.productLink.productName,
      })),
    });
  } catch (error) {
    console.error('Error fetching click logs:', error);
    return NextResponse.json(
      { error: 'Gagal memuat log klik' },
      { status: 500 }
    );
  }
}
