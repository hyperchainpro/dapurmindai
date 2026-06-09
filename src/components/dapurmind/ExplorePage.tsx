'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppState';
import {
  Heart,
  MessageCircle,
  Clock,
  Star,
  X,
  Compass,
  TrendingUp,
  Zap,
  Flame,
  ChevronDown,
  Loader2,
  ArrowLeft,
  Share2,
  BookmarkPlus,
  Play,
} from 'lucide-react';
import { Marquee } from '@/components/dapurmind/MagicUI';
import { GlowingText, Bounce, ClickSpark } from '@/components/dapurmind/ReactBits';
import { AdSlot } from '@/components/dapurmind/AdSlot';

/* ── Types ─────────────────────────────────────────── */

interface ExploreRecipe {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  difficulty: string;
  cookTime: number;
  prepTime: number;
  servings: number;
  likes: number;
  tags: string;
  youtubeUrl?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
    displayName: string;
    bio: string;
    followers: number;
    totalRecipes: number;
  };
}

interface CategoryStat {
  [key: string]: number;
}

const EXPLORE_CATEGORIES = [
  'Semua', 'Sarapan', 'Makan Siang', 'Makan Malam', 'Snack', 'Minuman', 'Dessert', 'Western', 'Lainnya',
];

const SORT_OPTIONS = [
  { label: 'Terbaru', value: 'latest', icon: Zap },
  { label: 'Terpopuler', value: 'popular', icon: TrendingUp },
  { label: 'Tercepat', value: 'fastest', icon: Clock },
];

const TRENDING_TAGS = [
  'Nasi Goreng', 'Rendang', 'Ayam Geprek', 'Mie Ayam', 'Bakso',
  'Sate', 'Martabak', 'Es Teh', 'Pancake', 'Salad',
  'Pasta', 'Burger', 'Steak', 'Takoyaki', 'Dim Sum',
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Mudah: 'bg-emerald-500/90 text-white',
  Sedang: 'bg-amber-500/90 text-white',
  Susah: 'bg-rose-500/90 text-white',
};

const EMOJI_GRADIENTS: string[] = [
  'from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30',
  'from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/30',
  'from-emerald-100 to-green-100 dark:from-emerald-900/40 dark:to-green-900/30',
  'from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/30',
  'from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/30',
  'from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/30',
  'from-lime-100 to-green-100 dark:from-lime-900/40 dark:to-green-900/30',
  'from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/30',
];

/* ── Helper ────────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} mnt`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari`;
  const months = Math.floor(days / 30);
  return `${months} bln`;
}

function getGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return EMOJI_GRADIENTS[Math.abs(hash) % EMOJI_GRADIENTS.length];
}

/* ── Main Component ────────────────────────────────── */

export default function ExplorePage() {
  const { setScreen } = useAppStore();

  const [recipes, setRecipes] = useState<ExploreRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [activeSort, setActiveSort] = useState('latest');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStat>({});
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [selectedRecipe, setSelectedRecipe] = useState<ExploreRecipe | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch recipes
  const fetchRecipes = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams({ sort: activeSort, limit: '20' });
      if (activeCategory !== 'Semua') params.set('category', activeCategory);
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`/api/explore?${params}`);
      const json = await res.json();

      if (json.success) {
        if (cursor) {
          setRecipes((prev) => [...prev, ...json.data]);
        } else {
          setRecipes(json.data);
        }
        setNextCursor(json.nextCursor);
        if (json.categoryStats) setCategoryStats(json.categoryStats);
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeSort, activeCategory]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    setRecipes([]);
    setNextCursor(null);
    fetchRecipes();
  }, [fetchRecipes]);

  // Infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!loadMoreRef.current || !nextCursor) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          fetchRecipes(nextCursor);
        }
      },
      { threshold: 0.5 }
    );

    observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [nextCursor, fetchRecipes]);

  // Handle like
  const handleLike = useCallback(async (e: React.MouseEvent, recipe: ExploreRecipe) => {
    e.stopPropagation();
    const isLiked = likedIds.has(recipe.id);
    setLikedIds((prev) => {
      const next = new Set(prev);
      isLiked ? next.delete(recipe.id) : next.add(recipe.id);
      return next;
    });

    try {
      await fetch('/api/creator/recipes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recipe.id, action: isLiked ? 'unlike' : 'like' }),
      });
    } catch {}
  }, [likedIds]);

  // Handle tag click
  const handleTagClick = useCallback((tag: string) => {
    setActiveCategory('Semua');
    setActiveSort('latest');
  }, []);

  const SortIcon = SORT_OPTIONS.find((s) => s.value === activeSort)?.icon || Zap;

  return (
    <div className="min-h-screen bg-[var(--nm-bg)]">
      <div className="flex flex-col pb-24">
        {/* ── Header ─────────────────────────────────── */}
        <header className="sticky top-0 z-20 glass">
          <div className="space-y-3 px-4 pb-3 pt-4">
            {/* Title row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setScreen('recipes')}
                  className="nm-raised-sm flex h-8 w-8 items-center justify-center rounded-full"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  <GlowingText color="amber" intensity={1}>
                    Explore
                  </GlowingText>
                </h1>
              </div>

              {/* Sort picker */}
              <div className="relative">
                <button
                  onClick={() => setShowSortPicker(!showSortPicker)}
                  className="nm-raised-sm flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                >
                  <SortIcon className="h-3 w-3" />
                  {SORT_OPTIONS.find((s) => s.value === activeSort)?.label}
                </button>
                <AnimatePresence>
                  {showSortPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-full z-30 mt-2 w-40 overflow-hidden rounded-xl nm-raised"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setActiveSort(opt.value);
                            setShowSortPicker(false);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors ${
                            activeSort === opt.value
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <opt.icon className="h-3.5 w-3.5" />
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Category pills */}
            <div className="scroll-strip-sm">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
                {EXPLORE_CATEGORIES.map((cat) => {
                  const count = categoryStats[cat];
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? 'nm-raised-sm bg-emerald-500 text-white'
                          : 'nm-btn text-muted-foreground'
                      }`}
                    >
                      {cat}
                      {count !== undefined && (
                        <span className={`ml-1 text-[10px] ${isActive ? 'text-white/80' : 'text-muted-foreground/60'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        {/* ── Trending Tags Marquee ─────────────────── */}
        <section className="py-2.5">
          <Marquee speed={30} pauseOnHover gap={10}>
            {TRENDING_TAGS.map((tag, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleTagClick(tag)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-xs font-medium text-amber-800 shadow-sm transition-colors hover:from-amber-100 hover:to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-300"
              >
                <Flame className="h-3 w-3 text-orange-500" />
                {tag}
              </motion.button>
            ))}
          </Marquee>
        </section>

        {/* ── Recipe Grid (Instagram-style) ─────────── */}
        <AdSlot position="explore-before-grid" />
        <section className="px-3 pt-2">
          {loading && recipes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm text-muted-foreground">Menjelajahi resep...</p>
            </div>
          ) : error && recipes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Bounce intensity={2} repeat>
                <div className="text-6xl">📡</div>
              </Bounce>
              <div>
                <h3 className="text-base font-semibold text-foreground">Gagal memuat</h3>
                <p className="mt-1 text-xs text-muted-foreground">Periksa koneksi dan coba lagi</p>
              </div>
              <button
                onClick={() => { setLoading(true); fetchRecipes(); }}
                className="nm-btn-primary rounded-full px-5 py-2 text-sm font-medium text-white"
              >
                Coba Lagi
              </button>
            </div>
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Bounce intensity={2} repeat>
                <div className="text-6xl">🍳</div>
              </Bounce>
              <div>
                <h3 className="text-base font-semibold text-foreground">Belum ada resep</h3>
                <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                  Jadilah kreator pertama yang berbagi resep di sini!
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 3-column grid like Instagram Explore */}
              <div className="grid grid-cols-3 gap-1">
                {recipes.map((recipe, idx) => (
                  <ExploreGridCard
                    key={recipe.id}
                    recipe={recipe}
                    index={idx}
                    isLiked={likedIds.has(recipe.id)}
                    onLike={(e) => handleLike(e, recipe)}
                    onTap={() => setSelectedRecipe(recipe)}
                  />
                ))}
              </div>

              {/* Load more trigger */}
              {nextCursor && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                </div>
              )}

              {/* End of feed */}
              {!nextCursor && recipes.length > 0 && (
                <p className="pb-4 pt-6 text-center text-xs text-muted-foreground/60">
                  {recipes.length} resep dari komunitas
                </p>
              )}
            </>
          )}
        </section>

        {/* Ad: after grid */}
        <AdSlot position="explore-after-grid" />

        {/* ── Recipe Detail Modal (Instagram-style) ── */}
        <AnimatePresence>
          {selectedRecipe && (
            <RecipeDetailModal
              recipe={selectedRecipe}
              isLiked={likedIds.has(selectedRecipe.id)}
              onLike={(e) => handleLike(e, selectedRecipe)}
              onClose={() => setSelectedRecipe(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Instagram Grid Card ───────────────────────────── */

function ExploreGridCard({
  recipe,
  index,
  isLiked,
  onLike,
  onTap,
}: {
  recipe: ExploreRecipe;
  index: number;
  isLiked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onTap: () => void;
}) {
  const [showOverlay, setShowOverlay] = useState(false);
  const isEmoji = recipe.image && recipe.image.length <= 4;
  const gradient = getGradient(recipe.id);
  const isLarge = index % 9 === 4; // Every 5th item (in 3-col grid) is large

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={`animate-in fade-in-0 cursor-pointer overflow-hidden rounded-md ${
        isLarge ? 'col-span-2 row-span-2' : ''
      }`}
      onClick={onTap}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
      onTouchStart={() => setShowOverlay(true)}
      onTouchEnd={() => setTimeout(() => setShowOverlay(false), 1500)}
    >
      {/* Image area */}
      <div
        className={`relative w-full overflow-hidden bg-gradient-to-br ${gradient} ${
          isLarge ? 'aspect-square' : 'aspect-square'
        }`}
      >
        {isEmoji ? (
          <span className={`absolute inset-0 flex items-center justify-center ${isLarge ? 'text-8xl' : 'text-5xl'}`}>
            {recipe.image}
          </span>
        ) : recipe.image ? (
          <img
            src={recipe.image}
            alt={recipe.name}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
            loading="lazy"
          />
        ) : (
          <span className={`absolute inset-0 flex items-center justify-center ${isLarge ? 'text-8xl' : 'text-5xl'}`}>
            🍽️
          </span>
        )}

        {/* Video badge */}
        {recipe.youtubeUrl && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded bg-black/60 px-1 py-0.5">
            <Play className="h-2.5 w-2.5 text-white" fill="white" />
            <span className="text-[8px] font-bold text-white">VIDEO</span>
          </div>
        )}

        {/* Difficulty pill */}
        <span
          className={`absolute top-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-[8px] font-bold ${DIFFICULTY_COLORS[recipe.difficulty] || 'bg-gray-500/90 text-white'}`}
        >
          {recipe.difficulty}
        </span>

        {/* Hover/tap overlay (Instagram style) */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center gap-6 bg-black/40 backdrop-blur-[2px]"
              onClick={(e) => { e.stopPropagation(); onLike(e); }}
            >
              <div className="flex items-center gap-1.5 text-white">
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span className="text-sm font-bold">{recipe.likes + (isLiked ? 1 : 0)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-bold">{recipe.cookTime + recipe.prepTime}m</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info below (only for large cards) */}
      {isLarge && (
        <div className="bg-[var(--nm-bg)] p-2">
          <p className="line-clamp-2 text-xs font-semibold text-foreground">{recipe.name}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-[8px] font-bold text-white">
              {recipe.user.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-[10px] text-muted-foreground">{recipe.user.displayName}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ── Recipe Detail Modal (Instagram Post Style) ───── */

function RecipeDetailModal({
  recipe,
  isLiked,
  onLike,
  onClose,
}: {
  recipe: ExploreRecipe;
  isLiked: boolean;
  onLike: (e: React.MouseEvent) => void;
  onClose: () => void;
}) {
  const [showAllSteps, setShowAllSteps] = useState(false);
  const isEmoji = recipe.image && recipe.image.length <= 4;
  const gradient = getGradient(recipe.id);
  let parsedSteps: string[] = [];
  let parsedIngredients: string[] = [];
  let parsedTags: string[] = [];
  try { parsedSteps = JSON.parse(recipe.tags ? recipe.tags : '[]'); } catch {}
  try { parsedIngredients = JSON.parse(recipe.ingredients); } catch {}
  try { parsedTags = JSON.parse(recipe.tags); } catch {}

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-t-3xl bg-[var(--nm-bg)] sm:rounded-3xl"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 24px)' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2">
            {/* Close */}
            <button onClick={onClose} className="nm-raised-sm flex h-7 w-7 items-center justify-center rounded-full">
              <X className="h-3.5 w-3.5" />
            </button>

            {/* User info */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white">
                {recipe.user.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{recipe.user.displayName}</p>
                <p className="text-[10px] text-muted-foreground">{timeAgo(recipe.createdAt)}</p>
              </div>
            </div>

            {/* Follow button */}
            <button className="nm-btn-primary shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold text-white">
              Follow
            </button>
          </div>

          {/* Recipe image */}
          <div className={`relative mx-4 overflow-hidden rounded-xl bg-gradient-to-br ${gradient}`}>
            <div className="aspect-square w-full">
              {isEmoji ? (
                <span className="flex h-full items-center justify-center text-9xl">{recipe.image}</span>
              ) : recipe.image ? (
                <img src={recipe.image} alt={recipe.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-9xl">🍽️</span>
              )}
            </div>

            {/* Video overlay */}
            {recipe.youtubeUrl && (
              <a
                href={recipe.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/20"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg">
                  <Play className="h-6 w-6 text-rose-500 ml-0.5" fill="currentColor" />
                </div>
              </a>
            )}

            {/* Difficulty badge */}
            <span
              className={`absolute bottom-2 left-2 rounded-lg px-2 py-1 text-[10px] font-bold ${DIFFICULTY_COLORS[recipe.difficulty] || ''}`}
            >
              {recipe.difficulty}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={onLike}
                className="flex h-9 w-9 items-center justify-center rounded-full"
              >
                <Heart
                  className={`h-6 w-6 transition-colors ${
                    isLiked ? 'fill-rose-500 text-rose-500' : 'text-foreground'
                  }`}
                />
              </motion.button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full">
                <MessageCircle className="h-6 w-6 text-foreground" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-full">
                <Share2 className="h-5 w-5 text-foreground" />
              </button>
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-full">
              <BookmarkPlus className="h-5 w-5 text-foreground" />
            </button>
          </div>

          {/* Likes */}
          <div className="px-4 pb-1">
            <p className="text-sm font-bold text-foreground">
              {recipe.likes + (isLiked ? 1 : 0)} suka
            </p>
          </div>

          {/* Caption */}
          <div className="px-4 pb-2">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{recipe.user.displayName}</span>{' '}
              <span className="text-muted-foreground">{recipe.description}</span>
            </p>
          </div>

          {/* Tags */}
          {parsedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-3">
              {parsedTags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Details card */}
          <div className="mx-4 mb-3 rounded-xl nm-raised p-3">
            <h3 className="text-base font-bold text-foreground">{recipe.name}</h3>

            {/* Meta row */}
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {recipe.prepTime + recipe.cookTime} mnt
              </span>
              <span className="flex items-center gap-1">
                <span className="text-xs">👨‍🍳</span>
                {recipe.difficulty}
              </span>
              <span className="flex items-center gap-1">
                <span className="text-xs">🍽️</span>
                {recipe.servings} porsi
              </span>
            </div>

            {/* Ingredients */}
            {parsedIngredients.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold text-foreground mb-1.5">Bahan-bahan</h4>
                <div className="space-y-0.5">
                  {parsedIngredients.slice(0, showAllSteps ? undefined : 5).map((ing, i) => (
                    <p key={i} className="text-xs text-muted-foreground">• {ing}</p>
                  ))}
                </div>
                {parsedIngredients.length > 5 && !showAllSteps && (
                  <button
                    onClick={() => setShowAllSteps(true)}
                    className="mt-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    +{parsedIngredients.length - 5} bahan lainnya...
                  </button>
                )}
              </div>
            )}

            {/* Category pill */}
            <div className="mt-3">
              <span className="inline-flex rounded-full bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {recipe.category}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}