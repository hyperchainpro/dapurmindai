'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppState';
import SplashScreen from '@/components/dapurmind/SplashScreen';
import OnboardingFlow from '@/components/dapurmind/OnboardingFlow';
import { Dashboard } from '@/components/dapurmind/Dashboard';
import { ChatInterface } from '@/components/dapurmind/ChatInterface';
import { ZeroWasteRecipe } from '@/components/dapurmind/ZeroWasteRecipe';
import { RecipeBrowser } from '@/components/dapurmind/RecipeBrowser';
import { ShoppingList } from '@/components/dapurmind/ShoppingList';
import { ProfilePage } from '@/components/dapurmind/ProfilePage';
import { RecipeDetail } from '@/components/dapurmind/RecipeDetail';
import { MealPlanDetail } from '@/components/dapurmind/MealPlanDetail';
import { BottomNav } from '@/components/dapurmind/BottomNav';
import { ChefHat, MessageCircle, Leaf, BookOpen } from 'lucide-react';
import type { AppScreen } from '@/types';

/* ── Screen renderer ──────────────────────────────────────────── */

function ScreenRouter() {
  const currentScreen = useAppStore((s) => s.currentScreen);

  return (
    <AnimatePresence mode="wait">
      {currentScreen === 'splash' && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SplashScreen />
        </motion.div>
      )}

      {currentScreen === 'onboarding' && (
        <motion.div
          key="onboarding"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <OnboardingFlow />
        </motion.div>
      )}

      {currentScreen === 'dashboard' && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <Dashboard />
        </motion.div>
      )}

      {/* Chat screen */}
      {currentScreen === 'chat' && (
        <motion.div
          key="chat"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <ChatInterface />
        </motion.div>
      )}

      {/* Zero Waste Recipe screen */}
      {currentScreen === 'zero-waste' && (
        <motion.div
          key="zero-waste"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <ZeroWasteRecipe />
        </motion.div>
      )}

      {/* Recipe Browser screen */}
      {currentScreen === 'recipes' && (
        <motion.div
          key="recipes"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <RecipeBrowser />
        </motion.div>
      )}

      {/* Shopping List screen */}
      {currentScreen === 'shopping' && (
        <motion.div
          key="shopping"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <ShoppingList />
        </motion.div>
      )}

      {/* Profile screen */}
      {currentScreen === 'profile' && (
        <motion.div
          key="profile"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <ProfilePage />
        </motion.div>
      )}

      {/* Recipe Detail screen */}
      {currentScreen === 'recipe-detail' && (
        <motion.div
          key="recipe-detail"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <RecipeDetail />
        </motion.div>
      )}

      {/* Meal Plan Detail */}
      {currentScreen === 'meal-plan-detail' && (
        <motion.div
          key="meal-plan-detail"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <MealPlanDetail />
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
