'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Share2,
  ShoppingCart,
  Flame,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Star,
  Sparkles,
  ExternalLink,
  Play,
  Globe2,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import type { Ingredient, Recipe } from '@/types';
import { NumberTicker } from '@/components/dapurmind/MagicUI';
import { ShineBorder } from '@/components/dapurmind/MagicUI';
import { Bounce, ClickSpark } from '@/components/dapurmind/ReactBits';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AFFILIATE_MARKETPLACES, buildAffiliateUrl } from '@/lib/affiliate';
/* ── Helpers ──────────────────────────────────────────────────── */

/* Fallback food images from Unsplash (free, no API key needed) */
const FOOD_IMAGE_MAP: Record<string, string> = {
  // Indonesian savory
  'nasi-goreng': 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=400&fit=crop',
  'mie-goreng': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&h=400&fit=crop',
  'ayam-goreng': 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&h=400&fit=crop',
  'soto-ayam': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop',
  'rendang': 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=600&h=400&fit=crop',
  'gado-gado': 'https://images.unsplash.com/photo-1512058533999-30b0e4408760?w=600&h=400&fit=crop',
  'nasi-padang': 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&h=400&fit=crop',
  'bakso': 'https://images.unsplash.com/photo-1583032015879-e5022cb87c3b?w=600&h=400&fit=crop',
  'sate-ayam': 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=600&h=400&fit=crop',
  'nasi-uduk': 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&h=400&fit=crop',
  'bubur-ayam': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
  'perkedel': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&h=400&fit=crop',
  'tempe-orek': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&h=400&fit=crop',
  'sayur-asem': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop',
  'plecing-kangkung': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
  'rawon': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop',
  'pempek': 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=600&h=400&fit=crop',
  'tahu-gejrot': 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=600&h=400&fit=crop',
  'opor-ayam': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&h=400&fit=crop',
  'martabak-telur': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
  'kolak': 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&h=400&fit=crop',
  // Indonesian desserts & drinks
  'es-teh-manis': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=400&fit=crop',
  'es-campur': 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&h=400&fit=crop',
  'klepon': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=400&fit=crop',
  'pisang-goreng': 'https://images.unsplash.com/photo-1600326145552-327f74b9c189?w=600&h=400&fit=crop',
  'martabak-manis': 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&h=400&fit=crop',
  // Western - Breakfast
  'w-classic-pancakes': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop',
  'w-french-toast': 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&h=400&fit=crop',
  'w-eggs-benedict': 'https://images.unsplash.com/photo-1608039829572-9b0189bbe57f?w=600&h=400&fit=crop',
  'w-avocado-toast': 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=600&h=400&fit=crop',
  'w-omelette': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=400&fit=crop',
  'w-smoothie-bowl': 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=400&fit=crop',
  'w-overnight-oats': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600&h=400&fit=crop',
  'w-belgian-waffles': 'https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=600&h=400&fit=crop',
  'w-breakfast-burrito': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=400&fit=crop',
  'w-bircher-muesli': 'https://images.unsplash.com/photo-1571748982800-fa51082c2224?w=600&h=400&fit=crop',
  'w-bagel-with-cream-cheese': 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=600&h=400&fit=crop',
  'w-bacon-eggs': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&h=400&fit=crop',
  'w-banana-bread': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&h=400&fit=crop',
  'w-blueberry-muffins': 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&h=400&fit=crop',
  'w-breakfast-casserole': 'https://images.unsplash.com/photo-1534938665245-537ded2b5e3f?w=600&h=400&fit=crop',
  'w-acai-bowl': 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=400&fit=crop',
  'w-granola-yogurt': 'https://images.unsplash.com/photo-1571748982800-fa51082c2224?w=600&h=400&fit=crop',
  // Western - Mains
  'w-beef-burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop',
  'w-margherita-pizza': 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop',
  'w-alfredo-pasta': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&h=400&fit=crop',
  'w-grilled-salmon': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop',
  'w-chicken-parmesan': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&h=400&fit=crop',
  'w-steak-frites': 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&h=400&fit=crop',
  'w-fish-tacos': 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&h=400&fit=crop',
  'w-beef-stew': 'https://images.unsplash.com/photo-1534938665245-537ded2b5e3f?w=600&h=400&fit=crop',
  'w-chicken-stir-fry': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop',
  'w-shepherds-pie': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&h=400&fit=crop',
  'w-bbribs': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop',
  'w-caesar-salad': 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&h=400&fit=crop',
  'w-blt-sandwich': 'https://images.unsplash.com/photo-1619096252214-ef06c45683e3?w=600&h=400&fit=crop',
  'w-beef-tacos': 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&h=400&fit=crop',
  'w-chicken-curry': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop',
  'w-lasagna': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&h=400&fit=crop',
  'w-chicken-wings': 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&h=400&fit=crop',
  'w-shrimp-scampi': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop',
  'w-pork-chops': 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&h=400&fit=crop',
  'w-mushroom-risotto': 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&h=400&fit=crop',
  // Western - Sides & Soups
  'w-garlic-bread': 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=600&h=400&fit=crop',
  'w-garden-salad': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop',
  'w-french-onion-soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop',
  'w-baked-potato': 'https://images.unsplash.com/photo-1518977676601-b53f82ber633?w=600&h=400&fit=crop',
  'w-bruschetta': 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&h=400&fit=crop',
  'w-mac-and-cheese': 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=600&h=400&fit=crop',
  'w-coleslaw': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop',
  'w-mashed-potatoes': 'https://images.unsplash.com/photo-1518977676601-b53f82ber633?w=600&h=400&fit=crop',
  'w-tomato-soup': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop',
  // Western - Desserts
  'w-chocolate-cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop',
  'w-tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop',
  'w-cheesecake-bites': 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=600&h=400&fit=crop',
  'w-apple-pie': 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=600&h=400&fit=crop',
  'w-brownies': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=400&fit=crop',
  'w-creme-brulee': 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&h=400&fit=crop',
  'w-banana-split': 'https://images.unsplash.com/photo-1432457990754-c8b5f21448de?w=600&h=400&fit=crop',
  'w-carrot-cake': 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600&h=400&fit=crop',
  'w-strawberry-shortcake': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=400&fit=crop',
  'w-ice-cream-sundae': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&h=400&fit=crop',
};

/* Category-based fallback images for recipes without specific mapping */
const CATEGORY_FALLBACKS: Record<string, string[]> = {
  'Sarapan': [
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&h=400&fit=crop',
  ],
  'Makan Siang': [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&h=400&fit=crop',
  ],
  'Makan Malam': [
    'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
  ],
  'Snack': [
    'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1600326145552-327f74b9c189?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&h=400&fit=crop',
  ],
  'Minuman': [
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop',
  ],
  'Dessert': [
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop',
  ],
  'Western': [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop',
  ],
};

function getFallbackImageUrl(recipe: Recipe): string | null {
  // Check specific recipe ID mapping first
  if (FOOD_IMAGE_MAP[recipe.id]) {
    return FOOD_IMAGE_MAP[recipe.id];
  }

  // Fall back to category-based images using recipe ID hash for consistency
  const fallbacks = CATEGORY_FALLBACKS[recipe.category] || CATEGORY_FALLBACKS['Western'];
  if (!fallbacks || fallbacks.length === 0) return null;

  // Use recipe ID to deterministically pick an image
  let hash = 0;
  for (let i = 0; i < recipe.id.length; i++) {
    hash = ((hash << 5) - hash + recipe.id.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % fallbacks.length;
  return fallbacks[index];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Mudah: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  Sedang: 'bg-amber-100/80 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  Susah: 'bg-rose-100/80 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

const EMOJI_GRADIENTS: Record<string, string> = {
  '🍛': 'from-amber-200 via-orange-200 to-yellow-200 dark:from-amber-800/60 dark:via-orange-800/50 dark:to-yellow-900/40',
  '🍜': 'from-yellow-200 via-amber-200 to-orange-200 dark:from-yellow-800/60 dark:via-amber-800/50 dark:to-orange-900/40',
  '🍗': 'from-orange-200 via-rose-200 to-amber-200 dark:from-orange-800/60 dark:via-rose-800/50 dark:to-amber-900/40',
  '🍲': 'from-amber-200 via-yellow-200 to-orange-200 dark:from-amber-800/60 dark:via-yellow-800/50 dark:to-orange-900/40',
  '🥩': 'from-rose-200 via-red-200 to-orange-200 dark:from-rose-800/60 dark:via-red-800/50 dark:to-orange-900/40',
  '🥗': 'from-green-200 via-emerald-200 to-lime-200 dark:from-green-800/60 dark:via-emerald-800/50 dark:to-lime-900/40',
  '🍚': 'from-stone-200 via-amber-100 to-yellow-100 dark:from-stone-700/60 dark:via-amber-800/50 dark:to-yellow-900/40',
  '🥣': 'from-amber-100 via-yellow-100 to-orange-100 dark:from-amber-900/50 dark:via-yellow-900/40 dark:to-orange-900/40',
  '🍢': 'from-orange-200 via-amber-200 to-yellow-200 dark:from-orange-800/60 dark:via-amber-800/50 dark:to-yellow-900/40',
  '🥔': 'from-amber-200 via-yellow-200 to-orange-200 dark:from-amber-800/60 dark:via-yellow-800/50 dark:to-orange-900/40',
  '🫘': 'from-amber-100 via-stone-100 to-orange-100 dark:from-amber-900/50 dark:via-stone-700/50 dark:to-orange-900/40',
  '🥬': 'from-green-200 via-lime-200 to-emerald-200 dark:from-green-800/60 dark:via-lime-800/50 dark:to-emerald-900/40',
  '🌶️': 'from-red-200 via-orange-200 to-amber-200 dark:from-red-800/60 dark:via-orange-800/50 dark:to-amber-900/40',
  '🧊': 'from-cyan-200 via-blue-200 to-sky-200 dark:from-cyan-800/60 dark:via-blue-800/50 dark:to-sky-900/40',
  '🍧': 'from-pink-200 via-rose-200 to-orange-200 dark:from-pink-800/60 dark:via-rose-800/50 dark:to-orange-900/40',
  '🟢': 'from-green-200 via-emerald-200 to-lime-200 dark:from-green-800/60 dark:via-emerald-800/50 dark:to-lime-900/40',
  '🍌': 'from-yellow-200 via-amber-200 to-orange-200 dark:from-yellow-800/60 dark:via-amber-800/50 dark:to-orange-900/40',
  '🥞': 'from-amber-200 via-yellow-200 to-orange-200 dark:from-amber-800/60 dark:via-yellow-800/50 dark:to-orange-900/40',
};

function getGradient(emoji: string): string {
  return EMOJI_GRADIENTS[emoji] || 'from-emerald-200 via-green-200 to-teal-200 dark:from-emerald-800/60 dark:via-green-800/50 dark:to-teal-900/40';
}

function renderStars(rating: number): React.ReactNode[] {
  const stars: React.ReactNode[] = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      );
    } else if (i - rating < 1) {
      stars.push(
        <Star key={i} className="h-3.5 w-3.5 fill-amber-400/50 text-amber-400" />
      );
    } else {
      stars.push(
        <Star key={i} className="h-3.5 w-3.5 text-muted-foreground/30" />
      );
    }
  }
  return stars;
}

/* ── Animation variants ───────────────────────────────────────── */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
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

/* ── RecipeDetailContent (inner component, keyed per-recipe) ── */

interface RecipeDetailContentProps {
  recipe: Recipe;
  goBack: () => void;
  setSelectedRecipe: (r: Recipe | null) => void;
  favoriteRecipes: string[];
  toggleFavorite: (id: string) => void;
  shoppingItems: ShoppingItem[];
  setShoppingItems: (items: ShoppingItem[]) => void;
  setScreen: (screen: AppScreen) => void;
}

function RecipeDetailContent({
  recipe,
  goBack,
  setSelectedRecipe,
  favoriteRecipes,
  toggleFavorite,
  shoppingItems,
  setShoppingItems,
  setScreen,
}: RecipeDetailContentProps) {
  const [portionScale, setPortionScale] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [ingredientsExpanded, setIngredientsExpanded] = useState(true);
  const [stepsExpanded, setStepsExpanded] = useState(true);

  // Image loading: track loaded URL with recipeId for computed gating
  const [heroImgData, setHeroImgData] = useState<{ url: string; recipeId: string } | null>(null);

  const recipeImageUrl = recipe.category === 'Western'
    ? `/recipes/western/${recipe.id}.jpg`
    : `/recipes/${recipe.id}.jpg`;
  const fallbackImageUrl = getFallbackImageUrl(recipe);

  // Only show the loaded image if it belongs to the current recipe (key-based reset handles the rest)
  const heroImgSrc = heroImgData?.recipeId === recipe.id ? heroImgData.url : null;
  const showEmoji = heroImgSrc === null;

  // Subscribe to image loading (setState only in callbacks from external Image API)
  useEffect(() => {
    if (!recipeImageUrl) return;

    const img = new Image();
    img.onload = () => {
      setHeroImgData({ url: recipeImageUrl, recipeId: recipe.id });
    };
    img.onerror = () => {
      if (fallbackImageUrl) {
        const img2 = new Image();
        img2.onload = () => {
          setHeroImgData({ url: fallbackImageUrl, recipeId: recipe.id });
        };
        img2.onerror = () => {
          setHeroImgData(null);
        };
        img2.src = fallbackImageUrl;
      } else {
        setHeroImgData(null);
      }
    };
    img.src = recipeImageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [recipeImageUrl, fallbackImageUrl, recipe.id]);

  /* ── Compute scaled values ───────────────────────── */
  const scaledServings = useMemo(
    () => Math.round((recipe.servings ?? 1) * portionScale),
    [recipe.servings, portionScale]
  );

  const scaledCalories = useMemo(
    () => Math.round((recipe.calories ?? 0) * portionScale),
    [recipe.calories, portionScale]
  );

  /* ── Group ingredients by category ───────────────── */
  const ingredientGroups = useMemo(() => {
    if (!recipe) return [];
    const groups: { category: string; items: { ingredient: Ingredient; index: number }[] }[] = [];
    const categoryOrder: string[] = [];
    recipe.ingredients.forEach((ing, idx) => {
      const cat = ing.category || 'Bahan';
      let group = groups.find((g) => g.category === cat);
      if (!group) {
        group = { category: cat, items: [] };
        groups.push(group);
        categoryOrder.push(cat);
      }
      group.items.push({ ingredient: ing, index: idx });
    });
    return groups;
  }, [recipe]);

  /* ── Handlers ────────────────────────────────────── */
  const handleToggleIngredient = useCallback((idx: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const handleToggleStep = useCallback((idx: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const handleAddToShoppingList = useCallback(() => {
    if (!recipe) return;
    const newItems = recipe.ingredients.map((ing) => ({
      id: `${recipe.id}-${ing.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: ing.name,
      amount: Math.round(ing.amount * portionScale * 100) / 100,
      unit: ing.unit,
      category: ing.category || 'Lainnya',
      checked: false,
      estimatedPrice: Math.round(Math.random() * 20000 + 2000),
    }));

    // Merge with existing items (same name → just skip or accumulate)
    const existingNames = new Set(shoppingItems.map((i) => i.name.toLowerCase()));
    const toAdd = newItems.filter((i) => !existingNames.has(i.name.toLowerCase()));

    if (toAdd.length > 0) {
      setShoppingItems([...shoppingItems, ...toAdd]);
      setScreen('shopping');
    }
  }, [recipe, portionScale, shoppingItems, setShoppingItems, setScreen]);

  const isFavorite = recipe ? favoriteRecipes.includes(recipe.id) : false;
  const isApiRecipe = recipe ? recipe.id.startsWith('api-') || (recipe.tags && recipe.tags.includes('api-recipe')) : false;

  /* ── No recipe fallback ──────────────────────────── */
  if (!recipe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <Bounce intensity={3}>
          <span className="text-6xl">🍽️</span>
        </Bounce>
        <p className="text-sm text-muted-foreground">Resep tidak ditemukan</p>
        <Button onClick={goBack} className="rounded-full">
          Kembali
        </Button>
      </div>
    );
  }

  /* ── Main render ─────────────────────────────────── */
  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex flex-col pb-32"
      >
        {/* ── Hero Section ──────────────────────────── */}
        <motion.section variants={fadeUp} className="relative">
          {/* Back button overlay */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={goBack}
            className="absolute top-4 left-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/20 shadow-md backdrop-blur-md transition-colors hover:bg-black/30"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4 w-4 text-white" />
          </motion.button>

          {/* Favorite button overlay */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => toggleFavorite(recipe.id)}
            className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black/20 shadow-md backdrop-blur-md transition-colors hover:bg-black/30"
            aria-label={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          >
            <motion.div
              initial={false}
              animate={{ scale: isFavorite ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isFavorite
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-white'
                }`}
              />
            </motion.div>
          </motion.button>

          {/* Hero: API recipe with real image or local recipe with emoji */}
          {isApiRecipe ? (
            <div className="relative h-56 overflow-hidden">
              {recipe.image && !recipe.image.startsWith('data:') && recipe.image.length > 20 ? (
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className={`flex h-full items-center justify-center bg-gradient-to-br ${getGradient(recipe.image || '🍽️')}`}>
                  <span className="text-[100px] leading-none drop-shadow-lg">{recipe.image || '🍽️'}</span>
                </div>
              )}
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              {/* API badge */}
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-blue-500/90 px-2.5 py-1 text-[10px] font-bold text-white">
                <Globe2 className="h-3 w-3" />
                Resep Global - TheMealDB
              </div>
              {/* YouTube button if available */}
              {(recipe as any).youtubeUrl && (
                <motion.a
                  href={(recipe as any).youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg"
                >
                  <Play className="h-3 w-3" />
                  Lihat Video
                </motion.a>
              )}
              {/* Fade overlay at bottom */}
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white dark:from-background" />
            </div>
          ) : (
            <div className="relative h-56 overflow-hidden bg-muted">
              {/* Real food image */}
              {heroImgSrc && !showEmoji && (
                <img
                  src={heroImgSrc}
                  alt={recipe.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}

              {/* Emoji fallback - only show when no real image available */}
              {showEmoji && (
                <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getGradient(recipe.image)}`}>
                  <motion.div
                    className="absolute inset-0 overflow-hidden"
                    aria-hidden="true"
                  >
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute h-16 w-16 rounded-full bg-white/20 dark:bg-white/10 blur-xl"
                        style={{
                          left: `${15 + i * 18}%`,
                          top: `${20 + (i % 3) * 25}%`,
                        }}
                        animate={{
                          y: [0, -12, 0],
                          opacity: [0.3, 0.6, 0.3],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 4 + i * 0.5,
                          repeat: Infinity,
                          delay: i * 0.5,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </motion.div>
                  <motion.span
                    className="relative z-10 text-[100px] leading-none drop-shadow-lg sm:text-[120px]"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {recipe.image}
                  </motion.span>
                </div>
              )}

              {/* Gradient overlay for readability */}
              {!showEmoji && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              )}

              {/* Fade overlay at bottom */}
              <div className="absolute bottom-0 inset-x-0 z-20 h-16 bg-gradient-to-t from-white dark:from-background" />
            </div>
          )}

          {/* Recipe info */}
          <div className="relative z-10 -mt-4 px-5">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-2xl font-bold tracking-tight"
            >
              {recipe.name}
            </motion.h1>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {recipe.description}
            </p>

            {/* Rating, difficulty, category */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-3 flex flex-wrap items-center gap-2"
            >
              <div className="flex items-center gap-1">
                {renderStars(recipe.rating)}
                <span className="ml-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  {recipe.rating.toFixed(1)}
                </span>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${DIFFICULTY_COLORS[recipe.difficulty]}`}>
                {recipe.difficulty}
              </span>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                {recipe.category}
              </Badge>
            </motion.div>
          </div>
        </motion.section>

        {/* ── Quick Stats Bar ───────────────────────── */}
        <motion.section variants={fadeUp} className="px-4 pt-5">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <StatChip icon="⏱️" label="Persiapan" value={`${recipe.prepTime} menit`} />
            <StatChip icon="🔥" label="Memasak" value={`${recipe.cookTime} menit`} />
            <StatChip icon="👥" label="Porsi" value={`${recipe.servings} porsi`} />
            {recipe.calories && (
              <StatChip icon="⚡" label="Kalori" value={`${recipe.calories} kkal`} />
            )}
          </div>
        </motion.section>

        {/* ── Portion Calculator ────────────────────── */}
        <motion.section variants={fadeUp} className="px-4 pt-5">
          <ShineBorder
            borderRadius={16}
            color={['#10b981', '#f59e0b', '#10b981']}
            borderWidth={1}
            duration={8}
          >
            <div className="rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold">Skalakan Porsi</h3>
              </div>
              <div className="flex items-center justify-between gap-3">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPortionScale((s) => Math.max(0.5, +(s - 0.5).toFixed(1)))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
                  disabled={portionScale <= 0.5}
                >
                  <Minus className="h-4 w-4" />
                </motion.button>

                <div className="flex-1 text-center">
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    <NumberTicker
                      key={scaledServings}
                      value={scaledServings}
                      duration={0.5}
                    />
                  </p>
                  <p className="text-xs text-muted-foreground">porsi</p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPortionScale((s) => Math.min(10, +(s + 0.5).toFixed(1)))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
                  disabled={portionScale >= 10}
                >
                  <Plus className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Scale indicator */}
              <div className="mt-2 flex items-center justify-center gap-1">
                <span className="text-[10px] text-muted-foreground">
                  {portionScale === 1
                    ? 'Porsi asli'
                    : portionScale < 1
                      ? `${Math.round(portionScale * 100)}% dari asli`
                      : `${Math.round(portionScale * 100)}% dari asli`}
                </span>
                {scaledCalories > 0 && (
                  <>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      {scaledCalories} kkal total
                    </span>
                  </>
                )}
              </div>
            </div>
          </ShineBorder>
        </motion.section>

        {/* ── Ingredients Section ───────────────────── */}
        <motion.section variants={fadeUp} className="px-4 pt-5">
          <button
            onClick={() => setIngredientsExpanded(!ingredientsExpanded)}
            className="mb-3 flex w-full items-center justify-between"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="h-4 w-4 text-emerald-500" />
              Bahan-bahan
              <span className="text-xs font-normal text-muted-foreground">
                ({recipe.ingredients.length} item)
              </span>
            </h3>
            {ingredientsExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {ingredientsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-3">
                  {ingredientGroups.map((group) => (
                    <div key={group.category}>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        {group.category}
                      </p>
                      <div className="space-y-1">
                        {group.items.map(({ ingredient, index }) => {
                          const scaledAmount =
                            Math.round(ingredient.amount * portionScale * 100) / 100;
                          const isChecked = checkedIngredients.has(index);

                          return (
                            <motion.div
                              key={index}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleToggleIngredient(index)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleToggleIngredient(index);
                                }
                              }}
                              className={`group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                                isChecked
                                  ? 'bg-muted/30'
                                  : 'hover:bg-muted/20'
                              }`}
                            >
                              <AnimatePresence mode="wait">
                                {isChecked ? (
                                  <motion.div
                                    key="checked"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="shrink-0"
                                  >
                                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="unchecked"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className="shrink-0"
                                  >
                                    <Circle className="h-4.5 w-4.5 text-muted-foreground/30" />
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm transition-all ${
                                    isChecked
                                      ? 'text-muted-foreground line-through opacity-60'
                                      : 'text-foreground font-medium'
                                  }`}
                                >
                                  {ingredient.name}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 text-xs tabular-nums transition-all ${
                                  isChecked
                                    ? 'text-muted-foreground/40'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {scaledAmount % 1 === 0 ? scaledAmount : scaledAmount.toFixed(1)}{' '}
                                {ingredient.unit}
                              </span>

                              {/* Affiliate buy icon */}
                              {!isChecked && (
                                <motion.button
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const mp = AFFILIATE_MARKETPLACES[0];
                                    window.open(
                                      buildAffiliateUrl(mp.id, ingredient.name),
                                      '_blank',
                                      'noopener,noreferrer'
                                    );
                                  }}
                                  className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 sm:opacity-60"
                                  title={`Beli ${ingredient.name}`}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </motion.button>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ── Steps Section ─────────────────────────── */}
        <motion.section variants={fadeUp} className="px-4 pt-5">
          <button
            onClick={() => setStepsExpanded(!stepsExpanded)}
            className="mb-3 flex w-full items-center justify-between"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Flame className="h-4 w-4 text-orange-500" />
              Langkah Memasak
              <span className="text-xs font-normal text-muted-foreground">
                ({recipe.steps.length} langkah)
              </span>
            </h3>
            {stepsExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <AnimatePresence>
            {stepsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-2">
                  {recipe.steps.map((step, idx) => {
                    const isDone = checkedSteps.has(idx);
                    const isActive =
                      !isDone &&
                      (idx === 0 ||
                        checkedSteps.has(idx - 1));

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04, duration: 0.3 }}
                      >
                        <ClickSpark color={isDone ? 'emerald' : isActive ? 'amber' : 'gray'} count={3}>
                          <motion.button
                            whileTap={{ scale: 0.99 }}
                            onClick={() => handleToggleStep(idx)}
                            className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                              isDone
                                ? 'border-emerald-200/50 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5'
                                : isActive
                                  ? 'border-amber-200/50 bg-amber-50/50 dark:border-amber-500/20 dark:bg-amber-500/5'
                                  : 'border-border/30 bg-card hover:border-border/60'
                            }`}
                          >
                            {/* Step number badge */}
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                isDone
                                  ? 'bg-emerald-500 text-white'
                                  : isActive
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                idx + 1
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${
                                  isDone
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : isActive
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-muted-foreground/60'
                                }`}
                              >
                                Langkah {idx + 1}
                              </p>
                              <p
                                className={`text-sm leading-relaxed transition-all ${
                                  isDone
                                    ? 'text-muted-foreground line-through opacity-60'
                                    : 'text-foreground'
                                }`}
                              >
                                {step}
                              </p>
                            </div>
                          </motion.button>
                        </ClickSpark>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Progress */}
                {recipe.steps.length > 0 && (
                  <div className="mt-3 rounded-xl bg-muted/30 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Progress memasak
                      </span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {checkedSteps.size}/{recipe.steps.length}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                        animate={{
                          width: `${(checkedSteps.size / recipe.steps.length) * 100}%`,
                        }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                      />
                    </div>
                    {checkedSteps.size === recipe.steps.length && (
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400"
                      >
                        🎉 Selamat! Semua langkah sudah selesai!
                      </motion.p>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ── Tags ───────────────────────────────────── */}
        {recipe.tags.length > 0 && (
          <motion.section variants={fadeUp} className="px-4 pt-4">
            <div className="flex flex-wrap gap-1.5">
              {recipe.tags
                .filter((t) => t !== 'api-recipe')
                .map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="rounded-full text-[10px] font-normal"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Source Link (API recipes) ──────────────── */}
        {isApiRecipe && (recipe as any).source && (
          <motion.section variants={fadeUp} className="px-4 pt-3">
            <a
              href={(recipe as any).source}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-border/30 bg-card px-4 py-3 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Lihat sumber resep asli</span>
            </a>
          </motion.section>
        )}
      </motion.div>

      {/* ── Bottom Action Buttons (fixed) ─────────── */}
      <div className="fixed bottom-[68px] inset-x-0 z-30 px-4 pb-2">
        <div className="flex gap-2 rounded-2xl nm-raised p-3 shadow-lg backdrop-blur-xl">
          {/* Favorite */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleFavorite(recipe.id)}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              isFavorite
                ? 'border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-500/20 dark:bg-rose-500/10'
                : 'border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/60'
            }`}
            aria-label={isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          >
            <motion.div
              initial={false}
              animate={{ scale: isFavorite ? [1, 1.2, 1] : 1 }}
              transition={{ duration: 0.25 }}
            >
              <Heart
                className={`h-5 w-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`}
              />
            </motion.div>
          </motion.button>

          {/* Add to Shopping List */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToShoppingList}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-2.5 text-sm font-semibold text-white shadow-nm-accent transition-all hover:from-emerald-600 hover:to-emerald-700"
          >
            <ShoppingCart className="h-4 w-4" />
            Tambah ke Daftar Belanja
          </motion.button>

          {/* Share */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/60"
            aria-label="Bagikan resep"
          >
            <Share2 className="h-5 w-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

/* ── RecipeDetail (outer component with key-based reset) ── */

export function RecipeDetail() {
  const selectedRecipe = useAppStore((s) => s.selectedRecipe);
  const setSelectedRecipe = useAppStore((s) => s.setSelectedRecipe);
  const goBack = useAppStore((s) => s.goBack);
  const favoriteRecipes = useAppStore((s) => s.favoriteRecipes);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const shoppingItems = useAppStore((s) => s.shoppingItems);
  const setShoppingItems = useAppStore((s) => s.setShoppingItems);
  const setScreen = useAppStore((s) => s.setScreen);

  if (!selectedRecipe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <Bounce intensity={3}>
          <span className="text-6xl">🍽️</span>
        </Bounce>
        <p className="text-sm text-muted-foreground">Resep tidak ditemukan</p>
        <Button onClick={goBack} className="rounded-full">
          Kembali
        </Button>
      </div>
    );
  }

  // Key changes when recipe changes → inner component remounts with fresh state
  return (
    <RecipeDetailContent
      key={selectedRecipe.id}
      recipe={selectedRecipe}
      goBack={goBack}
      setSelectedRecipe={setSelectedRecipe}
      favoriteRecipes={favoriteRecipes}
      toggleFavorite={toggleFavorite}
      shoppingItems={shoppingItems}
      setShoppingItems={setShoppingItems}
      setScreen={setScreen}
    />
  );
}

export default RecipeDetail;

/* ── Stat Chip ────────────────────────────────────────────────── */

function StatChip({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border/30 bg-card px-3.5 py-2.5 shadow-sm">
      <span className="text-base">{icon}</span>
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-semibold">{value}</p>
      </div>
    </div>
  );
}
