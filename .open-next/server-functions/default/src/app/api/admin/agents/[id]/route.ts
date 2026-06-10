import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════
   AI Agent Management API — Single Agent Operations
   ═══════════════════════════════════════════════════════════ */

// GET /api/admin/agents/[id] — Get single agent (includes apiKey masked)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await db.aiAgent.findUnique({
      where: { id, deletedAt: null },
    });

    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent tidak ditemukan' }, { status: 404 });
    }

    // Mask apiKey for security
    const maskedAgent = {
      ...agent,
      apiKey: agent.apiKey
        ? agent.apiKey.substring(0, 8) + '...' + agent.apiKey.substring(agent.apiKey.length - 4)
        : null,
    };

    return NextResponse.json({ success: true, agent: maskedAgent });
  } catch (error) {
    console.error('[AdminAgents GET id]', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data agent' }, { status: 500 });
  }
}

// PUT /api/admin/agents/[id] — Update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, provider, model, apiKey, apiBaseUrl, maxTokens, description, purpose, isDefault, isActive } = body;

    // Check if agent exists
    const existing = await db.aiAgent.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ success: false, error: 'Agent tidak ditemukan' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (provider !== undefined) updateData.provider = provider;
    if (model !== undefined) updateData.model = model;
    if (apiKey !== undefined) updateData.apiKey = apiKey || null;
    if (apiBaseUrl !== undefined) updateData.apiBaseUrl = apiBaseUrl || null;
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens;
    if (description !== undefined) updateData.description = description;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (isActive !== undefined) updateData.isActive = isActive;

    // If setting as default, unset other defaults
    if (isDefault) {
      const targetPurpose = purpose || existing.purpose;
      await db.aiAgent.updateMany({
        where: {
          purpose: targetPurpose,
          isDefault: true,
          deletedAt: null,
          id: { not: id },
        },
        data: { isDefault: false },
      });
      updateData.isDefault = true;
    }

    const agent = await db.aiAgent.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error('[AdminAgents PUT]', error);
    return NextResponse.json({ success: false, error: 'Gagal mengupdate agent' }, { status: 500 });
  }
}

// DELETE /api/admin/agents/[id] — Soft delete agent
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.aiAgent.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ success: false, error: 'Agent tidak ditemukan' }, { status: 404 });
    }

    await db.aiAgent.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, isDefault: false },
    });

    return NextResponse.json({ success: true, message: 'Agent berhasil dihapus' });
  } catch (error) {
    console.error('[AdminAgents DELETE]', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus agent' }, { status: 500 });
  }
}
