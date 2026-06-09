'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { BottomNav } from '@/components/dapurmind/BottomNav';
import type { AppScreen } from '@/types';

/* ── Loading Spinner ──────────────────────────────────────────── */

function ScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );
}

/* ── Lazy-loaded screen components ──────────────────────────── */

const SplashScreen = dynamic(
  () => import('@/components/dapurmind/SplashScreen'),
  { ssr: false }
);
const LoginPage = dynamic(
  () => import('@/components/dapurmind/LoginPage').then(m => ({ default: m.default })),
  { ssr: false }
);
const RegisterPage = dynamic(
  () => import('@/components/dapurmind/RegisterPage').then(m => ({ default: m.default })),
  { ssr: false }
);
const ForgotPasswordPage = dynamic(
  () => import('@/components/dapurmind/ForgotPasswordPage').then(m => ({ default: m.default })),
  { ssr: false }
);
const OnboardingFlow = dynamic(
  () => import('@/components/dapurmind/OnboardingFlow').then(m => ({ default: m.default })),
  { ssr: false }
);
const Dashboard = dynamic(
  () => import('@/components/dapurmind/Dashboard').then(m => ({ default: m.Dashboard })),
  { ssr: false }
);
const ChatInterface = dynamic(
  () => import('@/components/dapurmind/ChatInterface').then(m => ({ default: m.ChatInterface })),
  { ssr: false }
);
const ZeroWasteRecipe = dynamic(
  () => import('@/components/dapurmind/ZeroWasteRecipe').then(m => ({ default: m.ZeroWasteRecipe })),
  { ssr: false }
);
const RecipeBrowser = dynamic(
  () => import('@/components/dapurmind/RecipeBrowser').then(m => ({ default: m.RecipeBrowser })),
  { ssr: false }
);
const ShoppingList = dynamic(
  () => import('@/components/dapurmind/ShoppingList').then(m => ({ default: m.ShoppingList })),
  { ssr: false }
);
const ProfilePage = dynamic(
  () => import('@/components/dapurmind/ProfilePage').then(m => ({ default: m.ProfilePage })),
  { ssr: false }
);
const RecipeDetail = dynamic(
  () => import('@/components/dapurmind/RecipeDetail').then(m => ({ default: m.RecipeDetail })),
  { ssr: false }
);
const MealPlanDetail = dynamic(
  () => import('@/components/dapurmind/MealPlanDetail').then(m => ({ default: m.MealPlanDetail })),
  { ssr: false }
);
const AdminLogin = dynamic(
  () => import('@/components/dapurmind/AdminLogin').then(m => ({ default: m.AdminLogin })),
  { ssr: false }
);
const MarketplaceHub = dynamic(
  () => import('@/components/dapurmind/MarketplaceHub').then(m => ({ default: m.MarketplaceHub })),
  { ssr: false }
);
const AdminAffiliate = dynamic(
  () => import('@/components/dapurmind/AdminAffiliate').then(m => ({ default: m.AdminAffiliate })),
  { ssr: false }
);
const AdminAnalytics = dynamic(
  () => import('@/components/dapurmind/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })),
  { ssr: false }
);
const FavoritePage = dynamic(
  () => import('@/components/dapurmind/FavoritePage').then(m => ({ default: m.FavoritePage })),
  { ssr: false }
);
const CreatorPage = dynamic(
  () => import('@/components/dapurmind/CreatorPage').then(m => ({ default: m.default })),
  { ssr: false }
);
const FinancialPlannerPage = dynamic(
  () => import('@/components/dapurmind/FinancialPlannerPage').then(m => ({ default: m.default })),
  { ssr: false }
);

/* ── Screen renderer ──────────────────────────────────────────── */

function ScreenRouter() {
  const currentScreen = useAppStore((s) => s.currentScreen);
  const isAdminLoggedIn = useAppStore((s) => s.isAdminLoggedIn);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const setScreen = useAppStore((s) => s.setScreen);

  // Auth guard: redirect to admin-login if not authenticated
  React.useEffect(() => {
    if ((currentScreen === 'admin-affiliate' || currentScreen === 'admin-analytics') && !isAdminLoggedIn) {
      setScreen('admin-login');
    }
  }, [currentScreen, isAdminLoggedIn, setScreen]);

  // User auth guard: redirect to login if not authenticated (skip auth screens & splash)
  React.useEffect(() => {
    const authScreens: AppScreen[] = ['splash', 'login', 'register', 'forgot-password', 'onboarding'];
    const isAuthScreen = authScreens.includes(currentScreen);
    if (!isLoggedIn && !isAuthScreen) {
      setScreen('login');
    }
  }, [currentScreen, isLoggedIn, setScreen]);

  return (
    <AnimatePresence mode="sync">
      {currentScreen === 'splash' && (
        <motion.div key="splash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <Suspense fallback={<ScreenLoader />}><SplashScreen /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'login' && (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <Suspense fallback={<ScreenLoader />}><LoginPage /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'register' && (
        <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <Suspense fallback={<ScreenLoader />}><RegisterPage /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'forgot-password' && (
        <motion.div key="forgot-password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <Suspense fallback={<ScreenLoader />}><ForgotPasswordPage /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'onboarding' && (
        <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <Suspense fallback={<ScreenLoader />}><OnboardingFlow /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'dashboard' && (
        <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><Dashboard /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'chat' && (
        <motion.div key="chat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><ChatInterface /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'zero-waste' && (
        <motion.div key="zero-waste" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><ZeroWasteRecipe /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'recipes' && (
        <motion.div key="recipes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><RecipeBrowser /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'shopping' && (
        <motion.div key="shopping" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><ShoppingList /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'profile' && (
        <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><ProfilePage /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'recipe-detail' && (
        <motion.div key="recipe-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><RecipeDetail /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'meal-plan-detail' && (
        <motion.div key="meal-plan-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><MealPlanDetail /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'marketplace' && (
        <motion.div key="marketplace" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><MarketplaceHub /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'admin-login' && (
        <motion.div key="admin-login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><AdminLogin /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'admin-affiliate' && (
        <motion.div key="admin-affiliate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><AdminAffiliate /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'admin-analytics' && (
        <motion.div key="admin-analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><AdminAnalytics /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'favorites' && (
        <motion.div key="favorites" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><FavoritePage /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'creator' && (
        <motion.div key="creator" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><CreatorPage /></Suspense>
        </motion.div>
      )}
      {currentScreen === 'financial-planner' && (
        <motion.div key="financial-planner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Suspense fallback={<ScreenLoader />}><FinancialPlannerPage /></Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function Home() {
  const currentScreen = useAppStore((s) => s.currentScreen);
  const hideNavScreens = ['splash', 'login', 'register', 'forgot-password', 'onboarding', 'admin-login', 'admin-affiliate', 'admin-analytics'];
  const showNav = !hideNavScreens.includes(currentScreen);
  const [hydrated, setHydrated] = React.useState(false);

  // Wait for Zustand PERSIST rehydration before rendering anything
  // This prevents screen flicker (splash → login → dashboard race condition)
  React.useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  if (!hydrated) {
    return (
      <main className="relative">
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative">
      <ScreenRouter />
      {showNav && <BottomNav />}
    </main>
  );
}
