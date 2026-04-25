'use client';

import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppState';
import { BottomNav } from '@/components/dapurmind/BottomNav';
import type { AppScreen } from '@/types';

/* ── Lazy-loaded screen components ──────────────────────────── */

const SplashScreen = dynamic(
  () => import('@/components/dapurmind/SplashScreen').then(m => ({ default: m.SplashScreen })),
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

/* ── Screen renderer ──────────────────────────────────────────── */

function ScreenRouter() {
  const currentScreen = useAppStore((s) => s.currentScreen);

  return (
    <AnimatePresence mode="wait">
      {currentScreen === 'splash' && (
        <motion.div key="splash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <SplashScreen />
        </motion.div>
      )}
      {currentScreen === 'onboarding' && (
        <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <OnboardingFlow />
        </motion.div>
      )}
      {currentScreen === 'dashboard' && (
        <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <Dashboard />
        </motion.div>
      )}
      {currentScreen === 'chat' && (
        <motion.div key="chat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ChatInterface />
        </motion.div>
      )}
      {currentScreen === 'zero-waste' && (
        <motion.div key="zero-waste" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ZeroWasteRecipe />
        </motion.div>
      )}
      {currentScreen === 'recipes' && (
        <motion.div key="recipes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <RecipeBrowser />
        </motion.div>
      )}
      {currentScreen === 'shopping' && (
        <motion.div key="shopping" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ShoppingList />
        </motion.div>
      )}
      {currentScreen === 'profile' && (
        <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ProfilePage />
        </motion.div>
      )}
      {currentScreen === 'recipe-detail' && (
        <motion.div key="recipe-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <RecipeDetail />
        </motion.div>
      )}
      {currentScreen === 'meal-plan-detail' && (
        <motion.div key="meal-plan-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <MealPlanDetail />
        </motion.div>
      )}
      {currentScreen === 'marketplace' && (
        <motion.div key="marketplace" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <MarketplaceHub />
        </motion.div>
      )}
      {currentScreen === 'admin-affiliate' && (
        <motion.div key="admin-affiliate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <AdminAffiliate />
        </motion.div>
      )}
      {currentScreen === 'admin-analytics' && (
        <motion.div key="admin-analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <AdminAnalytics />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function Home() {
  const currentScreen = useAppStore((s) => s.currentScreen);
  const showNav = currentScreen !== 'splash' && currentScreen !== 'onboarding';

  return (
    <main className="relative">
      <ScreenRouter />
      {showNav && <BottomNav />}
    </main>
  );
}
