import ZAI from 'z-ai-web-dev-sdk';
import type { UserProfile } from '@/types';
import { recipes } from './recipes';
import { db } from './db';

/* ── Types ─────────────────────────────────────────────────── */

interface AgentConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  apiKey?: string | null;
  apiBaseUrl?: string | null;
}

interface AiUsageResult {
  response: string;
  agentId: string;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
}

/* ── Agent Selection ──────────────────────────────────────── */

async function getActiveAgent(purpose: string = 'chat'): Promise<AgentConfig | null> {
  try {
    // Find the default active agent first
    let agent = await db.aiAgent.findFirst({
      where: {
        isActive: true,
        isDefault: true,
        deletedAt: null,
        purpose: { in: ['all', purpose] },
      },
    });

    // If no default, find any active agent matching purpose
    if (!agent) {
      agent = await db.aiAgent.findFirst({
        where: {
          isActive: true,
          deletedAt: null,
          purpose: { in: ['all', purpose] },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!agent) return null;

    return {
      id: agent.id,
      name: agent.name,
      provider: agent.provider,
      model: agent.model,
      apiKey: agent.apiKey,
      apiBaseUrl: agent.apiBaseUrl,
    };
  } catch (error) {
    console.error('[AI] Error fetching agent config:', error);
    return null;
  }
}

/* ── Usage Logging ──────────────────────────────────────── */

async function logUsage(
  agentId: string,
  feature: string,
  status: 'success' | 'error' | 'rate_limited',
  inputTokens: number,
  outputTokens: number,
  latencyMs: number,
  errorMsg?: string,
  userId?: string,
) {
  try {
    await db.aiAgentUsageLog.create({
      data: {
        agentId,
        feature,
        status,
        inputTokens,
        outputTokens,
        latencyMs,
        errorMsg,
        userId,
      },
    });

    // Update agent stats
    const updateData: Record<string, unknown> = {
      totalRequests: { increment: 1 },
      usedTokens: { increment: inputTokens + outputTokens },
      lastUsedAt: new Date(),
    };

    if (status === 'error') {
      updateData.failedRequests = { increment: 1 };
      updateData.lastError = errorMsg || 'Unknown error';
    }

    await db.aiAgent.update({
      where: { id: agentId },
      data: updateData,
    });
  } catch (error) {
    console.error('[AI] Error logging usage:', error);
  }
}

/* ── Built-in Agent (z-ai-web-dev-sdk) ───────────────────── */

async function callBuiltinAgent(
  systemPrompt: string,
  userMessage: string,
  temperature: number = 0.7,
  maxTokens: number = 2000,
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  const content = completion.choices[0]?.message?.content || '';
  // z-ai-web-dev-sdk may not return token counts, estimate
  const inputTokens = Math.ceil(systemPrompt.length / 4) + Math.ceil(userMessage.length / 4);
  const outputTokens = Math.ceil(content.length / 4);

  return { content, inputTokens, outputTokens };
}

/* ── OpenAI-compatible Agent (Anthropic via proxy, OpenAI, Groq, DeepSeek, Mistral, OpenRouter) ───────── */

async function callOpenAICompatible(
  agent: AgentConfig,
  systemPrompt: string,
  userMessage: string,
  temperature: number = 0.7,
  maxTokens: number = 2000,
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const baseUrl = agent.apiBaseUrl || getDefaultBaseUrl(agent.provider);
  const apiKey = agent.apiKey!;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: agent.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const inputTokens = data.usage?.prompt_tokens || Math.ceil((systemPrompt.length + userMessage.length) / 4);
  const outputTokens = data.usage?.completion_tokens || Math.ceil(content.length / 4);

  return { content, inputTokens, outputTokens };
}

/* ── Google Gemini Agent ────────────────────────────────── */

async function callGoogleGemini(
  agent: AgentConfig,
  systemPrompt: string,
  userMessage: string,
  temperature: number = 0.7,
  maxTokens: number = 2000,
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const apiKey = agent.apiKey!;
  const baseUrl = agent.apiBaseUrl || 'https://generativelanguage.googleapis.com/v1beta';

  const response = await fetch(
    `${baseUrl}/models/${agent.model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const inputTokens = data.usageMetadata?.promptTokenCount || Math.ceil((systemPrompt.length + userMessage.length) / 4);
  const outputTokens = data.usageMetadata?.candidatesTokenCount || Math.ceil(content.length / 4);

  return { content, inputTokens, outputTokens };
}

/* ── Anthropic Claude Agent ──────────────────────────────── */

async function callAnthropic(
  agent: AgentConfig,
  systemPrompt: string,
  userMessage: string,
  temperature: number = 0.7,
  maxTokens: number = 2000,
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const apiKey = agent.apiKey!;
  const baseUrl = agent.apiBaseUrl || 'https://api.anthropic.com';

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: agent.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';
  const inputTokens = data.usage?.input_tokens || Math.ceil((systemPrompt.length + userMessage.length) / 4);
  const outputTokens = data.usage?.output_tokens || Math.ceil(content.length / 4);

  return { content, inputTokens, outputTokens };
}

/* ── Default Base URLs ────────────────────────────────────── */

function getDefaultBaseUrl(provider: string): string {
  const urls: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    groq: 'https://api.groq.com/openai/v1',
    deepseek: 'https://api.deepseek.com/v1',
    mistral: 'https://api.mistral.ai/v1',
    openrouter: 'https://openrouter.ai/api/v1',
  };
  return urls[provider] || 'https://api.openai.com/v1';
}

/* ── Core AI Call Function ──────────────────────────────── */

async function callAgent(
  systemPrompt: string,
  userMessage: string,
  purpose: string = 'chat',
  temperature: number = 0.7,
  maxTokens: number = 2000,
  userId?: string,
): Promise<AiUsageResult> {
  const startTime = Date.now();

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const geminiConfig: AgentConfig = {
        id: 'google-gemini-env',
        name: 'Google Gemini AI',
        provider: 'google',
        model: 'gemini-1.5-flash',
        apiKey: geminiKey,
      };
      const result = await callGoogleGemini(geminiConfig, systemPrompt, userMessage, temperature, maxTokens);
      const latencyMs = Date.now() - startTime;
      return {
        response: result.content,
        agentId: 'google-gemini-env',
        provider: 'google',
        model: 'gemini-1.5-flash',
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs,
      };
    } catch (gErr) {
      console.warn('[AI] Direct Gemini API call failed:', gErr);
    }
  }

  // Try to get configured agent
  const agent = await getActiveAgent(purpose);

  // If no agent configured or built-in, use z-ai-web-dev-sdk
  if (!agent || agent.provider === 'built-in') {
    try {
      const result = await callBuiltinAgent(systemPrompt, userMessage, temperature, maxTokens);
      const latencyMs = Date.now() - startTime;

      if (agent) {
        await logUsage(agent.id, purpose, 'success', result.inputTokens, result.outputTokens, latencyMs, undefined, userId);
      }

      return {
        response: result.content,
        agentId: agent?.id || 'built-in',
        provider: agent?.provider || 'built-in',
        model: agent?.model || 'default',
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs,
      };
    } catch (error) {
      if (agent) {
        const latencyMs = Date.now() - startTime;
        await logUsage(agent.id, purpose, 'error', 0, 0, latencyMs, String(error), userId);
      }

      const fallbackResult = await tryFallbackAgent(
        systemPrompt, userMessage, purpose, temperature, maxTokens, startTime, userId, agent?.id
      );
      if (fallbackResult) return fallbackResult;

      throw new Error('AI_SERVICE_UNAVAILABLE');
    }
  }

  // Call the configured agent
  try {
    let result: { content: string; inputTokens: number; outputTokens: number };

    switch (agent.provider) {
      case 'anthropic':
        result = await callAnthropic(agent, systemPrompt, userMessage, temperature, maxTokens);
        break;
      case 'google':
        result = await callGoogleGemini(agent, systemPrompt, userMessage, temperature, maxTokens);
        break;
      case 'openai':
      case 'groq':
      case 'deepseek':
      case 'mistral':
      case 'openrouter':
        result = await callOpenAICompatible(agent, systemPrompt, userMessage, temperature, maxTokens);
        break;
      default:
        result = await callOpenAICompatible(agent, systemPrompt, userMessage, temperature, maxTokens);
    }

    const latencyMs = Date.now() - startTime;
    await logUsage(agent.id, purpose, 'success', result.inputTokens, result.outputTokens, latencyMs, undefined, userId);

    return {
      response: result.content,
      agentId: agent.id,
      provider: agent.provider,
      model: agent.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Log the failure
    await logUsage(agent.id, purpose, 'error', 0, 0, latencyMs, errorMsg, userId);

    // Try fallback
    const fallbackResult = await tryFallbackAgent(
      systemPrompt, userMessage, purpose, temperature, maxTokens, startTime, userId, agent.id
    );
    if (fallbackResult) return fallbackResult;

    throw new Error(`AI Agent "${agent.name}" gagal: ${errorMsg}`);
  }
}

/* ── Fallback Logic ─────────────────────────────────────── */

async function tryFallbackAgent(
  systemPrompt: string,
  userMessage: string,
  purpose: string,
  temperature: number,
  maxTokens: number,
  startTime: number,
  userId?: string,
  excludeAgentId?: string,
): Promise<AiUsageResult | null> {
  try {
    const fallbackAgents = await db.aiAgent.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        purpose: { in: ['all', purpose] },
        id: { not: excludeAgentId || undefined },
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const fbAgent of fallbackAgents) {
      try {
        const agentConfig: AgentConfig = {
          id: fbAgent.id,
          name: fbAgent.name,
          provider: fbAgent.provider,
          model: fbAgent.model,
          apiKey: fbAgent.apiKey,
          apiBaseUrl: fbAgent.apiBaseUrl,
        };

        let result: { content: string; inputTokens: number; outputTokens: number };

        if (fbAgent.provider === 'built-in') {
          result = await callBuiltinAgent(systemPrompt, userMessage, temperature, maxTokens);
        } else if (fbAgent.provider === 'anthropic') {
          result = await callAnthropic(agentConfig, systemPrompt, userMessage, temperature, maxTokens);
        } else if (fbAgent.provider === 'google') {
          result = await callGoogleGemini(agentConfig, systemPrompt, userMessage, temperature, maxTokens);
        } else {
          result = await callOpenAICompatible(agentConfig, systemPrompt, userMessage, temperature, maxTokens);
        }

        const latencyMs = Date.now() - startTime;
        await logUsage(fbAgent.id, purpose, 'success', result.inputTokens, result.outputTokens, latencyMs, undefined, userId);

        return {
          response: result.content,
          agentId: fbAgent.id,
          provider: fbAgent.provider,
          model: fbAgent.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          latencyMs,
        };
      } catch (fbError) {
        console.error(`[AI] Fallback agent "${fbAgent.name}" also failed:`, fbError);
        continue;
      }
    }
  } catch (dbErr) {
    console.warn('[AI] DB fallback agent lookup unavailable:', dbErr);
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════
   PUBLIC API — same signatures as before
   ═══════════════════════════════════════════════════════════ */

/**
 * Get AI chat completion response
 * Automatically uses the configured AI agent with fallback support
 */
export async function getAIResponse(
  systemPrompt: string,
  userMessage: string,
  purpose: string = 'chat',
  userId?: string,
): Promise<string> {
  const result = await callAgent(systemPrompt, userMessage, purpose, 0.7, 2000, userId);
  return result.response;
}

/**
 * Build a context-aware system prompt for the general cooking chat assistant
 */
export function buildChatSystemPrompt(context?: {
  userProfile?: UserProfile;
  currentRecipeId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}): string {
  let prompt = `Kamu adalah "Chef Mindi", asisten AI ahli memasak dari aplikasi DapurMind AI. Kamu sangat menguasai masakan Indonesia dan masakan internasional.

ATURAN PENTING:
- Selalu jawab dalam Bahasa Indonesia yang baik dan mudah dipahami.
- Berikan saran memasak yang praktis, realistis, dan bisa diikuti oleh rumah tangga Indonesia.
- Jika ditanya tentang resep, berikan langkah-langkah yang jelas dan detail.
- Jika ditanya tentang substitusi bahan, berikan alternatif yang mudah didapat di Indonesia.
- Gunakan emoji secukupnya agar percakapan terasa ramah.
- Kamu juga ahli dalam meal planning, zero-waste cooking, dan tips hemat belanja bahan makanan.
- Jika user bertanya di luar topik memasak, arahkan kembali dengan sopan ke topik kuliner.`;

  if (context?.userProfile) {
    const profile = context.userProfile;
    prompt += `\n\nINFORMASI PROFIL PENGGUNA:
- Nama: ${profile.name}
- Jumlah anggota keluarga: ${profile.familySize} orang
- Alergi: ${profile.allergies.length > 0 ? profile.allergies.join(', ') : 'Tidak ada'}
- Restriksi makanan: ${profile.restrictions.length > 0 ? profile.restrictions.join(', ') : 'Tidak ada'}
- Preferensi rasa: ${profile.tastePreferences.length > 0 ? profile.tastePreferences.join(', ') : 'Tidak ada preferensi khusus'}
- Budget mingguan: Rp ${profile.weeklyBudget.toLocaleString('id-ID')}`;

    if (profile.allergies.length > 0) {
      prompt += `\n⚠️ PERINGATAN: Pengguna memiliki alergi terhadap: ${profile.allergies.join(', ')}. WAJIB menghindari bahan-bahan ini dan selalu memberikan peringatan.`;
    }
  }

  if (context?.currentRecipeId) {
    const recipe = recipes.find((r) => r.id === context.currentRecipeId);
    if (recipe) {
      prompt += `\n\nRESEP YANG SEDANG DILIHAT PENGGUNA:
Nama: ${recipe.name}
Deskripsi: ${recipe.description}
Kategori: ${recipe.category}
Kesulitan: ${recipe.difficulty}
Waktu masak: ${recipe.cookTime} menit
Waktu persiapan: ${recipe.prepTime} menit
Porsi: ${recipe.servings}
Kalori: ${recipe.calories || 'Tidak tersedia'}
Bahan-bahan: ${recipe.ingredients.map((i) => `${i.name} (${i.amount} ${i.unit})`).join(', ')}
Langkah-langkah: ${recipe.steps.join('\n')}
Tags: ${recipe.tags.join(', ')}`;
    }
  }

  prompt += `\n\nDATABASE RESEP YANG TERSEDIA (${recipes.length} resep):
${recipes.map((r) => `- ${r.name} (${r.category}, ${r.difficulty}, ${r.prepTime + r.cookTime} menit)`).join('\n')}`;

  return prompt;
}

/**
 * Build a meal planning system prompt based on user profile and request
 */
export function buildMealPlanSystemPrompt(
  userProfile: UserProfile,
  userMessage: string
): string {
  const budgetPerDay = Math.round(userProfile.weeklyBudget / 7);
  const budgetPerMeal = Math.round(budgetPerDay / 3);

  return `Kamu adalah "Chef Mindi", ahli meal planner dari aplikasi DapurMind AI. Tugasmu adalah membuat rencana menu mingguan yang disesuaikan dengan profil pengguna.

PROFIL PENGGUNA:
- Nama: ${userProfile.name}
- Jumlah anggota keluarga: ${userProfile.familySize} orang
- Alergi: ${userProfile.allergies.length > 0 ? userProfile.allergies.join(', ') : 'Tidak ada'}
- Restriksi makanan: ${userProfile.restrictions.length > 0 ? userProfile.restrictions.join(', ') : 'Tidak ada'}
- Preferensi rasa: ${userProfile.tastePreferences.length > 0 ? userProfile.tastePreferences.join(', ') : 'Tidak ada preferensi khusus'}
- Budget mingguan: Rp ${userProfile.weeklyBudget.toLocaleString('id-ID')} (±Rp ${budgetPerDay.toLocaleString('id-ID')}/hari, ±Rp ${budgetPerMeal.toLocaleString('id-ID')}/makan)

ATURAN MEAL PLANNING:
- Buat rencana menu untuk 7 hari (Senin-Minggu).
- Setiap hari terdiri dari: Sarapan, Makan Siang, Makan Malam, dan Snack.
- Sesuaikan porsi untuk ${userProfile.familySize} orang.
- Perhatikan alergi: ${userProfile.allergies.join(', ') || 'Tidak ada alergi'}.
- Perhatikan restriksi: ${userProfile.restrictions.join(', ') || 'Tidak ada restriksi'}.
- Usahakan variasi menu agar tidak monoton.
- Prioritaskan masakan Indonesia dari database DapurMind.
- Sertakan estimasi kalori per hari dan harga belanja.
- Total harga belanja tidak boleh melebihi Rp ${userProfile.weeklyBudget.toLocaleString('id-ID')}.
- Berikan tips penghematan bila memungkinkan.

FORMAT RESPON (dalam Markdown):
## 📅 Rencana Menu Mingguan untuk ${userProfile.name}

### Hari ke-1 - Senin
| Waktu | Menu | Porsi | Est. Kalori |
|-------|------|-------|-------------|
| Sarapan | ... | ... | ... |
| Makan Siang | ... | ... | ... |
| Makan Malam | ... | ... | ... |
| Snack | ... | ... | ... |

*(Lanjutkan untuk hari ke-2 sampai ke-7)*

### 💰 Estimasi Belanja Mingguan
- Total: Rp ...
- Rincian per kategori: ...

### 🛒 Daftar Belanja
- **Protein**: ...
- **Sayuran**: ...
- **Bumbu**: ...
- **Bahan Pokok**: ...
- **Lainnya**: ...

### 💡 Tips Hemat
- ...

PERMINTAAN PENGGUNA:
${userMessage}

Jawab dalam Bahasa Indonesia yang baik dengan format Markdown.`;
}

/**
 * Build a zero-waste recipe system prompt based on available ingredients
 */
export function buildZeroWasteSystemPrompt(
  ingredients: string[],
  expiryDays: number
): string {
  return `Kamu adalah "Chef Mindi", ahli zero-waste cooking dari aplikasi DapurMind AI. Tugasmu adalah membantu pengguna memanfaatkan bahan makanan yang tersisa sebelum kedaluwarsa.

BAHAN YANG TERSEDIA (harus segera digunakan dalam ${expiryDays} hari):
${ingredients.map((i) => `- ${i}`).join('\n')}

ATURAN:
- Gunakan SEMUA bahan yang tersedia atau sebanyak mungkin.
- Berikan 3-5 ide resep kreatif yang bisa dibuat dari bahan-bahan tersebut.
- Setiap resep harus mencantumkan: nama, bahan yang digunakan, langkah-langkah, estimasi waktu, dan tingkat kesulitan.
- Prioritaskan resep yang menggunakan bahan yang paling cepat kedaluwarsa.
- Berikan tips penyimpanan agar bahan bisa bertahan lebih lama.
- Jika ada bahan yang sudah dekat kedaluwarsa, beri saran untuk diolah atau dibekukan.
- Usahakan resep yang praktis dan bisa dibuat dengan peralatan dapur standar.

FORMAT RESPON (dalam Markdown):
## 🍳 Ide Resep Zero-Waste

### 🔴 Prioritas Tinggi (kedaluwarsa paling cepat)
**Resep 1: ...**
- Bahan yang dipakai: ...
- Bahan tambahan yang mungkin perlu: ...
- Langkah: ...
- Waktu: ... menit
- Kesulitan: ...

### 🟡 Prioritas Sedang
...

### 🟢 Prioritas Rendah
...

### 💡 Tips Penyimpanan
- ...

Jawab dalam Bahasa Indonesia yang baik.`;
}

/**
 * Generate a meal plan using AI based on user profile and request
 */
export async function generateMealPlan(
  userProfile: UserProfile,
  userMessage: string,
  userId?: string,
): Promise<string> {
  const systemPrompt = buildMealPlanSystemPrompt(userProfile, userMessage);
  return getAIResponse(systemPrompt, userMessage, 'meal-plan', userId);
}

/**
 * Generate zero-waste recipe suggestions using AI
 */
export async function generateZeroWasteRecipes(
  ingredients: string[],
  expiryDays: number,
  userId?: string,
): Promise<string> {
  const systemPrompt = buildZeroWasteSystemPrompt(ingredients, expiryDays);
  const userMessage = `Saya punya bahan-bahan berikut yang perlu segera digunakan dalam ${expiryDays} hari: ${ingredients.join(', ')}. Tolong berikan ide resep kreatif untuk memanfaatkan semua bahan ini.`;
  return getAIResponse(systemPrompt, userMessage, 'zero-waste', userId);
}

/**
 * Get cooking tips from AI based on a question
 */
export async function getCookingTip(question: string, userId?: string): Promise<string> {
  const systemPrompt = `Kamu adalah "Chef Mindi", asisten AI ahli memasak dari DapurMind AI. Berikan tips memasak yang praktis, trik dapur, dan saran bermanfaat dalam Bahasa Indonesia. Gunakan format Markdown. Jawab singkat namun informatif (maksimal 300 kata).`;
  return getAIResponse(systemPrompt, question, 'chat', userId);
}

/**
 * Get recipe modification suggestions (e.g., healthier, vegetarian alternatives, etc.)
 */
export async function getRecipeModification(
  recipeName: string,
  recipeDetails: string,
  modificationRequest: string,
  userId?: string,
): Promise<string> {
  const systemPrompt = `Kamu adalah "Chef Mindi", ahli modifikasi resep dari DapurMind AI. Kamu diminta untuk memodifikasi resep berdasarkan permintaan pengguna.

RESEP ASLI:
Nama: ${recipeName}
${recipeDetails}

ATURAN:
- Jaga cita rasa Indonesia tetap terasa.
- Berikan langkah-langkah yang jelas.
- Catat perubahan bahan dan langkah yang dimodifikasi.
- Jawab dalam Bahasa Indonesia dengan format Markdown.`;

  return getAIResponse(systemPrompt, modificationRequest, 'chat', userId);
}

/**
 * Export for admin: get list of all agents (for admin dashboard stats)
 */
export async function getAgentStats() {
  try {
    const agents = await db.aiAgent.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        provider: true,
        model: true,
        isDefault: true,
        isActive: true,
        maxTokens: true,
        usedTokens: true,
        totalRequests: true,
        failedRequests: true,
        lastUsedAt: true,
      },
    });

    const totalUsed = agents.reduce((sum, a) => sum + a.usedTokens, 0);
    const totalRequests = agents.reduce((sum, a) => sum + a.totalRequests, 0);
    const totalFailed = agents.reduce((sum, a) => sum + a.failedRequests, 0);

    return { agents, totalUsed, totalRequests, totalFailed };
  } catch (error) {
    console.error('[AI] Error getting agent stats:', error);
    return { agents: [], totalUsed: 0, totalRequests: 0, totalFailed: 0 };
  }
}
