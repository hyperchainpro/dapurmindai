import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/* ═══════════════════════════════════════════════════════════
   AI Agent Management API
   CRUD operations for managing custom AI agents
   ═══════════════════════════════════════════════════════════ */

// GET /api/admin/agents — List all agents
export async function GET() {
  try {
    const agents = await client.query(api.agents.list);
    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error('[AdminAgents GET]', error);
    return NextResponse.json({ success: false, error: 'Gagal mengambil data agent' }, { status: 500 });
  }
}

// POST /api/admin/agents — Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, provider, model, apiKey, apiBaseUrl, maxTokens, description, purpose, isDefault, isActive } = body;

    if (!name || !provider || !model) {
      return NextResponse.json({ success: false, error: 'Name, provider, dan model wajib diisi' }, { status: 400 });
    }

    const validProviders = ['built-in', 'openai', 'groq', 'deepseek', 'mistral', 'openrouter', 'anthropic', 'google'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json({ success: false, error: `Provider tidak valid. Pilihan: ${validProviders.join(', ')}` }, { status: 400 });
    }

    const finalPurpose = purpose || 'all';

    const agent = await client.mutation(api.agents.create, {
      name,
      provider,
      model,
      apiKey: apiKey || undefined,
      apiBaseUrl: apiBaseUrl || undefined,
      maxTokens: maxTokens || 2000,
      description: description || '',
      purpose: finalPurpose,
      isDefault: isDefault || false,
      isActive: isActive !== false,
    });

    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error('[AdminAgents POST]', error);
    return NextResponse.json({ success: false, error: 'Gagal membuat agent baru' }, { status: 500 });
  }
}
