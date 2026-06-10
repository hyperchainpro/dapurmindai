import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'latest';
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
      isPublished: true,
    };

    if (category && category !== 'Semua') {
      where.category = category;
    }

    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    // Build orderBy
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (sort === 'popular') orderBy = { likes: 'desc' };
    if (sort === 'fastest') orderBy = { cookTime: 'asc' };

    const recipes = await db.creatorRecipe.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Also fetch creator profiles for richer data
    const userIds = [...new Set(recipes.map((r) => r.userId))];
    const profiles = userIds.length > 0
      ? await db.creatorProfile.findMany({
          where: { userId: { in: userIds }, isActive: true },
          select: { userId: true, displayName: true, avatar: true, bio: true, followers: true, totalRecipes: true },
        })
      : [];

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    // Map response
    const data = recipes.map((r) => {
      const profile = profileMap.get(r.userId);
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        image: r.image,
        category: r.category,
        difficulty: r.difficulty,
        cookTime: r.cookTime,
        prepTime: r.prepTime,
        servings: r.servings,
        likes: r.likes,
        tags: r.tags,
        youtubeUrl: r.youtubeUrl,
        createdAt: r.createdAt,
        user: {
          id: r.user.id,
          username: r.user.username,
          name: r.user.name || r.user.username,
          avatar: r.user.avatar,
          displayName: profile?.displayName || r.user.name || r.user.username,
          bio: profile?.bio || '',
          followers: profile?.followers || 0,
          totalRecipes: profile?.totalRecipes || 0,
        },
      };
    });

    // Next cursor
    const nextCursor = recipes.length === limit
      ? recipes[recipes.length - 1].createdAt.toISOString()
      : null;

    // Get category counts for filters
    const categoryCounts = await db.creatorRecipe.groupBy({
      by: ['category'],
      where: { isActive: true, isPublished: true },
      _count: { id: true },
    });

    const categoryStats = Object.fromEntries(
      categoryCounts.map((c) => [c.category, c._count.id])
    );
    categoryStats['Semua'] = Object.values(categoryStats).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      data,
      nextCursor,
      categoryStats,
    });
  } catch (error) {
    console.error('Error fetching explore data:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data explore' },
      { status: 500 }
    );
  }
}