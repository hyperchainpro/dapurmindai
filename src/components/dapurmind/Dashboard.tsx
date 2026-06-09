'use client';

import React, { useMemo, Component, ReactNode } from 'react';
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
  PenSquare,
  Wallet,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { useTranslation } from '@/hooks/useTranslation';
import { recipes } from '@/lib/recipes';
import type { AppScreen, Recipe } from '@/types';
import { AFFILIATE_MARKETPLACES } from '@/lib/affiliate';

/* ── Section Error Boundary ─────────────────────────────────────
 *  Catches errors in non-critical sections without killing the
 *  entire Dashboard. The section simply disappears; buttons stay.
 * ────────────────────────────────────────────────────────────── */

class SectionBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn('[SectionBoundary]', error.message);
  }
  render() {
    if (this.state.hasError) return this.props.fallback || null;
    return this.props.children;
  }
}

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
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
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
  {
    screen: 'creator',
    icon: PenSquare,
    titleKey: 'dashboard.creatorRecipes',
    descKey: 'dashboard.planDescCreator',
    gradient: 'from-violet-500/10 to-violet-500/5',
  },
  {
    screen: 'financial-planner',
    icon: Wallet,
    titleKey: 'dashboard.financialPlanner',
    descKey: 'dashboard.planDescFinance',
    gradient: 'from-teal-500/10 to-teal-500/5',
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
      className="min-w-[140px] max-w-[160px] cursor-pointer snap-start"
    >
      <div className="overflow-hidden rounded-2xl nm-raised shadow-sm">
        {/* Emoji image area */}
        <div className="flex h-24 items-center justify-center bg-[var(--nm-bg)]">
          <span className="text-5xl">{recipe.image}</span>
        </div>
        <div className="p-2.5">
          <h4 className="text-[13px] font-semibold leading-tight truncate">{recipe.name}</h4>
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
  const setPendingChatPrompt = useAppStore((s) => s.setPendingChatPrompt);
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

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setScreen('recipe-detail');
  };

  const handleNavigate = (screen: AppScreen) => {
    // Special flow: "Rencana Menu" -> Chat with auto meal-plan prompt
    if (screen === 'chat') {
      const user = useAppStore.getState().user;
      const budget = user?.weeklyBudget || 300000;
      const familySize = user?.familySize || 4;
      const prompt = `Buatkan rencana menu mingguan untuk ${familySize} orang dengan budget Rp ${budget.toLocaleString('id-ID')}`;
      setPendingChatPrompt(prompt);
    }
    setScreen(screen);
  };

  return (
    <div className="min-h-screen px-4 pb-28 pt-4">
      {/* ── Header ────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{formatDate(language)}</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight">
              {getGreeting(t)},{' '}
              <span className="text-emerald-500 dark:text-emerald-400">
                {user?.name || 'Chef'}
              </span>
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

      {/* ── Quick Actions (Plain CSS Grid — NO BentoGrid) ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <motion.div
              key={action.screen}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleNavigate(action.screen)}
              className="flex cursor-pointer flex-col gap-2 rounded-xl nm-raised bg-card p-3 transition-colors active:scale-[0.98]"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient}`}>
                <action.icon className="h-[18px] w-[18px] text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-[12px] font-semibold leading-tight">{t(action.titleKey)}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                  {t(action.descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Affiliate Marketplace Banner ────────────────── */}
      <SectionBoundary>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
          <button
            onClick={() => handleNavigate('marketplace')}
            className="w-full text-left"
          >
            <div className="relative overflow-hidden rounded-2xl nm-raised bg-gradient-to-r from-emerald-50 via-white to-amber-50 p-4 dark:from-emerald-500/10 dark:via-background dark:to-amber-500/10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 text-white shadow-lg shadow-emerald-500/25">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                    {t('dashboard.marketplaceHub')}
                  </h2>
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
              {/* Promo marquee — simple CSS animation */}
              <div className="mt-3 overflow-hidden rounded-lg">
                <div className="flex animate-marquee whitespace-nowrap">
                  {['Gratis Ongkir Tokopedia Now', 'Cashback 10% Shopee Segar', 'Produk Organik Sayurbox', 'Promo Harian Blibli Mart', 'Harga Grosir LotteMart', '24 Jam Klik Indomaret'].map((deal) => (
                    <span key={deal} className="mx-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 shrink-0">
                      <Sparkles className="h-3 w-3" />
                      {deal}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        </motion.div>
      </SectionBoundary>

      {/* ── Featured Recipe Carousel ──────────────────────── */}
      <SectionBoundary>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-semibold">{t('dashboard.popularRecipes')}</h2>
            </div>
            <button
              onClick={() => setScreen('recipes')}
              className="flex items-center gap-1 rounded-lg nm-raised-sm px-2.5 py-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              {t('dashboard.viewAll')}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="scroll-strip mx-1">
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 pt-0.5 px-1 snap-x snap-mandatory">
              {featuredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} onClick={() => handleRecipeClick(recipe)} t={t} />
              ))}
            </div>
          </div>
        </motion.div>
      </SectionBoundary>

      {/* ── Latest Meal Plan ──────────────────────────────── */}
      {latestPlan && (
        <SectionBoundary>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-emerald-500" />
              <h2 className="text-base font-semibold">{t('dashboard.weeklyPlan')}</h2>
            </div>
            <div className="rounded-2xl nm-raised bg-card p-4">
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
          </motion.div>
        </SectionBoundary>
      )}

      {/* ── Achievements Preview ──────────────────────────── */}
      {unlockedAchievements.length > 0 && (
        <SectionBoundary>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-semibold">{t('dashboard.achievements')}</h2>
            </div>
            <div className="space-y-2">
              {unlockedAchievements.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl nm-raised-sm px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xl dark:bg-amber-500/15">
                    {a.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeDate(a.unlockedAt, t)}</p>
                  </div>
                  <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                </div>
              ))}
            </div>
          </motion.div>
        </SectionBoundary>
      )}

      {/* ── Stats Section (Plain CSS Grid — NO BentoGrid/NumberTicker) ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
        <h2 className="mb-3 text-base font-semibold">{t('dashboard.stats')}</h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center rounded-xl nm-raised bg-card py-4 text-center">
            <span className="text-xl mb-1">❤️</span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {favoriteRecipes.length}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{t('dashboard.savedRecipes')}</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl nm-raised bg-card py-4 text-center">
            <span className="text-xl mb-1">📋</span>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {mealPlans.length}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{t('dashboard.menuPlanned')}</p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl nm-raised bg-card py-4 text-center">
            <span className="text-xl mb-1">🛒</span>
            <p className="text-xl font-bold text-sky-600 dark:text-sky-400">
              {shoppingItems.length}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{t('dashboard.shoppingItems')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export const Dashboard = DashboardInner;
export default Dashboard;
