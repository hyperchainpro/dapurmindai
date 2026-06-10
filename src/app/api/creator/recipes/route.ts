import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper to format recipe response
function formatRecipe(r: any) {
  if (!r) return null;
  return {
    ...r,
    id: r._id,
    createdAt: new Date(r._creationTime).toISOString(),
  };
}

// GET - List creator recipes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID wajib diisi' },
        { status: 400 }
      );
    }

    const isAll = userId === 'all';
    const recipes = await client.query(api.recipes.listAll, {
      userId: isAll ? undefined : (userId as Id<"users">),
    });

    const formatted = recipes.map((r: any) => formatRecipe(r));
    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching creator recipes:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat resep creator' },
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

    const recipeId = await client.mutation(api.recipes.create, {
      userId: userId as Id<"users">,
      name,
      description: description || '',
      image: image || '',
      category: category || 'Lainnya',
      difficulty: difficulty || 'Mudah',
      cookTime: cookTime || 30,
      prepTime: prepTime || 15,
      servings: servings || 4,
      ingredients: typeof ingredients === 'string' ? ingredients : JSON.stringify(ingredients || []),
      steps: typeof steps === 'string' ? steps : JSON.stringify(steps || []),
      tags: typeof tags === 'string' ? tags : JSON.stringify(tags || []),
      youtubeUrl: youtubeUrl || undefined,
    });

    const created = await client.query(api.recipes.getById, { recipeId });

    return NextResponse.json({ success: true, data: formatRecipe(created) }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating creator recipe:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membuat resep creator' },
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
    const existing = await client.query(api.recipes.getById, { recipeId: id as Id<"creatorRecipes"> });

    if (!existing || existing.userId !== userId || !existing.isActive) {
      return NextResponse.json(
        { error: 'Resep tidak ditemukan atau bukan milik Anda' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = { recipeId: id as Id<"creatorRecipes"> };
    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.description !== undefined) updateData.description = fields.description;
    if (fields.image !== undefined) updateData.image = fields.image;
    if (fields.category !== undefined) updateData.category = fields.category;
    if (fields.difficulty !== undefined) updateData.difficulty = fields.difficulty;
    if (fields.cookTime !== undefined) updateData.cookTime = Number(fields.cookTime);
    if (fields.prepTime !== undefined) updateData.prepTime = Number(fields.prepTime);
    if (fields.servings !== undefined) updateData.servings = Number(fields.servings);
    if (fields.ingredients !== undefined) {
      updateData.ingredients = typeof fields.ingredients === 'string' ? fields.ingredients : JSON.stringify(fields.ingredients);
    }
    if (fields.steps !== undefined) {
      updateData.steps = typeof fields.steps === 'string' ? fields.steps : JSON.stringify(fields.steps);
    }
    if (fields.tags !== undefined) {
      updateData.tags = typeof fields.tags === 'string' ? fields.tags : JSON.stringify(fields.tags);
    }
    if (fields.youtubeUrl !== undefined) updateData.youtubeUrl = fields.youtubeUrl || undefined;
    if (fields.isPublished !== undefined) updateData.isPublished = fields.isPublished;

    await client.mutation(api.recipes.update, updateData);

    const updated = await client.query(api.recipes.getById, { recipeId: id as Id<"creatorRecipes"> });

    return NextResponse.json({ success: true, data: formatRecipe(updated) });
  } catch (error: any) {
    console.error('Error updating creator recipe:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengupdate resep creator' },
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
    const existing = await client.query(api.recipes.getById, { recipeId: id as Id<"creatorRecipes"> });

    if (!existing || existing.userId !== userId || !existing.isActive) {
      return NextResponse.json(
        { error: 'Resep tidak ditemukan atau bukan milik Anda' },
        { status: 404 }
      );
    }

    await client.mutation(api.recipes.softDelete, { recipeId: id as Id<"creatorRecipes"> });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting creator recipe:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus resep creator' },
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

    const recipe = await client.query(api.recipes.getById, { recipeId: id as Id<"creatorRecipes"> });

    if (!recipe || !recipe.isActive) {
      return NextResponse.json(
        { error: 'Resep tidak ditemukan' },
        { status: 404 }
      );
    }

    if (action === 'like') {
      await client.mutation(api.recipes.incrementLikes, { recipeId: id as Id<"creatorRecipes"> });
    } else {
      await client.mutation(api.recipes.decrementLikes, { recipeId: id as Id<"creatorRecipes"> });
    }

    const updated = await client.query(api.recipes.getById, { recipeId: id as Id<"creatorRecipes"> });

    return NextResponse.json({ success: true, data: formatRecipe(updated) });
  } catch (error: any) {
    console.error('Error liking creator recipe:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses like pada resep' },
      { status: 500 }
    );
  }
}
