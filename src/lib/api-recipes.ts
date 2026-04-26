/* ── TheMealDB API Service ────────────────────────────────────
 *  100% gratis, tanpa API key, tanpa batas permintaan.
 *  Data di-cache di Next.js server (revalidate).
 *  Fallback ke resep lokal saat offline / error.
 * ───────────────────────────────────────────────────────────── */

import type { Recipe } from '@/types';

const API_BASE = '/api/recipes';

/* ── Search recipes ── */
export async function searchApiRecipes(query: string): Promise<ApiSearchResult> {
  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    console.warn('[ApiRecipeService] Search failed, returning empty');
    return { meals: [], total: 0, source: 'offline' };
  }
}

/* ── Search by category ── */
export async function searchByCategory(category: string): Promise<ApiSearchResult> {
  try {
    const res = await fetch(`${API_BASE}/search?category=${encodeURIComponent(category)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { meals: [], total: 0, source: 'offline' };
  }
}

/* ── Get full recipe detail ── */
export async function getApiRecipeDetail(id: string): Promise<Recipe | null> {
  try {
    // Strip "api-" prefix if present
    const mealId = id.replace(/^api-/, '');
    const res = await fetch(`${API_BASE}/detail?id=${encodeURIComponent(mealId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.recipe || null;
  } catch {
    console.warn('[ApiRecipeService] Detail fetch failed');
    return null;
  }
}

/* ── Get random recipes ── */
export async function getRandomRecipes(): Promise<ApiSearchResult> {
  try {
    const res = await fetch(`${API_BASE}/random`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return { meals: [], total: 0, source: 'offline' };
  }
}

/* ── Get categories ── */
export async function getApiCategories(): Promise<ApiCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.categories || [];
  } catch {
    return [];
  }
}

/* ── Types ── */
export interface ApiSearchResult {
  meals: ApiMeal[] | Recipe[];
  total: number;
  source: string;
  summary?: boolean;
}

export interface ApiMeal {
  id: string;
  name: string;
  image: string;
  category: string;
  area: string;
  hasVideo?: boolean;
}

export interface ApiCategory {
  id: string;
  name: string;
  description: string;
  image: string;
}
