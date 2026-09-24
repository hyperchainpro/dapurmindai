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

/* == GET /api/admin/ai-agents/[id] ====================== */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;

    const agent = await db.aiAgent.findUnique({
      where: { id },
    });

    if (!agent) {
      return NextResponse.json({ error: 'AI agent tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ agent: serializeAgent(agent) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error fetching AI agent:', error);
    return NextResponse.json({ error: 'Gagal memuat AI agent' }, { status: 500 });
  }
}

/* == PUT /api/admin/ai-agents/[id] ====================== */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const body = await request.json();

    // Check agent exists
    const existing = await db.aiAgent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'AI agent tidak ditemukan' }, { status: 404 });
    }

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
      isActive,
    } = body;

    // If setting as default, unset all other defaults first
    if (isDefault === true) {
      await db.aiAgent.updateMany({
        where: { isDefault: true, deletedAt: null, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (provider !== undefined) updateData.provider = provider.trim();
    if (model !== undefined) updateData.model = model.trim();
    if (apiKey !== undefined) updateData.apiKey = apiKey || null;
    if (apiBaseUrl !== undefined) updateData.apiBaseUrl = apiBaseUrl?.trim() || null;
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens;
    if (description !== undefined) updateData.description = description?.trim() || '';
    if (purpose !== undefined) updateData.purpose = purpose?.trim() || 'all';
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;

    const agent = await db.aiAgent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ agent: serializeAgent(agent) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error updating AI agent:', error);
    return NextResponse.json({ error: 'Gagal mengupdate AI agent' }, { status: 500 });
  }
}

/* == PATCH /api/admin/ai-agents/[id] ==================== */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;
    const body = await request.json();
    const { isDefault, isActive } = body;

    const existing = await db.aiAgent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'AI agent tidak ditemukan' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Set as default
    if (isDefault === true) {
      await db.aiAgent.updateMany({
        where: { isDefault: true, deletedAt: null, NOT: { id } },
        data: { isDefault: false },
      });
      updateData.isDefault = true;
    }

    // Toggle isActive
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update. Provide isDefault or isActive.' },
        { status: 400 }
      );
    }

    const agent = await db.aiAgent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ agent: serializeAgent(agent) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error patching AI agent:', error);
    return NextResponse.json({ error: 'Gagal mengupdate AI agent' }, { status: 500 });
  }
}

/* == DELETE /api/admin/ai-agents/[id] — Soft delete ==== */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;

    const agent = await db.aiAgent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isDefault: false, // Can't be default if deleted
      },
    });

    return NextResponse.json({ agent: serializeAgent(agent) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error soft-deleting AI agent:', error);
    return NextResponse.json({ error: 'Gagal menghapus AI agent' }, { status: 500 });
  }
}
