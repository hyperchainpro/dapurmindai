import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════
   GET/POST/PUT/DELETE — Recipe Ratings CRUD
   ═══════════════════════════════════════════════════════════ */

// GET - List ratings for a recipe or user's ratings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('recipeId');
    const userId = searchParams.get('userId');

    if (!recipeId && !userId) {
      return NextResponse.json(
        { error: 'recipeId atau userId wajib diisi' },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {
      isActive: true,
      deletedAt: null,
    };

    if (recipeId) where.recipeId = recipeId;
    if (userId) where.userId = userId;

    const ratings = await db.recipeRating.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: ratings });
  } catch (error) {
    console.error('[Ratings] GET error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat rating' },
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

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating harus berupa angka antara 1-5' },
        { status: 400 }
      );
    }

    // Check if user already rated this recipe
    const existing = await db.recipeRating.findFirst({
      where: { recipeId, userId, isActive: true, deletedAt: null },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Anda sudah memberikan rating untuk resep ini' },
        { status: 409 }
      );
    }

    const newRating = await db.recipeRating.create({
      data: {
        recipeId,
        userId,
        rating,
        comment: comment || '',
      },
    });

    return NextResponse.json({ success: true, data: newRating }, { status: 201 });
  } catch (error) {
    console.error('[Ratings] POST error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat rating' },
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

    // Check ownership
    const existing = await db.recipeRating.findFirst({
      where: { id, userId, isActive: true, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Rating tidak ditemukan atau bukan milik Anda' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (rating !== undefined) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating harus berupa angka antara 1-5' },
          { status: 400 }
        );
      }
      updateData.rating = rating;
    }
    if (comment !== undefined) updateData.comment = comment;

    const updated = await db.recipeRating.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[Ratings] PUT error:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate rating' },
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

    // Check ownership
    const existing = await db.recipeRating.findFirst({
      where: { id, userId, isActive: true, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Rating tidak ditemukan atau bukan milik Anda' },
        { status: 404 }
      );
    }

    await db.recipeRating.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Ratings] DELETE error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus rating' },
      { status: 500 }
    );
  }
}
