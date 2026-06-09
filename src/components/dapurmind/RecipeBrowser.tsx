'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppState';
import {
  recipes,
  searchRecipes,
  getRecipesByCategory,
} from '@/lib/recipes';
import {
  searchApiRecipes,
  searchByCategory,
  getApiRecipeDetail,
  getRandomRecipes,
  getApiCategories,
  type ApiMeal,
  type ApiCategory,
} from '@/lib/api-recipes';
import { Marquee } from '@/components/dapurmind/MagicUI';
import { GlowingText, Bounce, ClickSpark } from '@/components/dapurmind/ReactBits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Heart, Search, Clock, Star, X, Sparkles, Flame, Globe2, Wifi, WifiOff, RefreshCw, Loader2, Play, ChevronDown, Compass } from 'lucide-react';
import type { Recipe, RecipeCategory } from '@/types';

/* ── Constants ──────────────────────────────────────────────── */

const CATEGORIES: { label: string; value: RecipeCategory | 'Semua' }[] = [
  { label: 'Semua', value: 'Semua' },
  { label: 'Sarapan', value: 'Sarapan' },
  { label: 'Makan Siang', value: 'Makan Siang' },
  { label: 'Makan Malam', value: 'Makan Malam' },
  { label: 'Snack', value: 'Snack' },
  { label: 'Minuman', value: 'Minuman' },
  { label: 'Dessert', value: 'Dessert' },
  { label: 'Western', value: 'Western' },
];

const API_CATEGORIES = [
  'Semua', 'Beef', 'Chicken', 'Dessert', 'Lamb', 'Miscellaneous',
  'Pasta', 'Pork', 'Seafood', 'Side', 'Starter', 'Vegan', 'Vegetarian', 'Breakfast',
];

const FEATURED_TAGS = [
  'Nasi Goreng', 'Rendang', 'Sate Ayam', 'Mie Goreng', 'Bakso',
  'Soto Ayam', 'Pizza', 'Pasta', 'Burger', 'Steak', 'Pancake', 'Salad',
];

const EMOJI_BG_COLORS: Record<string, string> = {
  '🍛': 'from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30',
  '🍜': 'from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/30',
  '🍗': 'from-orange-100 to-rose-100 dark:from-orange-900/40 dark:to-rose-900/30',
  '🍲': 'from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/30',
  '🥩': 'from-rose-100 to-red-100 dark:from-rose-900/40 dark:to-red-900/30',
  '🥗': 'from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/30',
  '🍚': 'from-stone-100 to-amber-100 dark:from-stone-800/40 dark:to-amber-900/30',
  '🥣': 'from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30',
  '🍢': 'from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/30',
  '🥔': 'from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-amber-900/30',
  '🫘': 'from-amber-100 to-stone-100 dark:from-amber-900/40 dark:to-stone-800/30',
  '🥬': 'from-green-100 to-lime-100 dark:from-green-900/40 dark:to-lime-900/30',
  '🌶️': 'from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/30',
  '🧊': 'from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/30',
  '🍧': 'from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/30',
  '🟢': 'from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/30',
  '🍌': 'from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/30',
  '🥞': 'from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-amber-900/30',
  '🍕': 'from-red-100 to-amber-100 dark:from-red-900/40 dark:to-amber-900/30',
  '🍝': 'from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-amber-900/30',
  '🍔': 'from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-amber-900/30',
  '🥪': 'from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/30',
  '🌮': 'from-lime-100 to-green-100 dark:from-lime-900/40 dark:to-green-900/30',
  '🥘': 'from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/30',
  '🍳': 'from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/30',
  '🧁': 'from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/30',
  '🍰': 'from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/30',
  '🥧': 'from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-amber-900/30',
  '🌭': 'from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/30',
  '🧀': 'from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/30',
  '🥐': 'from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-amber-900/30',
  '🥖': 'from-amber-100 to-stone-100 dark:from-amber-900/40 dark:to-stone-800/30',
  '🥙': 'from-green-100 to-lime-100 dark:from-green-900/40 dark:to-lime-900/30',
  '🌿': 'from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/30',
  '🍖': 'from-rose-100 to-red-100 dark:from-rose-900/40 dark:to-red-900/30',
  '🥟': 'from-amber-100 to-stone-100 dark:from-amber-900/40 dark:to-stone-800/30',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Mudah: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Sedang: 'bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Susah: 'bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

/* ── Main Component ────────────────────────────────────────── */

export function RecipeBrowser() {
  const { setSelectedRecipe, setScreen, favoriteRecipes, toggleFavorite } = useAppStore();

  // Mode: 'local' or 'api'
  const [mode, setMode] = useState<'local' | 'api'>('local');

  // Shared state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(50);

  // Local mode state
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | 'Semua'>('Semua');
  const [maxCookTime, setMaxCookTime] = useState(180);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  // API mode state
  const [apiCategory, setApiCategory] = useState('Semua');
  const [apiMeals, setApiMeals] = useState<ApiMeal[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Debounce search
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Local filtering ──
  const filteredRecipes = useMemo(() => {
    let result: Recipe[];
    if (activeCategory === 'Semua') {
      result = [...recipes];
    } else {
      result = getRecipesByCategory(activeCategory);
    }
    if (debouncedQuery.trim()) {
      const searched = searchRecipes(debouncedQuery.trim());
      const searchIds = new Set(searched.map((r) => r.id));
      result = result.filter((r) => searchIds.has(r.id));
    }
    if (maxCookTime < 180) {
      result = result.filter((r) => r.cookTime + r.prepTime <= maxCookTime);
    }
    if (selectedDifficulty) {
      result = result.filter((r) => r.difficulty === selectedDifficulty);
    }
    return result;
  }, [activeCategory, debouncedQuery, maxCookTime, selectedDifficulty]);

  useEffect(() => {
    setVisibleCount(50);
  }, [activeCategory, debouncedQuery, maxCookTime, selectedDifficulty]);

  const paginatedRecipes = filteredRecipes.slice(0, visibleCount);
  const hasMore = visibleCount < filteredRecipes.length;

  // ── API search effect ──
  useEffect(() => {
    if (mode !== 'api') return;

    let cancelled = false;
    async function fetchApi() {
      setApiLoading(true);
      setApiError(false);

      try {
        let result;
        if (debouncedQuery.trim()) {
          result = await searchApiRecipes(debouncedQuery.trim());
        } else if (apiCategory !== 'Semua') {
          result = await searchByCategory(apiCategory);
        } else {
          // Load random recipes as default
          result = await getRandomRecipes();
        }

        if (!cancelled) {
          setApiMeals((result.meals || []) as ApiMeal[]);
        }
      } catch {
        if (!cancelled) {
          setApiError(true);
          setApiMeals([]);
        }
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    }

    fetchApi();
    return () => { cancelled = true; };
  }, [mode, debouncedQuery, apiCategory]);

  // ── Handle recipe click ──
  const handleRecipeClick = useCallback(
    (recipe: Recipe) => {
      setSelectedRecipe(recipe);
      setScreen('recipe-detail');
    },
    [setSelectedRecipe, setScreen]
  );

  // ── Handle API recipe click (fetch full detail first) ──
  const handleApiRecipeClick = useCallback(
    async (meal: ApiMeal) => {
      // Show a loading state
      const id = meal.id.replace(/^api-/, '');
      const detail = await getApiRecipeDetail(id);
      if (detail) {
        setSelectedRecipe(detail);
        setScreen('recipe-detail');
      }
    },
    [setSelectedRecipe, setScreen]
  );

  // ── Handle favorite toggle ──
  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent, recipeId: string) => {
      e.stopPropagation();
      toggleFavorite(recipeId);
    },
    [toggleFavorite]
  );

  // ── Handle featured tag click ──
  const handleFeaturedTagClick = useCallback((tag: string) => {
    setSearchQuery(tag);
  }, []);

  // ── Clear filters ──
  const clearFilters = useCallback(() => {
    setMaxCookTime(180);
    setSelectedDifficulty(null);
    setShowFilter(false);
  }, []);

  // ── Refresh API ──
  const refreshApi = useCallback(() => {
    setSearchQuery('');
    setApiCategory('Semua');
  }, []);

  const hasActiveFilters = maxCookTime < 180 || selectedDifficulty !== null;

  return (
    <div className="min-h-screen bg-[var(--nm-bg)]">
      <div className="flex flex-col pb-24">
        {/* ── Header ───────────────────────────────────── */}
        <header className="sticky top-0 z-20 glass">
          <div className="space-y-3 px-4 pb-3 pt-4">
            {/* Title row with mode toggle */}
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                <GlowingText color="amber" intensity={1}>
                  Resep
                </GlowingText>{' '}
                {mode === 'api' ? 'Global' : 'Nusantara'}
              </h1>
              <div className="flex items-center gap-1.5">
                {/* Filter button (local mode only) */}
                {mode === 'local' && filteredRecipes.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilter(!showFilter)}
                    className="rounded-full text-xs"
                  >
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    Filter
                  </Button>
                )}
                {mode === 'local' && filteredRecipes.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('Semua');
                      clearFilters();
                    }}
                    className="rounded-full text-xs"
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Reset
                  </Button>
                )}
                {/* Filter button (API mode) */}
                {mode === 'api' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilter(!showFilter)}
                    className="rounded-full text-xs"
                  >
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    Filter
                  </Button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={mode === 'api' ? 'Cari resep dari seluruh dunia...' : 'Cari resep favoritmu...'}
                className="h-10 rounded-xl border-border/50 bg-muted/40 pl-9 pr-9 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-emerald-400/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Mode Toggle: Lokal / Global / Explore */}
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <div className="flex items-center rounded-full border border-border/60 bg-muted/40 p-1">
                <button
                  onClick={() => setMode('local')}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    mode === 'local'
                      ? 'nm-raised-sm bg-emerald-600 text-white'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  <Wifi className="h-3.5 w-3.5" />
                  Lokal
                </button>
                <button
                  onClick={() => setMode('api')}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    mode === 'api'
                      ? 'nm-raised-sm bg-blue-600 text-white'
                      : 'text-foreground/60 hover:text-foreground'
                  }`}
                >
                  <Globe2 className="h-3.5 w-3.5" />
                  Global
                </button>
              </div>
              <button
                onClick={() => setScreen('explore')}
                className="nm-raised-sm flex items-center gap-1.5 rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-amber-700 active:scale-95"
              >
                <Compass className="h-3.5 w-3.5" />
                Explore
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {(mode === 'local' || mode === 'api') && (
            <AnimatePresence>
              {showFilter && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-border/30"
                >
                  <div className="space-y-4 px-4 py-3">
                    {/* Category filter (API mode) */}
                    {mode === 'api' && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          <Globe2 className="mr-1 inline h-3 w-3" />
                          Kategori Masakan Dunia
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {API_CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => {
                                setApiCategory(apiCategory === cat ? 'Semua' : cat);
                                setSearchQuery('');
                              }}
                              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                                apiCategory === cat
                                  ? 'nm-raised-sm bg-blue-500 text-white'
                                  : 'nm-btn text-muted-foreground'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Max Cook Time (local mode) */}
                    {mode === 'local' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">
                          <Clock className="mr-1 inline h-3 w-3" />
                          Waktu Masak Maks.
                        </label>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {maxCookTime} menit
                        </span>
                      </div>
                      <Slider
                        value={[maxCookTime]}
                        onValueChange={(v) => setMaxCookTime(v[0])}
                        min={5}
                        max={180}
                        step={5}
                        className="[&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&>span:first-child]:bg-emerald-200 dark:[&>span:first-child]:bg-emerald-800"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground/60">
                        <span>5 mnt</span>
                        <span>3 jam</span>
                      </div>
                    </div>
                    )}

                    {/* Difficulty Filter (local mode) */}
                    {mode === 'local' && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        <ChefHat className="mr-1 inline h-3 w-3" />
                        Tingkat Kesulitan
                      </label>
                      <div className="flex gap-2">
                        {['Mudah', 'Sedang', 'Susah'].map((d) => (
                          <button
                            key={d}
                            onClick={() =>
                              setSelectedDifficulty(selectedDifficulty === d ? null : d)
                            }
                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                              selectedDifficulty === d
                                ? DIFFICULTY_COLORS[d]
                                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                    )}

                    {/* Clear filter buttons */}
                    {mode === 'local' && hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="w-full text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="mr-1 h-3 w-3" />
                        Hapus semua filter
                      </Button>
                    )}
                    {mode === 'api' && apiCategory !== 'Semua' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setApiCategory('Semua'); setSearchQuery(''); }}
                        className="w-full text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="mr-1 h-3 w-3" />
                        Reset filter kategori
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </header>

        {/* ── API Mode Banner ── */}
        {mode === 'api' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2.5 dark:from-blue-900/20 dark:to-indigo-900/20"
          >
            <Globe2 className="h-4 w-4 text-blue-500" />
            <p className="text-[11px] text-blue-700 dark:text-blue-300">
              Resep dari <b>TheMealDB</b> — 300+ resep internasional, gratis selamanya!
            </p>
          </motion.div>
        )}

        {/* ── Featured Marquee ── */}
        <section className="py-3">
          <Marquee speed={35} pauseOnHover gap={12}>
            {FEATURED_TAGS.map((tag, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleFeaturedTagClick(tag)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-xs font-medium text-amber-800 shadow-sm transition-colors hover:from-amber-100 hover:to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-300 dark:hover:from-amber-900/50 dark:hover:to-orange-900/50"
              >
                <Flame className="h-3 w-3 text-orange-500" />
                {tag}
              </motion.button>
            ))}
          </Marquee>
        </section>

        {/* ── Category Tabs ── */}
        <div className="scroll-strip-sm mx-4">
          <div ref={scrollRef} className="flex gap-1 overflow-x-auto no-scrollbar py-1 px-1">
            {(mode === 'api' ? API_CATEGORIES : CATEGORIES).map((cat) => {
              const catLabel = typeof cat === 'string' ? cat : cat.label;
              const catValue = typeof cat === 'string' ? cat : cat.value;
              const isActive = mode === 'api'
                ? apiCategory === catLabel
                : activeCategory === catValue;

              return (
                <button
                  key={catLabel}
                  onClick={() => {
                    if (mode === 'api') {
                      setApiCategory(catLabel);
                      setSearchQuery('');
                    } else {
                      setActiveCategory(catValue as RecipeCategory | 'Semua');
                    }
                  }}
                  className={`relative shrink-0 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? mode === 'api'
                        ? 'nm-raised-sm text-blue-700 dark:text-blue-300'
                        : 'nm-raised-sm text-emerald-700 dark:text-emerald-300'
                      : 'nm-btn text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {catLabel}
                  {isActive && (
                    <motion.div
                      layoutId="category-indicator"
                      className={`absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full ${
                        mode === 'api' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Recipe Grid ── */}
        <section className="px-4 pt-3">
          {mode === 'local' && (
            /* Local recipes */
            filteredRecipes.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  {paginatedRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      isFavorite={favoriteRecipes.includes(recipe.id)}
                      onClick={() => handleRecipeClick(recipe)}
                      onToggleFavorite={(e) => handleToggleFavorite(e, recipe.id)}
                    />
                  ))}
                </div>
                {hasMore && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 flex flex-col items-center gap-2"
                  >
                    <p className="text-xs text-muted-foreground">
                      Menampilkan {paginatedRecipes.length} dari {filteredRecipes.length} resep
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVisibleCount((prev) => prev + 50)}
                      className="rounded-full border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                    >
                      <ChevronDown className="mr-1 h-4 w-4" />
                      Muat 50 Resep Berikutnya
                    </Button>
                  </motion.div>
                )}
                {!hasMore && filteredRecipes.length > 50 && (
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Semua {filteredRecipes.length} resep ditampilkan
                  </p>
                )}
              </>
            ) : (
              <EmptyState
                onReset={() => {
                  setSearchQuery('');
                  setActiveCategory('Semua');
                  clearFilters();
                }}
              />
            )
          )}

          {mode === 'api' && (
            /* API recipes */
            apiLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-16"
              >
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-muted-foreground">Mencari resep...</p>
              </motion.div>
            ) : apiError ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 py-16 text-center"
              >
                <div className="text-5xl">📡</div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Gagal mengambil data
                  </h3>
                  <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">
                    Periksa koneksi internet Anda, atau coba lagi nanti
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshApi}
                  className="mt-2 rounded-full text-xs"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Coba Lagi
                </Button>
              </motion.div>
            ) : apiMeals.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">
                {apiMeals.map((meal) => (
                  <ApiRecipeCard
                    key={meal.id}
                    meal={meal}
                    isFavorite={favoriteRecipes.includes(meal.id)}
                    onClick={() => handleApiRecipeClick(meal)}
                    onToggleFavorite={(e) => handleToggleFavorite(e, meal.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                onReset={() => {
                  setSearchQuery('');
                  setApiCategory('Semua');
                }}
              />
            )
          )}
        </section>

        {/* Results count */}
        <div className="px-4 pt-4 pb-2 text-center">
          <p className="text-[11px] text-muted-foreground/60">
            {mode === 'local'
              ? filteredRecipes.length > 50
                ? `Menampilkan ${paginatedRecipes.length} dari ${filteredRecipes.length} resep lokal`
                : `${filteredRecipes.length} resep lokal`
              : apiMeals.length > 0
                ? `Ditemukan ${apiMeals.length} resep global`
                : ''
            }
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Local Recipe Card ────────────────────────────────────── */

function RecipeCard({
  recipe,
  isFavorite,
  onClick,
  onToggleFavorite,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}) {
  const bgColor = EMOJI_BG_COLORS[recipe.image] || 'from-gray-100 to-gray-50 dark:from-gray-800/40 dark:to-gray-900/30';
  const isApi = recipe.id.startsWith('api-');
  const isWestern = recipe.category === 'Western';
  const hasRealImage = isApi && recipe.image && !recipe.image.startsWith('data:');
  const localImagePath = (isWestern ? `/recipes/western/${recipe.id}.jpg` : `/recipes/${recipe.id}.jpg`);

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300">
      <ClickSpark color="emerald" count={6}>
        <div
          onClick={onClick}
          className="group cursor-pointer overflow-hidden rounded-xl nm-raised shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 active:scale-[0.97]"
        >
          {/* Image */}
          <div className={`relative flex h-24 items-center justify-center bg-gradient-to-br ${bgColor} overflow-hidden`}>
            {hasRealImage ? (
              <img
                src={recipe.image}
                alt={recipe.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <img
                src={localImagePath}
                alt={recipe.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (!img.dataset.triedApi) {
                    img.dataset.triedApi = '1';
                    const params = new URLSearchParams({
                      id: recipe.id,
                      name: recipe.name,
                      western: String(isWestern),
                    });
                    img.src = `/api/recipe-image?${params.toString()}`;
                  } else {
                    img.style.display = 'none';
                    const parent = img.parentElement;
                    if (parent && !parent.querySelector('.emoji-fallback')) {
                      const span = document.createElement('span');
                      span.className = 'emoji-fallback text-5xl';
                      span.textContent = recipe.image;
                      parent.appendChild(span);
                    }
                  }
                }}
              />
            )}

            {/* API badge */}
            {isApi && (
              <span className="absolute left-2 top-2 rounded-md bg-blue-500/90 px-1.5 py-0.5 text-[8px] font-bold text-white">
                GLOBAL
              </span>
            )}

            {/* Video badge */}
            {recipe.youtubeUrl && (
              <span className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-md bg-red-500/90 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm">
                <Play className="h-2 w-2" />
                VIDEO
              </span>
            )}

            {/* Favorite button */}
            <button
              onClick={onToggleFavorite}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white active:scale-90 dark:bg-black/40 dark:hover:bg-black/60"
              aria-label={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
            >
              <Heart
                className={`h-3.5 w-3.5 transition-colors ${
                  isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-500 dark:text-gray-400'
                }`}
              />
            </button>

            {/* Difficulty badge */}
            <span
              className={`absolute bottom-2 left-2 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${DIFFICULTY_COLORS[recipe.difficulty]}`}
            >
              {recipe.difficulty}
            </span>
          </div>

          {/* Info */}
          <div className="space-y-1 p-2">
            <h3 className="line-clamp-2 text-[12px] font-semibold leading-snug text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
              {recipe.name}
            </h3>
            <div className="flex items-center justify-between gap-1">
              <span className="inline-flex items-center gap-1 text-[9px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {recipe.cookTime + recipe.prepTime} mnt
              </span>
              <span className="inline-flex items-center gap-0.5 text-[9px]">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {recipe.rating.toFixed(1)}
                </span>
              </span>
            </div>
            <div className="pt-0.5">
              <span className="inline-flex items-center rounded-md bg-muted/60 px-1 py-0.5 text-[8px] text-muted-foreground">
                {recipe.category}
              </span>
            </div>
          </div>
        </div>
      </ClickSpark>
    </div>
  );
}

/* ── API Recipe Card (with real images) ───────────────────── */

function ApiRecipeCard({
  meal,
  isFavorite,
  onClick,
  onToggleFavorite,
}: {
  meal: ApiMeal;
  isFavorite: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-3 duration-300">
      <div
        onClick={onClick}
        className="group cursor-pointer overflow-hidden rounded-xl nm-raised shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/8 active:scale-[0.97]"
      >
        {/* Real image from API */}
        <div className="relative h-24 overflow-hidden bg-muted/30">
          {meal.image ? (
            <img
              src={meal.image}
              alt={meal.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl">🍽️</span>
            </div>
          )}

          {/* Global badge */}
          <span className="absolute left-2 top-2 rounded-md bg-blue-500/90 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm">
            GLOBAL
          </span>

          {/* Video badge */}
          {(meal.hasVideo || meal.strYoutube) && (
            <a
              href={meal.strYoutube || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 right-2 flex items-center gap-0.5 rounded-md bg-red-500/90 px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm"
            >
              <Play className="h-2 w-2" />
              VIDEO
            </a>
          )}

          {/* Favorite */}
          <button
            onClick={onToggleFavorite}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white active:scale-90 dark:bg-black/40 dark:hover:bg-black/60"
          >
            <Heart
              className={`h-3.5 w-3.5 transition-colors ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-500 dark:text-gray-400'
              }`}
            />
          </button>
        </div>

        {/* Info */}
        <div className="space-y-1 p-2">
          <h3 className="line-clamp-2 text-[12px] font-semibold leading-snug text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300">
            {meal.name}
          </h3>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-muted-foreground">{meal.area}</span>
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
              {meal.category}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Empty State ──────────────────────────────────────────── */

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <Bounce intensity={2} repeat>
        <div className="text-6xl">🔍</div>
      </Bounce>
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Resep tidak ditemukan
        </h3>
        <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
          Coba ubah kata kunci pencarian atau pilih kategori lain
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="mt-2 rounded-full text-xs"
      >
        Reset Pencarian
      </Button>
    </motion.div>
  );
}

/* ── ChefHat SVG ──────────────────────────────────────────── */

function ChefHat({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
      <line x1="6" x2="18" y1="17" y2="17" />
    </svg>
  );
}

export default RecipeBrowser;
