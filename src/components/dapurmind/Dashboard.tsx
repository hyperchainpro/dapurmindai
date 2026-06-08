'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Calendar,
  Leaf,
  Search,
  ShoppingCart,
  Clock,
  ChefHat,
  Trophy,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { useTranslation } from '@/hooks/useTranslation';
import { recipes } from '@/lib/recipes';
import type { AppScreen, Recipe } from '@/types';
import {
  BentoGrid,
  BentoGridItem,
  ShineBorder,
  AnimatedList,
  NumberTicker,
  Marquee,
} from '@/components/dapurmind/MagicUI';
import { GlowingText, Bounce, ClickSpark } from '@/components/dapurmind/ReactBits';
import { AFFILIATE_MARKETPLACES } from '@/lib/affiliate';

/* ── Helpers ─────────────────────────────────────────────────── */

function getGreeting(t: (key: string, params?: Record<string, string | number>) => string): string {
  const h = new Date().getHours();
  if (h < 11) return t('dashboard.morning');
  if (h < 15) return t('dashboard.afternoon');
  if (h < 18) return t('dashboard.evening');
  return t('dashboard.night');
}

function formatDate(locale: string): string {
  const now = new Date();
  return now.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatRelativeDate(dateStr?: string, t?: (key: string, params?: Record<string, string | number>) => string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (t) {
    if (days === 0) return t('common.today');
    if (days === 1) return t('common.yesterday');
    if (days < 7) return t('common.daysAgo', { count: days });
  }
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const difficultyColor: Record<string, string> = {
  Mudah: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  Sedang: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  Susah: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
};

/* ── Stagger container ──────────────────────────────────────── */

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── Featured recipes (pick 4) ──────────────────────────────── */

const featuredIds = ['nasi-goreng', 'rendang', 'sate-ayam', 'klepon'];

/* ── Quick Actions ──────────────────────────────────────────── */

interface QuickAction {
  screen: AppScreen;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  gradient: string;
}

const quickActions: QuickAction[] = [
  {
    screen: 'chat',
    icon: Calendar,
    titleKey: 'dashboard.planMenu',
    descKey: 'dashboard.planDescChat',
    gradient: 'from-emerald-500/10 to-emerald-500/5',
  },
  {
    screen: 'zero-waste',
    icon: Leaf,
    titleKey: 'dashboard.zeroWaste',
    descKey: 'dashboard.planDescZeroWaste',
    gradient: 'from-amber-500/10 to-amber-500/5',
  },
  {
    screen: 'marketplace',
    icon: ShoppingCart,
    titleKey: 'dashboard.marketplaceHub',
    descKey: 'dashboard.planDescMarketplace',
    gradient: 'from-sky-500/10 to-sky-500/5',
  },
  {
    screen: 'recipes',
    icon: Search,
    titleKey: 'dashboard.findRecipes',
    descKey: 'dashboard.planDescRecipes',
    gradient: 'from-rose-500/10 to-rose-500/5',
  },
];

/* ── Sub-components ─────────────────────────────────────────── */

function RecipeCard({ recipe, onClick, t }: { recipe: Recipe; onClick: () => void; t: (key: string, params?: Record<string, string | number>) => string }) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className="min-w-[160px] max-w-[180px] cursor-pointer snap-start"
    >
      <div className="overflow-hidden rounded-2xl nm-raised">
        {/* Emoji image area */}
        <div className="flex h-28 items-center justify-center bg-[var(--nm-bg)]">
          <span className="text-5xl">{recipe.image}</span>
        </div>
        <div className="p-3">
          <h4 className="text-sm font-semibold leading-tight truncate">{recipe.name}</h4>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
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

/* ── Dashboard ──────────────────────────────────────────────── */

function DashboardInner() {
  const user = useAppStore((s) => s.user);
  const setScreen = useAppStore((s) => s.setScreen);
  const setSelectedRecipe = useAppStore((s) => s.setSelectedRecipe);
  const mealPlans = useAppStore((s) => s.mealPlans);
  const shoppingItems = useAppStore((s) => s.shoppingItems);
  const favoriteRecipes = useAppStore((s) => s.favoriteRecipes);
  const achievements = useAppStore((s) => s.achievements);
  const isDark = useAppStore((s) => s.isDark);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const { t, language } = useTranslation();

  const featuredRecipes = useMemo(
    () => featuredIds.map((id) => recipes.find((r) => r.id === id)!).filter(Boolean),
    [],
  );

  const latestPlan = useMemo(() => mealPlans[0] ?? null, [mealPlans]);

  const unlockedAchievements = useMemo(
    () =>
      achievements
        .filter((a) => a.unlockedAt)
        .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
        .slice(0, 3),
    [achievements],
  );

  const achievementItems = useMemo(
    () =>
      unlockedAchievements.map((a) => ({
        id: a.id,
        content: (
          <div className="flex items-center gap-3 rounded-xl nm-raised-sm px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xl dark:bg-amber-500/15">
              {a.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{a.title}</p>
              <p className="text-xs text-muted-foreground">{formatRelativeDate(a.unlockedAt, t)}</p>
            </div>
            <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
          </div>
        ),
      })),
    [unlockedAchievements],
  );

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setScreen('recipe-detail');
  };

  const handleNavigate = (screen: AppScreen) => {
    setScreen(screen);
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="min-h-screen px-4 pb-28 pt-4"
    >
      {/* ── Header ────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{formatDate(language)}</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight">
              {getGreeting(t)},{' '}
              <GlowingText color="emerald" intensity={2}>
                {user?.name || 'Chef'}
              </GlowingText>
              <span>! 👋</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('dashboard.subtitle')}
            </p>
          </div>

          {/* Dark mode toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full nm-raised-sm transition-colors hover:bg-accent"
            aria-label={isDark ? 'Light mode' : 'Dark mode'}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isDark ? 180 : 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
            </motion.div>
          </motion.button>
        </div>
      </motion.div>

      {/* ── Quick Actions ─────────────────────────────────── */}
      <motion.div variants={fadeUp} className="mb-6">
        <BentoGrid columns={{ default: 2, sm: 2, md: 2, lg: 4 }} gap={0.625}>
          {quickActions.map((action) => (
            <BentoGridItem
              key={action.screen}
              className="cursor-pointer nm-raised"
              onClick={() => handleNavigate(action.screen)}
            >
              <motion.div whileTap={{ scale: 0.96 }} className="flex flex-col gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl nm-raised-sm">
                  <action.icon className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t(action.titleKey)}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {t(action.descKey)}
                  </p>
                </div>
              </motion.div>
            </BentoGridItem>
          ))}
        </BentoGrid>
      </motion.div>

      {/* ── Affiliate Marketplace Banner ────────────────── */}
      <motion.div variants={fadeUp} className="mb-6">
        <ClickSpark color="#10b981" count={8}>
          <button
            onClick={() => handleNavigate('marketplace')}
            className="w-full text-left"
          >
            <ShineBorder
              borderRadius={16}
              borderWidth={2}
              duration={8}
              color={['#10b981', '#f59e0b', '#10b981']}
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-amber-50 p-4 dark:from-emerald-500/10 dark:via-background dark:to-amber-500/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 text-white shadow-lg shadow-emerald-500/25">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <GlowingText color="emerald" intensity={1}>
                      <h2 className="text-base font-bold">{t('dashboard.marketplaceHub')}</h2>
                    </GlowingText>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t('dashboard.marketplaceDesc', { count: AFFILIATE_MARKETPLACES.length })}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {AFFILIATE_MARKETPLACES.slice(0, 4).map((mp) => (
                          <span
                            key={mp.id}
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-background text-xs ${mp.bgColor}`}
                          >
                            {mp.logo}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {t('dashboard.othersCount', { count: AFFILIATE_MARKETPLACES.length - 4 })}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-emerald-500 shrink-0" />
                </div>
                <div className="mt-3 overflow-hidden rounded-lg">
                  <Marquee pauseOnHover className="[--duration:20s]">
                    {['Gratis Ongkir Tokopedia Now', 'Cashback 10% Shopee Segar', 'Produk Organik Sayurbox', 'Promo Harian Blibli Mart', 'Harga Grosir LotteMart', '24 Jam Klik Indomaret'].map((deal) => (
                      <span key={deal} className="mx-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        <Sparkles className="h-3 w-3" />
                        {deal}
                      </span>
                    ))}
                  </Marquee>
                </div>
              </div>
            </ShineBorder>
          </button>
        </ClickSpark>
      </motion.div>

      {/* ── Featured Recipe Carousel ──────────────────────── */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-semibold">{t('dashboard.popularRecipes')}</h2>
          </div>
          <button
            onClick={() => setScreen('recipes')}
            className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            {t('dashboard.viewAll')}
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
          {featuredRecipes.map((recipe, i) => (
            <Bounce key={recipe.id} delay={i * 0.1} intensity={1}>
              <RecipeCard recipe={recipe} onClick={() => handleRecipeClick(recipe)} t={t} />
            </Bounce>
          ))}
        </div>
      </motion.div>

      {/* ── Latest Meal Plan ──────────────────────────────── */}
      {latestPlan && (
        <motion.div variants={fadeUp} className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-emerald-500" />
            <h2 className="text-base font-semibold">{t('dashboard.weeklyPlan')}</h2>
          </div>
          <ShineBorder
            borderRadius={16}
            color={['#10b981', '#f59e0b', '#10b981']}
            borderWidth={1.5}
            duration={6}
          >
            <div className="rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.starting')} {new Date(latestPlan.weekStart).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {t('dashboard.planDays', { count: latestPlan.days.length })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('dashboard.estimatedBudget')}:{' '}
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      Rp {latestPlan.totalPrice.toLocaleString('id-ID')}
                    </span>
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                </div>
              </div>
              <button
                onClick={() => handleNavigate('meal-plan-detail')}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl nm-btn-primary py-2.5 text-sm font-medium text-white transition-colors"
              >
                {t('dashboard.viewDetail')}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </ShineBorder>
        </motion.div>
      )}

      {/* ── Achievements Preview ──────────────────────────── */}
      {unlockedAchievements.length > 0 && (
        <motion.div variants={fadeUp} className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-semibold">{t('dashboard.achievements')}</h2>
          </div>
          <AnimatedList items={achievementItems} staggerDelay={0.12} animationDuration={0.45} />
        </motion.div>
      )}

      {/* ── Stats Section ─────────────────────────────────── */}
      <motion.div variants={fadeUp} className="mb-6">
        <h2 className="mb-3 text-base font-semibold">{t('dashboard.stats')}</h2>
        <BentoGrid columns={{ default: 3, sm: 3, md: 3, lg: 3 }} gap={0.625}>
          <BentoGridItem className="flex flex-col items-center justify-center py-5 text-center">
            <span className="text-2xl mb-1">❤️</span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              <NumberTicker value={favoriteRecipes.length} duration={1.5} />
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{t('dashboard.savedRecipes')}</p>
          </BentoGridItem>
          <BentoGridItem className="flex flex-col items-center justify-center py-5 text-center">
            <span className="text-2xl mb-1">📋</span>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              <NumberTicker value={mealPlans.length} duration={1.5} />
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{t('dashboard.menuPlanned')}</p>
          </BentoGridItem>
          <BentoGridItem className="flex flex-col items-center justify-center py-5 text-center">
            <span className="text-2xl mb-1">🛒</span>
            <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
              <NumberTicker value={shoppingItems.length} duration={1.5} />
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{t('dashboard.shoppingItems')}</p>
          </BentoGridItem>
        </BentoGrid>
      </motion.div>
    </motion.div>
  );
}

export const Dashboard = DashboardInner;
export default Dashboard;
