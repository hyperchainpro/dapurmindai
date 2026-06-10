import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List creator recipes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const includeUnpublished = searchParams.get('includeUnpublished') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    if (userId === 'all') {
      // Return all published recipes only
      const recipes = await db.creatorRecipe.findMany({
        where: {
          isActive: true,
          isPublished: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ success: true, data: recipes });
    }

    // Return all published recipes + user's own unpublished recipes
    const recipes = await db.creatorRecipe.findMany({
      where: {
        isActive: true,
        ...(includeUnpublished
          ? {
              OR: [
                { isPublished: true },
                { userId },
              ],
            }
          : {
              OR: [
                { isPublished: true },
                { userId, isPublished: false },
              ],
            }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: recipes });
  } catch (error) {
    console.error('Error fetching creator recipes:', error);
    return NextResponse.json(
      { error: 'Gagal memuat resep creator' },
      { status: 500 }
    );
  }
}

// POST - Create a new creator recipe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      description,
      image,
      category,
      difficulty,
      cookTime,
      prepTime,
      servings,
      ingredients,
      steps,
      tags,
      youtubeUrl,
    } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'User ID dan nama resep wajib diisi' },
        { status: 400 }
      );
    }

    const recipe = await db.creatorRecipe.create({
      data: {
        userId,
        name,
        description: description || '',
        image: image || '',
        category: category || 'Lainnya',
        difficulty: difficulty || 'Mudah',
        cookTime: cookTime || 30,
        prepTime: prepTime || 15,
        servings: servings || 4,
        ingredients: ingredients || '[]',
        steps: steps || '[]',
        tags: tags || '[]',
        youtubeUrl: youtubeUrl || null,
      },
    });

    return NextResponse.json({ success: true, data: recipe }, { status: 201 });
  } catch (error) {
    console.error('Error creating creator recipe:', error);
    return NextResponse.json(
      { error: 'Gagal membuat resep creator' },
      { status: 500 }
    );
  }
}

// PUT - Update a creator recipe
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, ...fields } = body;

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'ID dan User ID wajib diisi' },
        { status: 400 }
      );
    }

    // Check ownership
    const existing = await db.creatorRecipe.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Resep tidak ditemukan atau bukan milik Anda' },
        { status: 404 }
      );
    }

    // Build update data with only provided fields
    const updateData: Record<string, unknown> = {};
    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.description !== undefined) updateData.description = fields.description;
    if (fields.image !== undefined) updateData.image = fields.image;
    if (fields.category !== undefined) updateData.category = fields.category;
    if (fields.difficulty !== undefined) updateData.difficulty = fields.difficulty;
    if (fields.cookTime !== undefined) updateData.cookTime = fields.cookTime;
    if (fields.prepTime !== undefined) updateData.prepTime = fields.prepTime;
    if (fields.servings !== undefined) updateData.servings = fields.servings;
    if (fields.ingredients !== undefined) updateData.ingredients = fields.ingredients;
    if (fields.steps !== undefined) updateData.steps = fields.steps;
    if (fields.tags !== undefined) updateData.tags = fields.tags;
    if (fields.youtubeUrl !== undefined) updateData.youtubeUrl = fields.youtubeUrl;
    if (fields.isPublished !== undefined) updateData.isPublished = fields.isPublished;

    const recipe = await db.creatorRecipe.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: recipe });
  } catch (error) {
    console.error('Error updating creator recipe:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate resep creator' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a creator recipe
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
    const existing = await db.creatorRecipe.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Resep tidak ditemukan atau bukan milik Anda' },
        { status: 404 }
      );
    }

    await db.creatorRecipe.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting creator recipe:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus resep creator' },
      { status: 500 }
    );
  }
}

// PATCH - Like or unlike a recipe
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: 'ID dan aksi wajib diisi' },
        { status: 400 }
      );
    }

    if (action !== 'like' && action !== 'unlike') {
      return NextResponse.json(
        { error: 'Aksi harus "like" atau "unlike"' },
        { status: 400 }
      );
    }

    const recipe = await db.creatorRecipe.findFirst({
      where: { id, isActive: true },
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Resep tidak ditemukan' },
        { status: 404 }
      );
    }

    const updated = await db.creatorRecipe.update({
      where: { id },
      data: {
        likes: action === 'like' ? recipe.likes + 1 : Math.max(0, recipe.likes - 1),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error liking creator recipe:', error);
    return NextResponse.json(
      { error: 'Gagal memproses like pada resep' },
      { status: 500 }
    );
  }
}
