'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Home, MessageCircle, Leaf, BookOpen, User } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { useTranslation } from '@/hooks/useTranslation';
import type { AppScreen } from '@/types';

interface NavTab {
  screen: AppScreen;
  labelKey: string;
  icon: React.ElementType;
  isCenter?: boolean;
}

const tabs: NavTab[] = [
  { screen: 'dashboard', labelKey: 'nav.home', icon: Home },
  { screen: 'chat', labelKey: 'nav.chat', icon: MessageCircle },
  { screen: 'zero-waste', labelKey: 'nav.zeroWaste', icon: Leaf, isCenter: true },
  { screen: 'recipes', labelKey: 'nav.recipes', icon: BookOpen },
  { screen: 'profile', labelKey: 'nav.profile', icon: User },
];

function BottomNavInner() {
  const currentScreen = useAppStore((s) => s.currentScreen);
  const setScreen = useAppStore((s) => s.setScreen);
  const { t } = useTranslation();

  // Hide on splash, auth screens and onboarding
  const hiddenScreens = ['splash', 'login', 'register', 'forgot-password', 'onboarding', 'admin-login', 'admin-affiliate', 'admin-analytics'];
  if (hiddenScreens.includes(currentScreen)) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex max-w-md items-end justify-around px-2 pt-2 pb-1">
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.screen;

          return (
            <button
              key={tab.screen}
              onClick={() => setScreen(tab.screen)}
              className="relative flex flex-col items-center gap-0.5 focus:outline-none"
              aria-label={t(tab.labelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Dot indicator for active tab */}
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="h-1 rounded-full"
                style={{
                  width: isActive ? 16 : 0,
                  background: tab.isCenter
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : isActive
                      ? '#10b981'
                      : 'transparent',
                }}
              />

              {/* Icon container */}
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`
                  flex items-center justify-center rounded-2xl transition-colors duration-200
                  ${tab.isCenter ? 'h-14 w-14 -mt-4' : 'h-10 w-10'}
                  ${
                    tab.isCenter
                      ? 'gradient-emerald text-white shadow-nm-accent'
                      : isActive
                        ? 'nm-raised-sm text-emerald-500'
                        : 'nm-flat text-[var(--nm-text-muted)]'
                  }
                `}
                whileTap={{ scale: 0.92 }}
              >
                <tab.icon
                  className={
                    tab.isCenter ? 'h-6 w-6' : 'h-5 w-5'
                  }
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </motion.div>

              {/* Label */}
              <span
                className={`
                  text-[10px] font-medium transition-colors duration-200
                  ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--nm-text-muted)]'}
                  ${tab.isCenter ? '-mt-0.5' : ''}
                `}
              >
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export const BottomNav = memo(BottomNavInner);
export default BottomNav;
