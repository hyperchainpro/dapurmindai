import { NextRequest, NextResponse } from 'next/server';

const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

export async function GET() {
  try {
    // Get 6 random meals at once
    const promises = Array.from({ length: 6 }, () =>
      fetch(`${THEMEALDB_BASE}/random.php`, {
        signal: AbortSignal.timeout(15000),
      })
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
    );

    const results = await Promise.allSettled(promises);
    const meals: Record<string, string>[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.meals?.[0]) {
        meals.push(result.value.meals[0]);
      }
    }

    // Convert to summary format
    const recipes = meals.map((meal) => ({
      id: `api-${meal.idMeal}`,
      name: meal.strMeal,
      image: meal.strMealThumb,
      category: meal.strCategory || 'Unknown',
      area: meal.strArea || 'Unknown',
      hasVideo: !!meal.strYoutube,
    }));

    return NextResponse.json({
      meals: recipes,
      source: 'TheMealDB',
      total: recipes.length,
    });
  } catch (error) {
    console.error('[API /recipes/random] Error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil resep acak', meals: [], total: 0 },
      { status: 500 }
    );
  }
}
