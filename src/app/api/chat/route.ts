import { NextRequest, NextResponse } from 'next/server';
import { getAIResponse, buildChatSystemPrompt } from '@/lib/ai';
import type { UserProfile } from '@/types';

interface ChatRequestBody {
  message: string;
  context?: {
    userProfile?: UserProfile;
    currentRecipeId?: string;
    conversationHistory?: Array<{ role: string; content: string }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { message, context } = body;

    // Validate required fields
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Pesan tidak boleh kosong.' },
        { status: 400 }
      );
    }

    // Limit message length to prevent abuse
    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Pesan terlalu panjang. Maksimal 2000 karakter.' },
        { status: 400 }
      );
    }

    // Build the system prompt with user context
    const systemPrompt = buildChatSystemPrompt({
      userProfile: context?.userProfile,
      currentRecipeId: context?.currentRecipeId,
      conversationHistory: context?.conversationHistory,
    });

    // Include recent conversation history in the user message if available
    let augmentedMessage = message;

    if (context?.conversationHistory && context.conversationHistory.length > 0) {
      // Only include the last 6 messages for context (3 exchanges)
      const recentHistory = context.conversationHistory.slice(-6);
      const historyText = recentHistory
        .map((msg) => `${msg.role === 'user' ? 'Pengguna' : 'Chef Mindi'}: ${msg.content}`)
        .join('\n');

      augmentedMessage = `[Riwayat Percakapan Sebelumnya]\n${historyText}\n\n[Pesan Terbaru Pengguna]: ${message}`;
    }

    // Get AI response
    const aiResponse = await getAIResponse(systemPrompt, augmentedMessage);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
