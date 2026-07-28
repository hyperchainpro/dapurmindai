import { NextRequest, NextResponse } from 'next/server';
import { generateZeroWasteRecipes } from '@/lib/ai';
import { recipes } from '@/lib/recipes';
import type { Recipe } from '@/types';

interface ZeroWasteRequestBody {
  ingredients: string[];
  expiryDays: number;
}

/* ── Local recipe matching fallback ──────────────────────── */

function matchLocalRecipes(
  ingredients: string[],
  expiryDays: number
): Recipe[] {
  const lowerIngredients = ingredients.map((i) => i.toLowerCase());
  const scored: { recipe: Recipe; score: number; matched: string[] }[] = [];

  for (const recipe of recipes) {
    const recipeIngNames = recipe.ingredients.map((i) =>
      (typeof i === 'string' ? i : i.name).toLowerCase()
    );
    const matched: string[] = [];

    for (const ing of lowerIngredients) {
      for (const rIng of recipeIngNames) {
        if (
          rIng.includes(ing) ||
          ing.includes(rIng) ||
          rIng.split(' ').some((word) => word.length > 2 && ing.includes(word))
        ) {
          if (!matched.includes(ingredients[lowerIngredients.indexOf(ing)])) {
            matched.push(ingredients[lowerIngredients.indexOf(ing)]);
          }
          break;
        }
      }
    }

    // Also match by recipe tags
    for (const ing of lowerIngredients) {
      for (const tag of recipe.tags) {
        if (tag.toLowerCase().includes(ing) && !matched.includes(ingredients[lowerIngredients.indexOf(ing)])) {
          matched.push(ingredients[lowerIngredients.indexOf(ing)]);
          break;
        }
      }
    }

    if (matched.length > 0) {
      // Score: more matched ingredients + bonus for quick recipes when expiry is short
      const timeScore = expiryDays <= 2 ? (recipe.cookTime <= 20 ? 3 : 1) : 0;
      const score = matched.length + timeScore;
      scored.push({ recipe, score, matched });
    }
  }

  // Sort by score descending, take top results
  scored.sort((a, b) => b.score - a.score);

  // Deduplicate by recipe id
  const seen = new Set<string>();
  const results: Recipe[] = [];
  for (const item of scored) {
    if (!seen.has(item.recipe.id)) {
      seen.add(item.recipe.id);
      results.push(item.recipe);
    }
    if (results.length >= 5) break;
  }

  return results;
}

/* ── POST /api/zero-waste ─────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const body: ZeroWasteRequestBody = await request.json();
    const ingredients = body.ingredients;
    const expiryDays = (typeof body.expiryDays === 'number' && body.expiryDays >= 1 && body.expiryDays <= 30) ? body.expiryDays : 3;

    // Validate required fields
    if (
      !ingredients ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Daftar bahan tidak boleh kosong. Kirimkan array bahan makanan yang tersedia.',
        },
        { status: 400 }
      );
    }

    // Validate each ingredient is a non-empty string
    const invalidIngredients = ingredients.filter(
      (i) => typeof i !== 'string' || i.trim().length === 0
    );
    if (invalidIngredients.length > 0) {
      return NextResponse.json(
        { error: 'Setiap bahan harus berupa teks yang valid.' },
        { status: 400 }
      );
    }

    // Validate expiry days
    if (
      expiryDays === undefined ||
      typeof expiryDays !== 'number' ||
      expiryDays < 1 ||
      expiryDays > 30
    ) {
      return NextResponse.json(
        { error: 'Sisa hari kedaluwarsa harus berupa angka antara 1-30.' },
        { status: 400 }
      );
    }

    // Limit number of ingredients to prevent abuse
    if (ingredients.length > 30) {
      return NextResponse.json(
        { error: 'Maksimal 30 bahan yang dapat diproses sekaligus.' },
        { status: 400 }
      );
    }

    // Clean up ingredients (trim whitespace, capitalize first letter)
    const cleanedIngredients = ingredients.map(
      (i) =>
        i.trim().charAt(0).toUpperCase() + i.trim().slice(1).toLowerCase()
    );

    // Try AI generation first with 15-second timeout
    let aiResponse: string | null = null;
    let fallbackReason: string | undefined;

    try {
      const aiPromise = generateZeroWasteRecipes(
        cleanedIngredients,
        expiryDays
      );

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI_TIMEOUT')), 15_000);
      });

      aiResponse = await Promise.race([aiPromise, timeoutPromise]);
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message === 'AI_TIMEOUT' || err.message.includes('timeout'))
      ) {
        fallbackReason = 'AI response timed out (>15s), using local recipes';
      } else {
        fallbackReason = `AI generation failed: ${err instanceof Error ? err.message : 'Unknown error'}, using local recipes`;
      }
      console.warn('[Zero-Waste API] AI fallback triggered:', fallbackReason);
    }

    // If AI succeeded, return AI results
    if (aiResponse) {
      return NextResponse.json({
        success: true,
        response: aiResponse,
        source: 'ai' as const,
        ingredientsUsed: cleanedIngredients,
        expiryDays,
        timestamp: new Date().toISOString(),
      });
    }

    // Fall back to local recipe matching
    const localResults = matchLocalRecipes(cleanedIngredients, expiryDays);

    if (localResults.length > 0) {
      // Format local results into a readable response string
      const formattedResponse = localResults
        .map((r, i) => {
          const matchedIngs = r.ingredients
            .filter((ing) => {
              const name = typeof ing === 'string' ? ing : ing.name;
              return cleanedIngredients.some(
                (ci) =>
                  name.toLowerCase().includes(ci.toLowerCase()) ||
                  ci.toLowerCase().includes(name.toLowerCase())
              );
            })
            .map((ing) => (typeof ing === 'string' ? ing : ing.name));
          const fallbackIngs = r.ingredients
            .slice(0, 3)
            .map((i) => (typeof i === 'string' ? i : i.name));
          return `${i + 1}. **${r.name}** (${r.difficulty}, ~${r.cookTime + r.prepTime} menit)\n   ${r.description}\n   Bahan cocok: ${matchedIngs.join(', ') || fallbackIngs.join(', ')}\n   Langkah: ${r.steps.slice(0, 3).join(' → ')}...`;
        })
        .join('\n\n');

      return NextResponse.json({
        success: true,
        response: `**Resep Lokal (Bahan Tersedia)**\n\n${formattedResponse}\n\n_Catatan: Resep ini dipilih dari database lokal karena layanan AI sedang tidak tersedia._`,
        source: 'local' as const,
        localRecipes: localResults.map((r) => r.id),
        fallbackReason,
        ingredientsUsed: cleanedIngredients,
        expiryDays,
        timestamp: new Date().toISOString(),
      });
    }

    // No results at all
    return NextResponse.json({
      success: true,
      response:
        'Maaf, tidak ditemukan resep yang cocok dengan bahan-bahan tersebut. Coba tambahkan bahan lain atau ubah jangka waktu kadaluarsa.',
      source: 'none' as const,
      fallbackReason,
      ingredientsUsed: cleanedIngredients,
      expiryDays,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Zero-Waste API] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          'Terjadi kesalahan server saat membuat saran resep. Silakan coba lagi.',
      },
      { status: 500 }
    );
  }
}
