'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Clock, X } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { useTranslation } from '@/hooks/useTranslation';
import { recipes, getRecipeById } from '@/lib/recipes';
import type { Recipe } from '@/types';

const difficultyColor: Record<string, string> = {
  Mudah: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  Sedang: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  Susah: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

function FavoriteCard({
  recipe,
  onUnfavorite,
  onClick,
  t,
}: {
  recipe: Recipe;
  onUnfavorite: () => void;
  onClick: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      className="overflow-hidden rounded-2xl nm-raised shadow-sm hover:shadow-md transition-shadow"
    >
      <div onClick={onClick} className="cursor-pointer">
        {/* Emoji image area */}
        <div className="relative flex h-24 items-center justify-center bg-[var(--nm-bg)]">
          <span className="text-4xl">{recipe.image}</span>
          {/* Unfavorite button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              onUnfavorite();
            }}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-colors hover:bg-rose-50 dark:bg-black/50 dark:hover:bg-rose-500/20"
            aria-label={t('recipes.removeFromFavorite')}
          >
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
          </motion.button>
        </div>
        <div className="p-2.5">
          <h4 className="text-[13px] font-semibold leading-tight truncate">{recipe.name}</h4>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {recipe.cookTime} {t('recipes.min')}
            </span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${difficultyColor[recipe.difficulty]}`}>
              {recipe.difficulty}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function FavoritePage() {
  const favoriteRecipeIds = useAppStore((s) => s.favoriteRecipes);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const setSelectedRecipe = useAppStore((s) => s.setSelectedRecipe);
  const setScreen = useAppStore((s) => s.setScreen);
  const { t } = useTranslation();

  const favoriteRecipesData = useMemo(
    () =>
      favoriteRecipeIds
        .map((id) => getRecipeById(id))
        .filter(Boolean) as Recipe[],
    [favoriteRecipeIds],
  );

  const handleUnfavorite = (recipeId: string) => {
    toggleFavorite(recipeId);
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setScreen('recipe-detail');
  };

  const handleBack = () => {
    setScreen('profile');
  };

  return (
    <div className="min-h-screen bg-[var(--nm-bg)]">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex flex-col pb-60"
      >
        {/* ── Header ─────────────────────────────────── */}
        <header className="sticky top-0 z-20 glass">
          <div className="flex items-center gap-3 px-4 py-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleBack}
              className="flex h-9 w-9 items-center justify-center rounded-full nm-raised-sm transition-colors hover:bg-accent"
              aria-label={t('common.back')}
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </motion.button>
            <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Heart className="h-5 w-5 text-rose-500" />
              {t('favorites.title')}
            </h1>
            <span className="ml-auto text-xs text-muted-foreground">
              {favoriteRecipesData.length}
            </span>
          </div>
        </header>

        {/* ── Content ───────────────────────────────── */}
        <div className="px-4 pt-4">
          {favoriteRecipesData.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {favoriteRecipesData.map((recipe) => (
                <FavoriteCard
                  key={recipe.id}
                  recipe={recipe}
                  onUnfavorite={() => handleUnfavorite(recipe.id)}
                  onClick={() => handleRecipeClick(recipe)}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <motion.div
              variants={fadeUp}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10">
                <Heart className="h-10 w-10 text-rose-300 dark:text-rose-500/50" />
              </div>
              <h3 className="mt-4 text-base font-semibold">
                {t('favorites.empty')}
              </h3>
              <p className="mt-1 max-w-[250px] text-sm text-muted-foreground">
                {t('favorites.emptyDesc')}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default FavoritePage;
