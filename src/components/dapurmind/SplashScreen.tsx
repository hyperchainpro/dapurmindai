'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { GlowingText } from '@/components/dapurmind/ReactBits';
import { ShineBorder } from '@/components/dapurmind/MagicUI';

/* ── Floating food emojis ─────────────────────────────────────── */

const FOOD_EMOJIS = ['🍳', '🍚', '🥬', '🌶️', '🧄', '🥑', '🍜', '🥘'];

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  rotateRange: number;
}

function generateEmojis(): FloatingEmoji[] {
  return FOOD_EMOJIS.map((emoji, i) => ({
    id: i,
    emoji,
    x: 10 + Math.random() * 80,
    y: 5 + Math.random() * 90,
    size: 24 + Math.random() * 28,
    duration: 4 + Math.random() * 4,
    delay: i * 0.3,
    rotateRange: 15 + Math.random() * 25,
  }));
}

/* ── Component ────────────────────────────────────────────────── */

export default function SplashScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const isDark = useAppStore((s) => s.isDark);
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [emojis] = useState<FloatingEmoji[]>(generateEmojis);

  const transitionOut = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // After 3s, trigger exit
    const timeout = setTimeout(transitionOut, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [transitionOut]);

  const handleExitComplete = () => {
    if (!isVisible) {
      setScreen('onboarding');
    }
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isVisible && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* ── Background gradient ── */}
          <div
            className={`absolute inset-0 ${
              isDark
                ? 'bg-gradient-to-br from-emerald-950 via-stone-950 to-amber-950'
                : 'bg-gradient-to-br from-emerald-50 via-white to-amber-50'
            }`}
          />

          {/* ── Floating emojis ── */}
          {emojis.map((item) => (
            <motion.span
              key={item.id}
              className="absolute pointer-events-none select-none"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                fontSize: item.size,
              }}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{
                opacity: [0, 0.7, 0.4, 0.7, 0.3],
                scale: [0, 1, 0.9, 1.1, 0.95],
                y: [0, -18, 8, -12, 0],
                rotate: [0, item.rotateRange, -item.rotateRange, item.rotateRange * 0.5, 0],
              }}
              transition={{
                duration: item.duration,
                delay: item.delay,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
            >
              {item.emoji}
            </motion.span>
          ))}

          {/* ── Center glass card ── */}
          <motion.div
            className={`relative z-10 flex flex-col items-center gap-4 px-8 py-10 sm:px-12 ${
              isDark
                ? 'bg-white/5 backdrop-blur-xl border border-white/10'
                : 'bg-white/60 backdrop-blur-xl border border-white/50'
            }`}
            style={{ borderRadius: 28 }}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <ShineBorder
              borderRadius={28}
              duration={4}
              borderWidth={2}
              color={['#10b981', '#f59e0b', '#10b981']}
              className="absolute inset-0 pointer-events-none"
            />

            {/* Logo icon */}
            <motion.div
              className={`relative flex h-20 w-20 items-center justify-center rounded-2xl ${
                isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
              }`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
            >
              <ChefHat className="h-10 w-10 text-emerald-500" />
            </motion.div>

            {/* App name */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                <GlowingText color="emerald" intensity={2}>
                  DapurMind
                </GlowingText>{' '}
                <GlowingText color="amber" intensity={2}>
                  AI
                </GlowingText>
              </h1>
              <p
                className={`mt-2 text-sm ${
                  isDark ? 'text-emerald-300/70' : 'text-emerald-700/70'
                }`}
              >
                Asisten Perencana Makanan Cerdas
              </p>
            </motion.div>

            {/* Tagline */}
            <motion.div
              className={`mt-2 rounded-full px-4 py-1.5 text-xs font-medium ${
                isDark
                  ? 'bg-amber-500/10 text-amber-300'
                  : 'bg-amber-100 text-amber-700'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.9 }}
            >
              ✨ Lebih Cerdas Memasak untuk Keluarga
            </motion.div>
          </motion.div>

          {/* ── Progress bar ── */}
          <motion.div
            className="absolute bottom-12 left-8 right-8 z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.0 }}
          >
            <div
              className={`h-1.5 w-full overflow-hidden rounded-full ${
                isDark ? 'bg-white/10' : 'bg-emerald-100'
              }`}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
            <p
              className={`mt-3 text-center text-xs ${
                isDark ? 'text-white/40' : 'text-stone-400'
              }`}
            >
              Memuat keajaiban dapur…
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
