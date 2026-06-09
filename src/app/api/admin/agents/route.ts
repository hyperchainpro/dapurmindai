import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════
   AI Agent Management API
   CRUD operations for managing custom AI agents
   ═══════════════════════════════════════════════════════════ */

// GET /api/admin/agents — List all agents
export async function GET() {
  try {
    const agents = await db.aiAgent.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        provider: true,
        model: true,
        apiBaseUrl: true,
        maxTokens: true,
        usedTokens: true,
        totalRequests: true,
        failedRequests: true,
        isActive: true,
        isDefault: true,
        description: true,
        purpose: true,
        lastUsedAt: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
        // Do NOT expose apiKey in list
      },
    });

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

    const validPurposes = ['all', 'chat', 'meal-plan', 'zero-waste'];
    const finalPurpose = purpose && validPurposes.includes(purpose) ? purpose : 'all';

    // If setting as default, unset other defaults for same purpose
    if (isDefault) {
      await db.aiAgent.updateMany({
        where: {
          purpose: finalPurpose,
          isDefault: true,
          deletedAt: null,
        },
        data: { isDefault: false },
      });
    }

    const agent = await db.aiAgent.create({
      data: {
        name,
        provider,
        model,
        apiKey: apiKey || null,
        apiBaseUrl: apiBaseUrl || null,
        maxTokens: maxTokens || 2000,
        description: description || '',
        purpose: finalPurpose,
        isDefault: isDefault || false,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error('[AdminAgents POST]', error);
    return NextResponse.json({ success: false, error: 'Gagal membuat agent baru' }, { status: 500 });
  }
}
