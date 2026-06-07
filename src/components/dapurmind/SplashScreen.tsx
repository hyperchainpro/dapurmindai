'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { GlowingText } from '@/components/dapurmind/ReactBits';
import { ShineBorder } from '@/components/dapurmind/MagicUI';

/* ── Floating food emojis (deterministic to avoid hydration mismatch) ── */

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

/* Deterministic positions so SSR and client always match */
const FLOATING_EMOJIS: FloatingEmoji[] = [
  { id: 0, emoji: '🍳', x: 15,  y: 20, size: 36, duration: 5.2, delay: 0,   rotateRange: 20 },
  { id: 1, emoji: '🍚', x: 72,  y: 12, size: 30, duration: 6.0, delay: 0.3, rotateRange: 25 },
  { id: 2, emoji: '🥬', x: 82,  y: 45, size: 42, duration: 4.8, delay: 0.6, rotateRange: 18 },
  { id: 3, emoji: '🌶️', x: 25,  y: 70, size: 28, duration: 5.5, delay: 0.9, rotateRange: 30 },
  { id: 4, emoji: '🧄', x: 60,  y: 80, size: 34, duration: 7.0, delay: 1.2, rotateRange: 22 },
  { id: 5, emoji: '🥑', x: 8,   y: 55, size: 26, duration: 4.5, delay: 1.5, rotateRange: 28 },
  { id: 6, emoji: '🍜', x: 45,  y: 85, size: 38, duration: 5.8, delay: 1.8, rotateRange: 20 },
  { id: 7, emoji: '🥘', x: 88,  y: 25, size: 32, duration: 6.3, delay: 2.1, rotateRange: 24 },
];

/* ── Component ────────────────────────────────────────────────── */

export default function SplashScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const isDark = useAppStore((s) => s.isDark);
  const firstLaunch = useAppStore((s) => s.firstLaunch);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const hasRedirected = React.useRef(false);
  const emojis = FLOATING_EMOJIS;

  useEffect(() => {
    // If already logged in, skip splash entirely
    if (isLoggedIn) {
      setScreen('dashboard');
      return;
    }

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

    // After 2s, trigger exit (shorter duration)
    const timeout = setTimeout(() => setIsVisible(false), 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handleExitComplete = () => {
    if (!isVisible && !hasRedirected.current) {
      hasRedirected.current = true;
      // First launch: go to register; returning user: go to login
      setScreen(firstLaunch ? 'register' : 'login');
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
            className="absolute inset-0 bg-[var(--nm-bg)]"
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
            className={`relative z-10 flex flex-col items-center gap-4 px-8 py-10 sm:px-12 nm-raised`}
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
              className="relative flex h-20 w-20 items-center justify-center rounded-2xl nm-raised"
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
              className="mt-2 rounded-full px-4 py-1.5 text-xs font-medium nm-badge"
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
              className="h-1.5 w-full overflow-hidden rounded-full nm-pressed"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
            <p
              className="mt-3 text-center text-xs text-[var(--nm-text-muted)]"
            >
              Memuat keajaiban dapur…
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
