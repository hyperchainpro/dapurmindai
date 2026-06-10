import { NextRequest, NextResponse } from 'next/server';

const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';

    if (!id) {
      return NextResponse.json(
        { error: 'Parameter id diperlukan' },
        { status: 400 }
      );
    }

    const url = `${THEMEALDB_BASE}/lookup.php?i=${encodeURIComponent(id)}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error(`TheMealDB API error: ${res.status}`);
    }

    const data = await res.json();
    const meal = data.meals?.[0];

    if (!meal) {
      return NextResponse.json(
        { error: 'Resep tidak ditemukan' },
        { status: 404 }
      );
    }

    // Convert to our Recipe format
    const ingredients: Array<{
      name: string;
      amount: number;
      unit: string;
      category: string;
    }> = [];

    for (let i = 1; i <= 20; i++) {
      const ing = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ing && ing.trim()) {
        ingredients.push({
          name: ing.trim(),
          amount: parseAmount(measure || ''),
          unit: parseUnit(measure || ''),
          category: guessCategory(ing.trim()),
        });
      }
    }

    // Parse instructions
    const instructions = meal.strInstructions || '';
    const steps = instructions
      .split(/\r?\n/)
      .map((s) => s.replace(/^[\d.)\s]+/, '').trim())
      .filter((s) => s.length > 10);

    if (steps.length === 0 && instructions.length > 0) {
      steps.push(instructions.trim());
    }

    // Deterministic rating based on meal id
    const rating = deterministicRating(meal.idMeal || '0');

    const recipe = {
      id: `api-${meal.idMeal}`,
      name: meal.strMeal,
      description: `${meal.strArea || 'International'} | ${meal.strCategory || 'Miscellaneous'}. ${instructions.substring(0, 120)}...`,
      image: meal.strMealThumb || '',
      category: mapCategory(meal.strCategory || 'Miscellaneous'),
      difficulty: mapDifficulty(meal.strCategory || ''),
      cookTime: 30,
      prepTime: 15,
      servings: 2,
      calories: Math.round(200 + Math.random() * 400),
      ingredients,
      steps,
      tags: [
        meal.strArea?.toLowerCase() || 'international',
        meal.strCategory?.toLowerCase() || 'misc',
        'api-recipe',
      ].filter(Boolean),
      rating,
      youtubeUrl: meal.strYoutube || '',
      source: meal.strSource || '',
      sourceName: 'TheMealDB',
      originalId: meal.idMeal,
    };

    return NextResponse.json({ recipe, source: 'TheMealDB' });
  } catch (error) {
    console.error('[API /recipes/detail] Error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil detail resep' },
      { status: 500 }
    );
  }
}

function deterministicRating(id: string): number {
  // Simple hash-based deterministic rating between 4.0 and 4.9
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return 4.0 + (Math.abs(hash) % 10) / 10;
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
  return measure.replace(/[\d./\s]+/g, '').trim() || 'secukupnya';
}

function guessCategory(ingredient: string): string {
  const lower = ingredient.toLowerCase();
  const proteinWords = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'lamb', 'turkey', 'bacon', 'sausage', 'egg', 'prawn', 'tuna', 'tofu', 'meat', 'mince'];
  const vegWords = ['onion', 'garlic', 'tomato', 'carrot', 'potato', 'pepper', 'lettuce', 'spinach', 'broccoli', 'mushroom', 'corn', 'peas', 'celery', 'cabbage', 'zucchini', 'cucumber', 'chili', 'capsicum'];
  const dairyWords = ['milk', 'cheese', 'cream', 'butter', 'yogurt'];
  const grainWords = ['flour', 'rice', 'bread', 'pasta', 'noodle', 'oats', 'sugar', 'starch', 'tortilla'];
  if (proteinWords.some((w) => lower.includes(w))) return 'Protein';
  if (vegWords.some((w) => lower.includes(w))) return 'Sayuran';
  if (dairyWords.some((w) => lower.includes(w))) return 'Bumbu';
  if (grainWords.some((w) => lower.includes(w))) return 'Bahan Utama';
  return 'Bahan Utama';
}

function mapCategory(cat: string): string {
  const map: Record<string, string> = {
    Breakfast: 'Sarapan', Starter: 'Snack', Side: 'Snack', Snack: 'Snack',
    Dessert: 'Dessert', 'Main Course': 'Makan Siang', Lunch: 'Makan Siang', Dinner: 'Makan Malam',
  };
  const westernCats = ['Beef', 'Chicken', 'Goat', 'Lamb', 'Miscellaneous', 'Pasta', 'Pork', 'Seafood', 'Vegetarian', 'Vegan'];
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
