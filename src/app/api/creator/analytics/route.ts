import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/* ═══════════════════════════════════════════════════════════
   GET /api/creator/analytics — Creator dashboard analytics
   Query: userId (required)
   ═══════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    const analytics = await client.query(api.creator.getCreatorAnalytics, {
      userId: userId as Id<"users">,
    });

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error('[Creator Analytics] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat analytics creator' },
      { status: 500 }
    );
  }
}
