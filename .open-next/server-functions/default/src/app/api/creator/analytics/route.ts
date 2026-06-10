import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════
   GET /api/creator/analytics — Creator dashboard analytics
   Query: userId (required)
   ═══════════════════════════════════════════════════════════ */

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

    // Run all queries in parallel
    const [
      totalRecipes,
      publishedRecipes,
      draftRecipes,
      totalLikes,
      avgRatingResult,
      recipesByCategoryRaw,
      likesOverTimeRaw,
    ] = await Promise.all([
      // Total recipes count
      db.creatorRecipe.count({
        where: { userId, isActive: true },
      }),
      // Published recipes
      db.creatorRecipe.count({
        where: { userId, isActive: true, isPublished: true },
      }),
      // Draft recipes
      db.creatorRecipe.count({
        where: { userId, isActive: true, isPublished: false },
      }),
      // Total likes across all recipes
      db.creatorRecipe.aggregate({
        where: { userId, isActive: true },
        _sum: { likes: true },
      }),
      // Average rating from recipe ratings
      db.recipeRating.aggregate({
        _avg: { rating: true },
      }),
      // Recipes by category
      db.creatorRecipe.groupBy({
        by: ['category'],
        where: { userId, isActive: true },
        _count: { id: true },
      }),
      // Likes over time (last 30 days)
      db.$queryRaw<Array<{ date: string; likes: number }>>`
        SELECT DATE("createdAt") as date, SUM("likes")::int as likes
        FROM creator_recipes
        WHERE "userId" = ${userId}
          AND "isActive" = true
          AND "createdAt" >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
    ]);

    const avgRating = avgRatingResult._avg.rating
      ? Math.round(avgRatingResult._avg.rating * 10) / 10
      : 0;

    // Build recipesByCategory map
    const recipesByCategory: Record<string, number> = {};
    recipesByCategoryRaw.forEach((item) => {
      recipesByCategory[item.category] = item._count.id;
    });

    // Build recent activity from recent recipes
    const recentRecipes = await db.creatorRecipe.findMany({
      where: { userId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        name: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const recentActivity = recentRecipes.map((r) => ({
      date: (r.updatedAt || r.createdAt).toISOString(),
      action: r.isPublished ? 'published' : 'updated',
      detail: r.name,
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalRecipes,
        publishedRecipes,
        draftRecipes,
        totalLikes: totalLikes._sum.likes || 0,
        avgRating,
        recipesByCategory,
        recentActivity,
        likesOverTime: likesOverTimeRaw,
      },
    });
  } catch (error) {
    console.error('[Creator Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat analytics creator' },
      { status: 500 }
    );
  }
}
