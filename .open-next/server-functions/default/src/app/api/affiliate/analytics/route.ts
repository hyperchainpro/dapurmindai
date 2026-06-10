import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { AffiliateAnalytics } from '@/types';

// GET - Fetch analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d

    // Calculate time range using DateTime (PostgreSQL compatible)
    const now = new Date();
    const periodDays: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = periodDays[period] || 7;
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Fetch all data in parallel
    const [
      totalClicksResult,
      platformResult,
      contextResult,
      dayResults,
      topProductsResult,
      accountCount,
      linkCount,
      activePlatformsResult,
    ] = await Promise.all([
      // Total clicks in period
      db.clickLog.count({
        where: { clickedAt: { gte: since } },
      }),

      // Clicks by platform
      db.clickLog.groupBy({
        by: ['platform'],
        where: { clickedAt: { gte: since } },
        _count: true,
      }),

      // Clicks by context
      db.clickLog.groupBy({
        by: ['context'],
        where: { clickedAt: { gte: since } },
        _count: true,
      }),

      // Clicks by day (PostgreSQL syntax)
      db.$queryRaw<Array<{ day: string; count: bigint }>>`
        SELECT DATE(clicked_at) as day, COUNT(*)::bigint as count
        FROM click_logs
        WHERE clicked_at >= ${since}
        GROUP BY DATE(clicked_at)
        ORDER BY day DESC
      `,

      // Top products by clicks
      db.clickLog.groupBy({
        by: ['productLinkId'],
        where: { clickedAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Account count
      db.affiliateAccount.count({ where: { deletedAt: null } }),

      // Link count
      db.productLink.count({ where: { deletedAt: null } }),

      // Active platforms
      db.affiliateAccount.findMany({
        where: { isActive: true, deletedAt: null },
        select: { platform: true },
      }),
    ]);

    // Build clicks by platform map
    const clicksByPlatform: Record<string, number> = {};
    platformResult.forEach((r) => {
      clicksByPlatform[r.platform] = r._count;
    });

    // Build clicks by context map
    const clicksByContext: Record<string, number> = {};
    contextResult.forEach((r) => {
      clicksByContext[r.context] = r._count;
    });

    // Get product names for top products
    const topProductIds = topProductsResult.map((r) => r.productLinkId);
    const productLinks = topProductIds.length > 0
      ? await db.productLink.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, productName: true, platform: true },
        })
      : [];

    const productMap = new Map(productLinks.map((p) => [p.id, p]));
    const topProducts = topProductsResult.map((r) => {
      const p = productMap.get(r.productLinkId);
      return {
        productName: p?.productName || 'Unknown',
        platform: p?.platform || 'unknown',
        clicks: r._count.id,
      };
    });

    const analytics: AffiliateAnalytics = {
      totalClicks: totalClicksResult,
      clicksByPlatform,
      clicksByContext,
      clicksByDay: dayResults.map((d) => ({
        date: d.day,
        count: Number(d.count),
      })),
      topProducts,
      totalAffiliateAccounts: accountCount,
      totalProductLinks: linkCount,
      activePlatforms: activePlatformsResult.map((a) => a.platform),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Gagal memuat analitik' },
      { status: 500 }
    );
  }
}