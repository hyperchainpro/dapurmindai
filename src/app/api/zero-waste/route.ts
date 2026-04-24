import { NextRequest, NextResponse } from 'next/server';
import { generateZeroWasteRecipes } from '@/lib/ai';

interface ZeroWasteRequestBody {
  ingredients: string[];
  expiryDays: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ZeroWasteRequestBody = await request.json();
    const { ingredients, expiryDays } = body;

    // Validate required fields
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
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
        {
          error: 'Setiap bahan harus berupa teks yang valid.',
        },
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
        {
          error:
            'Sisa hari kedaluwarsa harus berupa angka antara 1-30.',
        },
        { status: 400 }
      );
    }

    // Limit number of ingredients to prevent abuse
    if (ingredients.length > 30) {
      return NextResponse.json(
        {
          error: 'Maksimal 30 bahan yang dapat diproses sekaligus.',
        },
        { status: 400 }
      );
    }

    // Clean up ingredients (trim whitespace, capitalize first letter)
    const cleanedIngredients = ingredients.map((i) =>
      i.trim().charAt(0).toUpperCase() + i.trim().slice(1).toLowerCase()
    );

    // Generate zero-waste recipe suggestions
    const aiResponse = await generateZeroWasteRecipes(
      cleanedIngredients,
      expiryDays
    );

    return NextResponse.json({
      success: true,
      response: aiResponse,
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
