import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ── Admin key guard ──────────────────────────────────── */
function isAdmin(request: NextRequest): boolean {
  return request.headers.get('X-Admin-Key') === 'dapurmind2025';
}

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

/* ── GET /api/admin/recipes/[id] ──────────────────────── */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const recipe = await db.creatorRecipe.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Resep tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ recipe: serializeRecipe(recipe) });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json({ error: 'Gagal memuat resep' }, { status: 500 });
  }
}

/* ── PUT /api/admin/recipes/[id] — Update recipe ──────── */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
    if (body.cookTime !== undefined) updateData.cookTime = body.cookTime;
    if (body.prepTime !== undefined) updateData.prepTime = body.prepTime;
    if (body.servings !== undefined) updateData.servings = body.servings;
    if (body.ingredients !== undefined) updateData.ingredients = JSON.stringify(body.ingredients);
    if (body.steps !== undefined) updateData.steps = JSON.stringify(body.steps);
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags);
    if (body.youtubeUrl !== undefined) updateData.youtubeUrl = body.youtubeUrl;
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.likes !== undefined) updateData.likes = body.likes;

    const recipe = await db.creatorRecipe.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ recipe: serializeRecipe(recipe) });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json({ error: 'Gagal mengupdate resep' }, { status: 500 });
  }
}

/* ── DELETE /api/admin/recipes/[id] — Soft delete ─────── */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

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
    console.error('Error soft-deleting recipe:', error);
    return NextResponse.json({ error: 'Gagal menghapus resep' }, { status: 500 });
  }
}

/* ── PATCH /api/admin/recipes/[id] — Restore ─────────── */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

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
    console.error('Error restoring recipe:', error);
    return NextResponse.json({ error: 'Gagal memulihkan resep' }, { status: 500 });
  }
}
