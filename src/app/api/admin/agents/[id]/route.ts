import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/* ═══════════════════════════════════════════════════════════
   AI Agent Management API — Single Agent Operations
   ═══════════════════════════════════════════════════════════ */

// GET /api/admin/agents/[id] — Get single agent
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const agent = await client.query(api.agents.get, { id: id as Id<"aiAgents"> });

    if (!agent || agent.deletedAt) {
      return NextResponse.json({ success: false, error: 'Agent tidak ditemukan' }, { status: 404 });
    }

    // Mask apiKey for security
    const maskedAgent = {
      ...agent,
      apiKey: agent.apiKey && agent.apiKey.length > 8
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

    const agent = await client.mutation(api.agents.update, {
      id: id as Id<"aiAgents">,
      ...body,
      // override empty string apiKey/apiBaseUrl to undefined so convex handles it correctly
      apiKey: body.apiKey === "" ? undefined : body.apiKey,
      apiBaseUrl: body.apiBaseUrl === "" ? undefined : body.apiBaseUrl,
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

    await client.mutation(api.agents.remove, { id: id as Id<"aiAgents"> });

    return NextResponse.json({ success: true, message: 'Agent berhasil dihapus' });
  } catch (error) {
    console.error('[AdminAgents DELETE]', error);
    return NextResponse.json({ success: false, error: 'Gagal menghapus agent' }, { status: 500 });
  }
}
