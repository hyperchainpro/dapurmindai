import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth-server';

/* == Helper: serialize usage log ======================= */
function serializeUsageLog(l: {
  id: string;
  agentId: string;
  userId: string | null;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  status: string;
  errorMsg: string | null;
  createdAt: Date;
}) {
  return {
    id: l.id,
    agentId: l.agentId,
    userId: l.userId,
    feature: l.feature,
    inputTokens: l.inputTokens,
    outputTokens: l.outputTokens,
    totalTokens: l.inputTokens + l.outputTokens,
    latencyMs: l.latencyMs,
    status: l.status,
    errorMsg: l.errorMsg,
    createdAt: l.createdAt.toISOString(),
  };
}

/* == GET /api/admin/ai-agents/[id]/usage =============== */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    const feature = searchParams.get('feature') || '';

    // Verify agent exists
    const agent = await db.aiAgent.findUnique({ where: { id } });
    if (!agent) {
      return NextResponse.json({ error: 'AI agent tidak ditemukan' }, { status: 404 });
    }

    const where: Record<string, unknown> = { agentId: id };
    if (feature) {
      where.feature = feature;
    }

    const [logs, total] = await Promise.all([
      db.aiAgentUsageLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.aiAgentUsageLog.count({ where }),
    ]);

    return NextResponse.json({
      usageLogs: logs.map(serializeUsageLog),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error fetching AI agent usage logs:', error);
    return NextResponse.json(
      { error: 'Gagal memuat usage logs' },
      { status: 500 }
    );
  }
}
