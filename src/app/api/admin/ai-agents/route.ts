import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth-server';

/* == Helper: serialize agent without sensitive fields ==== */
function serializeAgent(a: {
  id: string;
  name: string;
  provider: string;
  model: string;
  apiKey: string | null;
  apiBaseUrl: string | null;
  maxTokens: number;
  usedTokens: number;
  totalRequests: number;
  failedRequests: number;
  isActive: boolean;
  isDefault: boolean;
  description: string;
  purpose: string;
  lastUsedAt: Date | null;
  lastError: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: a.id,
    name: a.name,
    provider: a.provider,
    model: a.model,
    apiKeyMasked: a.apiKey ? `${a.apiKey.slice(0, 6)}...${a.apiKey.slice(-4)}` : null,
    apiBaseUrl: a.apiBaseUrl,
    maxTokens: a.maxTokens,
    usedTokens: a.usedTokens,
    totalRequests: a.totalRequests,
    failedRequests: a.failedRequests,
    isActive: a.isActive,
    isDefault: a.isDefault,
    description: a.description,
    purpose: a.purpose,
    lastUsedAt: a.lastUsedAt?.toISOString() ?? null,
    lastError: a.lastError,
    deletedAt: a.deletedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

/* == GET /api/admin/ai-agents ========================== */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const provider = searchParams.get('provider') || '';
    const purpose = searchParams.get('purpose') || '';

    const where: Record<string, unknown> = { deletedAt: null };

    const and: Record<string, unknown>[] = [{ deletedAt: null }];

    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (provider) {
      and.push({ provider });
    }

    if (purpose) {
      and.push({ purpose });
    }

    const agents = await db.aiAgent.findMany({
      where: { AND: and },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ agents: agents.map(serializeAgent) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error fetching AI agents:', error);
    return NextResponse.json({ error: 'Gagal memuat AI agents' }, { status: 500 });
  }
}

/* == POST /api/admin/ai-agents ========================== */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const {
      name,
      provider,
      model,
      apiKey,
      apiBaseUrl,
      maxTokens,
      description,
      purpose,
      isDefault,
    } = body;

    if (!name || !provider || !model) {
      return NextResponse.json(
        { error: 'Name, provider, and model are required' },
        { status: 400 }
      );
    }

    // If setting as default, unset all other defaults first
    if (isDefault) {
      await db.aiAgent.updateMany({
        where: { isDefault: true, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const agent = await db.aiAgent.create({
      data: {
        name: name.trim(),
        provider: provider.trim(),
        model: model.trim(),
        apiKey: apiKey || null,
        apiBaseUrl: apiBaseUrl?.trim() || null,
        maxTokens: maxTokens ?? 1000000,
        description: description?.trim() || '',
        purpose: purpose?.trim() || 'all',
        isDefault: isDefault ?? false,
      },
    });

    return NextResponse.json({ agent: serializeAgent(agent) }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error creating AI agent:', error);
    return NextResponse.json({ error: 'Gagal membuat AI agent' }, { status: 500 });
  }
}
