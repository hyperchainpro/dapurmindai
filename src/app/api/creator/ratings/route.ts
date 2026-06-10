import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper to format ratings
function formatRating(r: any) {
  if (!r) return null;
  return {
    ...r,
    id: r._id,
    createdAt: new Date(r._creationTime).toISOString(),
  };
}

// GET - List ratings for a recipe or user's ratings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('recipeId') || undefined;
    const userId = searchParams.get('userId') || undefined;

    if (!recipeId && !userId) {
      return NextResponse.json(
        { error: 'recipeId atau userId wajib diisi' },
        { status: 400 }
      );
    }

    const ratings = await client.query(api.ratings.getRatings, {
      recipeId,
      userId: userId ? (userId as Id<"users">) : undefined,
    });

    const formatted = ratings.map((r: any) => formatRating(r));
    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('[Ratings] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat rating' },
      { status: 500 }
    );
  }
}

// POST - Create a rating
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipeId, userId, rating, comment } = body;

    if (!recipeId || !userId || rating === undefined) {
      return NextResponse.json(
        { error: 'Recipe ID, User ID, dan rating wajib diisi' },
        { status: 400 }
      );
    }

    const ratingVal = Number(rating);
    if (!Number.isInteger(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return NextResponse.json(
        { error: 'Rating harus berupa angka antara 1-5' },
        { status: 400 }
      );
    }

    const newRating = await client.mutation(api.ratings.createRating, {
      recipeId,
      userId: userId as Id<"users">,
      rating: ratingVal,
      comment: comment || '',
    });

    return NextResponse.json({ success: true, data: formatRating(newRating) }, { status: 201 });
  } catch (error: any) {
    console.error('[Ratings] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membuat rating' },
      { status: 500 }
    );
  }
}

// PUT - Update a rating
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, rating, comment } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'ID dan User ID wajib diisi' },
        { status: 400 }
      );
    }

    const updateData: any = {
      ratingId: id as Id<"recipeRatings">,
      userId: userId as Id<"users">,
    };

    if (rating !== undefined) {
      const ratingVal = Number(rating);
      if (!Number.isInteger(ratingVal) || ratingVal < 1 || ratingVal > 5) {
        return NextResponse.json(
          { error: 'Rating harus berupa angka antara 1-5' },
          { status: 400 }
        );
      }
      updateData.rating = ratingVal;
    }
    if (comment !== undefined) updateData.comment = comment;

    const updated = await client.mutation(api.ratings.updateRating, updateData);

    return NextResponse.json({ success: true, data: formatRating(updated) });
  } catch (error: any) {
    console.error('[Ratings] PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengupdate rating' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a rating
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'ID dan User ID wajib diisi' },
        { status: 400 }
      );
    }

    await client.mutation(api.ratings.deleteRating, {
      ratingId: id as Id<"recipeRatings">,
      userId: userId as Id<"users">,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Ratings] DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus rating' },
      { status: 500 }
    );
  }
}
