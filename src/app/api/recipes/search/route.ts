import { NextRequest, NextResponse } from 'next/server';

const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const area = searchParams.get('area') || '';
    const ingredient = searchParams.get('ingredient') || '';

    let url = '';

    if (query) {
      url = `${THEMEALDB_BASE}/search.php?s=${encodeURIComponent(query)}`;
    } else if (category) {
      url = `${THEMEALDB_BASE}/filter.php?c=${encodeURIComponent(category)}`;
    } else if (area) {
      url = `${THEMEALDB_BASE}/filter.php?a=${encodeURIComponent(area)}`;
    } else if (ingredient) {
      url = `${THEMEALDB_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`;
    } else {
      return NextResponse.json(
        { error: 'Parameter q, category, area, atau ingredient diperlukan' },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache 1 jam
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`TheMealDB API error: ${res.status}`);
    }

    const data = await res.json();

    // For filter endpoints, we get limited data - need to fetch full details
    let meals = data.meals || [];

    // If search returned full meals, return them
    if (meals.length > 0 && meals[0].strInstructions) {
      return NextResponse.json({
        meals: meals.map(convertMealToRecipe),
        source: 'TheMealDB',
        total: meals.length,
      });
    }

    // For filter endpoints, return summary data
    if (meals.length > 0) {
      return NextResponse.json({
        meals: meals.map((m: Record<string, string>) => ({
          id: m.idMeal,
          name: m.strMeal,
          image: m.strMealThumb,
          category: m.strCategory || 'Unknown',
          area: m.strArea || 'Unknown',
        })),
        source: 'TheMealDB',
        total: meals.length,
        summary: true, // Indicates this is summary data without full instructions
      });
    }

    return NextResponse.json({
      meals: [],
      source: 'TheMealDB',
      total: 0,
    });
  } catch (error) {
    console.error('[API /recipes/search] Error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data resep', meals: [], total: 0 },
      { status: 500 }
    );
  }
}

/* ── Helper: Convert TheMealDB meal to our Recipe format ── */
function convertMealToRecipe(meal: Record<string, string>) {
  const ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    category: string;
  }> = [];
  const measureFields = Object.keys(meal).filter((k) =>
    k.startsWith('strMeasure')
  );
  const ingredientFields = Object.keys(meal).filter((k) =>
    k.startsWith('strIngredient')
  );

  for (let i = 0; i < 20; i++) {
    const ing = meal[`strIngredient${i + 1}`];
    const measure = meal[`strMeasure${i + 1}`];
    if (ing && ing.trim()) {
      ingredients.push({
        name: ing.trim(),
        amount: parseAmount(measure || ''),
        unit: parseUnit(measure || ''),
        category: guessCategory(ing.trim()),
      });
    }
  }

  // Parse instructions into steps
  const instructions = meal.strInstructions || '';
  const steps = instructions
    .split(/\r?\n/)
    .map((s) => s.replace(/^[\d.)\s]+/, '').trim())
    .filter((s) => s.length > 10);

  // Fallback if no clear steps found
  if (steps.length === 0 && instructions.length > 0) {
    steps.push(instructions.trim());
  }

  // Map category to our format
  const category = mapCategory(meal.strCategory || 'Miscellaneous');
  const difficulty = mapDifficulty(meal.strCategory || '');

  // Extract YouTube ID for video
  let youtubeUrl = '';
  if (meal.strYoutube) {
    youtubeUrl = meal.strYoutube;
  }

  return {
    id: `api-${meal.idMeal}`,
    name: meal.strMeal,
    description: `${meal.strArea || 'International'} | ${meal.strCategory || 'Miscellaneous'}`,
    image: meal.strMealThumb || '',
    category,
    difficulty,
    cookTime: 30, // TheMealDB doesn't provide this
    prepTime: 15,
    servings: 2,
    calories: 0, // Not provided
    ingredients,
    steps,
    tags: [
      meal.strArea?.toLowerCase() || 'international',
      meal.strCategory?.toLowerCase() || 'misc',
      'api-recipe',
    ].filter(Boolean),
    rating: 4.0 + Math.random() * 0.9, // Random 4.0-4.9
    youtubeUrl,
    source: meal.strSource || '',
    sourceName: 'TheMealDB',
  };
}

function parseAmount(measure: string): number {
  const match = measure.match(/[\d./]+/);
  if (!match) return 1;
  const val = match[0];
  if (val.includes('/')) {
    const parts = val.split('/');
    return parts.length === 2
      ? parseFloat(parts[0]) / parseFloat(parts[1])
      : 1;
  }
  return parseFloat(val) || 1;
}

function parseUnit(measure: string): string {
  return measure
    .replace(/[\d./\s]+/g, '')
    .trim() || 'secukupnya';
}

function guessCategory(ingredient: string): string {
  const lower = ingredient.toLowerCase();
  const proteinWords = [
    'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'lamb',
    'turkey', 'bacon', 'sausage', 'egg', 'prawn', 'tuna', 'tofu',
    'tempeh', 'chicken', 'meat', 'mince',
  ];
  const vegWords = [
    'onion', 'garlic', 'tomato', 'carrot', 'potato', 'pepper', 'lettuce',
    'spinach', 'broccoli', 'mushroom', 'corn', 'peas', 'celery', 'cabbage',
    'zucchini', 'cucumber', 'ginger', 'chili', 'capsicum',
  ];
  const dairyWords = [
    'milk', 'cheese', 'cream', 'butter', 'yogurt', 'cream cheese',
  ];
  const grainWords = [
    'flour', 'rice', 'bread', 'pasta', 'noodle', 'oats', 'sugar',
    'starch', 'cornmeal', 'tortilla',
  ];
  const sauceWords = [
    'sauce', 'oil', 'vinegar', 'soy', 'worcest', 'ketchup', 'stock',
    'broth', 'wine', 'rum', 'essence',
  ];
  const spiceWords = [
    'salt', 'pepper', 'cumin', 'paprika', 'cinnamon', 'oregano',
    'basil', 'thyme', 'rosemary', 'turmeric', 'coriander', 'ginger',
    'nutmeg', 'bay', 'parsley', 'mint', 'chili powder', 'curry',
  ];

  if (proteinWords.some((w) => lower.includes(w))) return 'Protein';
  if (vegWords.some((w) => lower.includes(w))) return 'Sayuran';
  if (dairyWords.some((w) => lower.includes(w))) return 'Bumbu';
  if (grainWords.some((w) => lower.includes(w))) return 'Bahan Utama';
  if (sauceWords.some((w) => lower.includes(w))) return 'Bumbu';
  if (spiceWords.some((w) => lower.includes(w))) return 'Bumbu';
  return 'Bahan Utama';
}

function mapCategory(cat: string): string {
  const map: Record<string, string> = {
    Breakfast: 'Sarapan',
    'Starter': 'Snack',
    'Side': 'Snack',
    Snack: 'Snack',
    Dessert: 'Dessert',
    'Main Course': 'Makan Siang',
    Lunch: 'Makan Siang',
    Dinner: 'Makan Malam',
  };
  // Check if it's a Western category
  const westernCats = [
    'Beef', 'Chicken', 'Goat', 'Lamb', 'Miscellaneous',
    'Pasta', 'Pork', 'Seafood', 'Vegetarian', 'Vegan',
  ];
  if (westernCats.includes(cat)) return 'Western';
  return map[cat] || 'Western';
}

function mapDifficulty(cat: string): string {
  const hardCats = ['Dessert', 'Lamb', 'Seafood', 'Goat'];
  const easyCats = ['Breakfast', 'Side', 'Starter', 'Snack'];
  if (hardCats.includes(cat)) return 'Susah';
  if (easyCats.includes(cat)) return 'Mudah';
  return 'Sedang';
}
