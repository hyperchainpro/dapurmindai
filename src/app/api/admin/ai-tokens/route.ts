import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, logActivity, AuthError } from '@/lib/auth-server';

/* ═══════════════════════════════════════════════════════════
   GET /api/admin/ai-tokens — Comprehensive AI token monitoring (admin only)
   ═══════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);

    // Fetch all agents with usage stats
    const agents = await db.aiAgent.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    // Compute totals across all agents
    const totalUsedTokens = agents.reduce((sum, a) => sum + a.usedTokens, 0);
    const totalRequests = agents.reduce((sum, a) => sum + a.totalRequests, 0);
    const totalFailed = agents.reduce((sum, a) => sum + a.failedRequests, 0);

    // Average latency from usage logs (last 30 days)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const latencyResult = await db.aiAgentUsageLog.aggregate({
      where: { createdAt: { gte: since }, status: 'success' },
      _avg: { latencyMs: true },
    });
    const avgLatencyMs = Math.round(latencyResult._avg.latencyMs || 0);

    // Daily usage (last 30 days)
    const dailyUsage = await db.$queryRaw<Array<{ date: string; tokens: number; requests: number; errors: number }>>`
      SELECT
        DATE("createdAt") as date,
        COALESCE(SUM("inputTokens" + "outputTokens"), 0)::bigint as tokens,
        COUNT(*)::bigint as requests,
        COUNT(*) FILTER (WHERE "status" = 'error')::bigint as errors
      FROM ai_agent_usage_logs
      WHERE "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Usage by feature
    const usageByFeatureRaw = await db.$queryRaw<Array<{ feature: string; tokens: number; requests: number }>>`
      SELECT
        "feature",
        COALESCE(SUM("inputTokens" + "outputTokens"), 0)::bigint as tokens,
        COUNT(*)::bigint as requests
      FROM ai_agent_usage_logs
      WHERE "createdAt" >= ${since}
      GROUP BY "feature"
      ORDER BY tokens DESC
    `;

    const usageByFeature: Record<string, { tokens: number; requests: number }> = {};
    usageByFeatureRaw.forEach((item) => {
      usageByFeature[item.feature] = {
        tokens: Number(item.tokens),
        requests: Number(item.requests),
      };
    });

    // Active alerts (triggered and unresolved)
    const alerts = await db.aiTokenAlert.findMany({
      where: {
        isTriggered: true,
        resolvedAt: null,
      },
      orderBy: { triggeredAt: 'desc' },
    });

    // Top 10 users by token usage
    const topUsers = await db.$queryRaw<Array<{ userId: string; username: string; totalTokens: number; totalRequests: number }>>`
      SELECT
        u."id" as "userId",
        COALESCE(u."username", 'Unknown') as "username",
        COALESCE(SUM(l."inputTokens" + l."outputTokens"), 0)::bigint as "totalTokens",
        COUNT(*)::bigint as "totalRequests"
      FROM ai_agent_usage_logs l
      LEFT JOIN users u ON l."userId" = u."id"
      WHERE l."createdAt" >= ${since} AND l."userId" IS NOT NULL
      GROUP BY u."id", u."username"
      ORDER BY "totalTokens" DESC
      LIMIT 10
    `;

    // Format agent data
    const agentData = agents.map((a) => ({
      id: a.id,
      name: a.name,
      provider: a.provider,
      model: a.model,
      usedTokens: a.usedTokens,
      maxTokens: a.maxTokens,
      totalRequests: a.totalRequests,
      failedRequests: a.failedRequests,
      lastUsedAt: a.lastUsedAt,
      lastError: a.lastError,
      successRate: a.totalRequests > 0
        ? Math.round(((a.totalRequests - a.failedRequests) / a.totalRequests) * 10000) / 100
        : 100,
    }));

    await logActivity(auth.userId, 'admin.view_ai_tokens', 'AI Tokens', 'Viewed AI token monitoring', request);

    return NextResponse.json({
      success: true,
      data: {
        agents: agentData,
        totalUsedTokens,
        totalRequests,
        totalFailed,
        avgLatencyMs,
        dailyUsage: dailyUsage.map((d) => ({
          date: d.date,
          tokens: Number(d.tokens),
          requests: Number(d.requests),
          errors: Number(d.errors),
        })),
        usageByFeature,
        alerts,
        topUsers: topUsers.map((u) => ({
          userId: u.userId,
          username: u.username,
          totalTokens: Number(u.totalTokens),
          totalRequests: Number(u.totalRequests),
        })),
      },
    });
  } catch (error) {
    console.error('[Admin AI Tokens] Error:', error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: 'Gagal memuat data token AI' },
      { status: 500 }
    );
  }
}
