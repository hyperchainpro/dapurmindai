'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppState';
import {
  recipes,
  searchRecipes,
  getRecipesByCategory,
} from '@/lib/recipes';
import { Marquee } from '@/components/dapurmind/MagicUI';
import { GlowingText, Bounce, ClickSpark } from '@/components/dapurmind/ReactBits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Heart, Search, Clock, ChevronRight, Star, X, Sparkles, Flame } from 'lucide-react';
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

const FEATURED_TAGS = [
  'Nasi Goreng 🍳',
  'Rendang 🥩',
  'Sate Ayam 🍢',
  'Mie Goreng 🍜',
  'Bakso 🥣',
  'Soto Ayam 🍲',
  'Gado-Gado 🥗',
  'Klepon 🟢',
  'Pisang Goreng 🍌',
  'Es Campur 🍧',
  'Pizza 🍕',
  'Pasta 🍝',
  'Burger 🍔',
  'Steak 🥩',
  'Pancake 🥞',
  'Salad 🥗',
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
  '🥔': 'from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/30',
  '🫘': 'from-amber-100 to-stone-100 dark:from-amber-900/40 dark:to-stone-800/30',
  '🥬': 'from-green-100 to-lime-100 dark:from-green-900/40 dark:to-lime-900/30',
  '🌶️': 'from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/30',
  '🧊': 'from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/30',
  '🍧': 'from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/30',
  '🟢': 'from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/30',
  '🍌': 'from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/30',
  '🥞': 'from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/30',
,
  '🍕': 'from-red-100 to-amber-100 dark:from-red-900/40 dark:to-amber-900/30',
  '🍝': 'from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/30',
  '🍔': 'from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30',
  '🥪': 'from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/30',
  '🌮': 'from-lime-100 to-green-100 dark:from-lime-900/40 dark:to-green-900/30',
  '🥘': 'from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/30',
  '🍳': 'from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/30',
  '🧁': 'from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/30',
  '🍰': 'from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/30',
  '🥧': 'from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30',
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

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | 'Semua'>('Semua');
  const [showFilter, setShowFilter] = useState(false);
  const [maxCookTime, setMaxCookTime] = useState(180);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Debounce search
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter recipes
  const filteredRecipes = useMemo(() => {
    let result: Recipe[];

    // Category filter
    if (activeCategory === 'Semua') {
      result = [...recipes];
    } else {
      result = getRecipesByCategory(activeCategory);
    }

    // Search filter
    if (debouncedQuery.trim()) {
      const searched = searchRecipes(debouncedQuery.trim());
      const searchIds = new Set(searched.map((r) => r.id));
      result = result.filter((r) => searchIds.has(r.id));
    }

    // Cook time filter
    if (maxCookTime < 180) {
      result = result.filter(
        (r) => r.cookTime + r.prepTime <= maxCookTime
      );
    }

    // Difficulty filter
    if (selectedDifficulty) {
      result = result.filter((r) => r.difficulty === selectedDifficulty);
    }

    return result;
  }, [activeCategory, debouncedQuery, maxCookTime, selectedDifficulty]);

  // Handle recipe click
  const handleRecipeClick = useCallback(
    (recipe: Recipe) => {
      setSelectedRecipe(recipe);
      setScreen('recipe-detail');
    },
    [setSelectedRecipe, setScreen]
  );

  // Handle favorite toggle
  const handleToggleFavorite = useCallback(
    (e: React.MouseEvent, recipeId: string) => {
      e.stopPropagation();
      toggleFavorite(recipeId);
    },
    [toggleFavorite]
  );

  // Handle featured tag click
  const handleFeaturedTagClick = useCallback((tag: string) => {
    const name = tag.replace(/\s*[^\w\s]\s*$/, '').trim();
    setSearchQuery(name);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setMaxCookTime(180);
    setSelectedDifficulty(null);
    setShowFilter(false);
  }, []);

  const hasActiveFilters = maxCookTime < 180 || selectedDifficulty !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-stone-50/50 to-white dark:from-background dark:via-stone-950/20 dark:to-background">
      <div className="flex flex-col pb-24">
        {/* ── Header ───────────────────────────────────── */}
        <header className="sticky top-0 z-20 border-b border-border/50 bg-white/90 backdrop-blur-xl dark:bg-background/90">
          <div className="space-y-3 px-4 pb-3 pt-4">
            {/* Title row */}
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                <GlowingText color="amber" intensity={1}>
                  Resep
                </GlowingText>{' '}
                Nusantara
              </h1>
              <Button
                variant={showFilter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilter(!showFilter)}
                className={`rounded-full text-xs ${
                  showFilter
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : hasActiveFilters
                      ? 'border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400'
                      : ''
                }`}
              >
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Filter
                {hasActiveFilters && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                    !
                  </span>
                )}
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari resep favoritmu..."
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
          </div>

          {/* Filter Panel */}
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
                  {/* Max Cook Time */}
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

                  {/* Difficulty Filter */}
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

                  {/* Clear filters */}
                  {hasActiveFilters && (
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ── Featured Marquee ─────────────────────────── */}
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

        {/* ── Category Tabs ────────────────────────────── */}
        <section className="px-4">
          <div ref={scrollRef} className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`relative shrink-0 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat.label}
                  {isActive && (
                    <motion.div
                      layoutId="category-indicator"
                      className="absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-emerald-500"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Recipe Grid ──────────────────────────────── */}
        <section className="px-4 pt-3">
          {filteredRecipes.length > 0 ? (
            <motion.div
              className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-3"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
            >
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  isFavorite={favoriteRecipes.includes(recipe.id)}
                  onClick={() => handleRecipeClick(recipe)}
                  onToggleFavorite={(e) => handleToggleFavorite(e, recipe.id)}
                />
              ))}
            </motion.div>
          ) : (
            /* Empty state */
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
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('Semua');
                  clearFilters();
                }}
                className="mt-2 rounded-full text-xs"
              >
                Reset Pencarian
              </Button>
            </motion.div>
          )}
        </section>

        {/* Results count */}
        {filteredRecipes.length > 0 && (
          <div className="px-4 pt-4 pb-2 text-center">
            <p className="text-[11px] text-muted-foreground/60">
              Menampilkan {filteredRecipes.length} dari {recipes.length} resep
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Recipe Card ────────────────────────────────────────────── */

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

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24, filter: 'blur(3px)' },
        visible: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
    >
      <ClickSpark color="emerald" count={6}>
        <motion.div
          onClick={onClick}
          whileTap={{ scale: 0.97 }}
          className="group cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/8"
        >
          {/* Emoji Image */}
          <div className={`relative flex h-28 items-center justify-center bg-gradient-to-br ${bgColor}`}>
            <motion.span
              className="text-5xl"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {recipe.image}
            </motion.span>

            {/* Favorite button */}
            <motion.button
              onClick={onToggleFavorite}
              whileTap={{ scale: 0.7 }}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-colors hover:bg-white dark:bg-black/40 dark:hover:bg-black/60"
              aria-label={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isFavorite ? [1, 1.3, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={`h-3.5 w-3.5 transition-colors ${
                    isFavorite
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                />
              </motion.div>
            </motion.button>

            {/* Difficulty badge */}
            <span
              className={`absolute bottom-2 left-2 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${DIFFICULTY_COLORS[recipe.difficulty]}`}
            >
              {recipe.difficulty}
            </span>
          </div>

          {/* Info */}
          <div className="space-y-1.5 p-2.5">
            {/* Recipe name */}
            <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
              {recipe.name}
            </h3>

            {/* Time & Rating */}
            <div className="flex items-center justify-between gap-1">
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {recipe.cookTime + recipe.prepTime} mnt
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px]">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {recipe.rating.toFixed(1)}
                </span>
              </span>
            </div>

            {/* Category tag */}
            <div className="pt-0.5">
              <span className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {recipe.category}
              </span>
            </div>
          </div>
        </motion.div>
      </ClickSpark>
    </motion.div>
  );
}

/* ── ChefHat icon inline (needed for filter label) ──────────── */

function ChefHat({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
      <line x1="6" x2="18" y1="17" y2="17" />
    </svg>
  );
}

export default RecipeBrowser;
