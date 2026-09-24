import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth-server';

/* ── Helper: serialize recipe ────────────────────────── */
function serializeRecipe(r: {
  id: string;
  userId: string;
  name: string;
  description: string;
  image: string;
  category: string;
  difficulty: string;
  cookTime: number;
  prepTime: number;
  servings: number;
  ingredients: string;
  steps: string;
  tags: string;
  youtubeUrl: string | null;
  likes: number;
  isPublished: boolean;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; name: string | null; email: string } | null;
}) {
  return {
    id: r.id,
    userId: r.userId,
    name: r.name,
    description: r.description,
    image: r.image,
    category: r.category,
    difficulty: r.difficulty,
    cookTime: r.cookTime,
    prepTime: r.prepTime,
    servings: r.servings,
    ingredients: JSON.parse(r.ingredients),
    steps: JSON.parse(r.steps),
    tags: JSON.parse(r.tags),
    youtubeUrl: r.youtubeUrl ?? undefined,
    likes: r.likes,
    isPublished: r.isPublished,
    isActive: r.isActive,
    deletedAt: r.deletedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    user: r.user ? { id: r.user.id, name: r.user.name, email: r.user.email } : undefined,
  };
}

/* ── GET /api/admin/recipes ────────────────────────────── */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const where: Record<string, unknown> = {};
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }

    const recipes = await db.creatorRecipe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ recipes: recipes.map(serializeRecipe) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: 'Gagal memuat resep' }, { status: 500 });
  }
}

/* ── POST /api/admin/recipes ───────────────────────────── */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { userId, name, description, image, category, difficulty, cookTime, prepTime, servings, ingredients, steps, tags, youtubeUrl, isPublished } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const recipe = await db.creatorRecipe.create({
      data: {
        userId: userId || 'admin',
        name,
        description: description || '',
        image: image || '',
        category: category || 'Lainnya',
        difficulty: difficulty || 'Mudah',
        cookTime: cookTime || 30,
        prepTime: prepTime || 15,
        servings: servings || 4,
        ingredients: JSON.stringify(ingredients || []),
        steps: JSON.stringify(steps || []),
        tags: JSON.stringify(tags || []),
        youtubeUrl: youtubeUrl || null,
        isPublished: isPublished ?? true,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ recipe: serializeRecipe(recipe) }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error creating recipe:', error);
    return NextResponse.json({ error: 'Gagal membuat resep' }, { status: 500 });
  }
}

/* ── PUT /api/admin/recipes — Update recipe ──────────── */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { id, name, description, category, difficulty, cookTime, prepTime, isPublished } = body;

    if (!id) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (cookTime !== undefined) updateData.cookTime = cookTime;
    if (prepTime !== undefined) updateData.prepTime = prepTime;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const recipe = await db.creatorRecipe.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ recipe: serializeRecipe(recipe) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error updating recipe:', error);
    return NextResponse.json({ error: 'Gagal mengupdate resep' }, { status: 500 });
  }
}

/* ── DELETE /api/admin/recipes — Soft delete ─────────── */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    const recipe = await db.creatorRecipe.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ recipe: serializeRecipe(recipe) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error soft-deleting recipe:', error);
    return NextResponse.json({ error: 'Gagal menghapus resep' }, { status: 500 });
  }
}

/* ── PATCH /api/admin/recipes — Restore ──────────────── */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    const recipe = await db.creatorRecipe.update({
      where: { id },
      data: {
        deletedAt: null,
        isActive: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ recipe: serializeRecipe(recipe) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error restoring recipe:', error);
    return NextResponse.json({ error: 'Gagal memulihkan resep' }, { status: 500 });
  }
}
