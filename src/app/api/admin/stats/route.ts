import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, logActivity, AuthError } from '@/lib/auth-server';

/* ═══════════════════════════════════════════════════════════
   GET /api/admin/stats — Dashboard statistics (admin only)
   ═══════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date range
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [
      totalUsers,
      activeUsers,
      newUsersInPeriod,
      totalRecipes,
      publishedRecipes,
      newRecipesInPeriod,
      totalFinanceRecords,
      totalAffiliateAccounts,
      totalProductLinks,
      totalClicks,
      clicksInPeriod,
      totalAiAgents,
      aiTotalRequests,
      aiFailedRequests,
      aiTotalTokens,
      aiRequestsInPeriod,
      activeSessions,
      recentActivities,
    ] = await Promise.all([
      // Users
      db.user.count({ where: { deletedAt: null } }),
      db.user.count({ where: { deletedAt: null, isActive: true } }),
      db.user.count({ where: { deletedAt: null, createdAt: { gte: since } } }),

      // Recipes
      db.creatorRecipe.count({ where: { isActive: true } }),
      db.creatorRecipe.count({ where: { isActive: true, isPublished: true } }),
      db.creatorRecipe.count({ where: { isActive: true, createdAt: { gte: since } } }),

      // Finance
      db.financeRecord.count({ where: { isActive: true } }),

      // Affiliate
      db.affiliateAccount.count({ where: { isActive: true, deletedAt: null } }),
      db.productLink.count({ where: { isActive: true, deletedAt: null } }),
      db.clickLog.count(),
      db.clickLog.count({ where: { createdAt: { gte: since } } }),

      // AI Agents
      db.aiAgent.count({ where: { isActive: true, deletedAt: null } }),
      db.aiAgent.aggregate({ _sum: { totalRequests: true, failedRequests: true, usedTokens: true } }),
      db.aiAgentUsageLog.count({ where: { createdAt: { gte: since } } }),

      // Sessions
      db.session.count({ where: { expiresAt: { gte: new Date() } } }),

      // Recent activities (last 20)
      db.activityLog.findMany({
        take: 20,
        include: { user: { select: { username: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // User growth over time (last N days, grouped by day)
    const userGrowth = await db.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM users
      WHERE "deletedAt" IS NULL AND "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // AI requests per day
    const aiRequestsPerDay = await db.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
      FROM ai_agent_usage_logs
      WHERE "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Finance summary
    const financeSummary = await db.financeRecord.groupBy({
      by: ['type'],
      where: { isActive: true, createdAt: { gte: since } },
      _sum: { amount: true },
    });

    const incomeTotal = financeSummary.find(f => f.type === 'income')?._sum.amount || 0;
    const expenseTotal = financeSummary.find(f => f.type === 'expense')?._sum.amount || 0;

    await logActivity(auth.userId, 'admin.view_stats', 'Dashboard', `Viewed dashboard stats (${period})`, request);

    return NextResponse.json({
      success: true,
      data: {
        period: { days, since: since.toISOString() },
        users: {
          total: totalUsers,
          active: activeUsers,
          newInPeriod: newUsersInPeriod,
          growth: userGrowth.map(g => ({ date: String(g.date), count: Number(g.count) })),
        },
        recipes: {
          total: totalRecipes,
          published: publishedRecipes,
          newInPeriod: newRecipesInPeriod,
        },
        finance: {
          totalRecords: totalFinanceRecords,
          incomeInPeriod: incomeTotal,
          expenseInPeriod: expenseTotal,
          netInPeriod: incomeTotal - expenseTotal,
        },
        affiliate: {
          accounts: totalAffiliateAccounts,
          productLinks: totalProductLinks,
          totalClicks,
          clicksInPeriod,
        },
        ai: {
          agents: totalAiAgents,
          totalRequests: aiTotalRequests._sum.totalRequests || 0,
          failedRequests: aiTotalRequests._sum.failedRequests || 0,
          totalTokens: aiTotalRequests._sum.usedTokens || 0,
          requestsInPeriod: aiRequestsInPeriod,
          requestsPerDay: aiRequestsPerDay.map(r => ({ date: String(r.date), count: Number(r.count) })),
        },
        sessions: { active: activeSessions },
        recentActivities,
      },
    });
  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}