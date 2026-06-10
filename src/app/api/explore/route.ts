import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/* ═══════════════════════════════════════════════════════════
   GET /api/explore — explore community recipes
   ═══════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const sort = searchParams.get('sort') || 'latest';
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const cursorNum = cursor ? Number(cursor) : undefined;

    const exploreData = await client.query(api.recipes.getExploreData, {
      category,
      sort,
      cursor: cursorNum,
      limit,
    });

    // Format nextCursor to ISO string if it's a number
    const formattedCursor = exploreData.nextCursor 
      ? new Date(exploreData.nextCursor).toISOString() 
      : null;

    return NextResponse.json({
      success: true,
      data: exploreData.data,
      nextCursor: formattedCursor,
      categoryStats: exploreData.categoryStats,
    });
  } catch (error: any) {
    console.error('Error fetching explore data:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat data explore' },
      { status: 500 }
    );
  }
}