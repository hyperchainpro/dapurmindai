import { NextResponse } from 'next/server';

const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

export async function GET() {
  try {
    const res = await fetch(`${THEMEALDB_BASE}/categories.php`, {
      next: { revalidate: 86400 }, // Cache 24 jam
    });

    if (!res.ok) {
      throw new Error(`TheMealDB API error: ${res.status}`);
    }

    const data = await res.json();
    const categories = (data.categories || []).map(
      (cat: Record<string, string>) => ({
        id: cat.idCategory,
        name: cat.strCategory,
        description: cat.strCategoryDescription,
        image: cat.strCategoryThumb,
      })
    );

    return NextResponse.json({ categories, source: 'TheMealDB' });
  } catch (error) {
    console.error('[API /recipes/categories] Error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil kategori', categories: [] },
      { status: 500 }
    );
  }
}
