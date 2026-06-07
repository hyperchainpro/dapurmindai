'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  AlertCircle,
  User,
  Lock,
  ChefHat,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { MathCaptcha } from '@/components/dapurmind/MathCaptcha';

/* ── Animation variants ──────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ── LoginPage component ────────────────────────────────── */

export function LoginPage() {
  const setScreen = useAppStore((s) => s.setScreen);
  const setAuthUser = useAppStore((s) => s.setAuthUser);
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const updateOnboarding = useAppStore((s) => s.updateOnboarding);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);

  const handleLogin = useCallback(async () => {
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi');
      return;
    }
    if (!captchaValid) {
      setError('Jawaban captcha salah atau belum diisi');
      setCaptchaKey((k) => k + 1);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login gagal');
        setCaptchaKey((k) => k + 1);
        setIsLoading(false);
        return;
      }

      // Success
      const loggedInUser = data.user;
      setAuthUser(loggedInUser);
      setLoggedIn(true);

      if (!loggedInUser.isOnboarded) {
        updateOnboarding({
          id: loggedInUser.id,
          name: loggedInUser.name,
          username: loggedInUser.username,
          email: loggedInUser.email,
          isOnboarded: false,
          createdAt: loggedInUser.createdAt,
        });
        setScreen('onboarding');
      } else {
        updateOnboarding({
          id: loggedInUser.id,
          name: loggedInUser.name,
          username: loggedInUser.username,
          email: loggedInUser.email,
          isOnboarded: true,
          createdAt: loggedInUser.createdAt,
        });
        setScreen('dashboard');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setCaptchaKey((k) => k + 1);
    }

    setIsLoading(false);
  }, [username, password, captchaValid, setAuthUser, setLoggedIn, setScreen, updateOnboarding]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
      }
    },
    [handleLogin]
  );

  return (
    <div className="min-h-screen bg-[var(--nm-bg)]">
      <div className="flex flex-col items-center justify-center px-6 py-12 min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl nm-raised bg-emerald-500/10">
            <ChefHat className="h-8 w-8 text-emerald-500" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            DapurMind AI
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk ke akun Anda
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm space-y-4"
        >
          {/* Username */}
          <motion.div variants={fadeUp} className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nm-text-muted)]">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--nm-text-muted)]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                onKeyDown={handleKeyDown}
                autoComplete="username"
                autoFocus
                className="h-11 w-full rounded-xl nm-input pl-10 pr-4 text-sm text-[var(--nm-text)] placeholder:text-[var(--nm-text-light)]"
              />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div variants={fadeUp} className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--nm-text-muted)]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--nm-text-muted)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
                className="h-11 w-full rounded-xl nm-input pl-10 pr-11 text-sm text-[var(--nm-text)] placeholder:text-[var(--nm-text-light)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--nm-text-muted)] hover:text-[var(--nm-text)] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>

          {/* Forgot password link */}
          <motion.div variants={fadeUp} className="flex justify-end">
            <button
              onClick={() => setScreen('forgot-password')}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
            >
              Lupa password?
            </button>
          </motion.div>

          {/* Captcha */}
          <motion.div variants={fadeUp}>
            <MathCaptcha
              key={captchaKey}
              onVerify={setCaptchaValid}
            />
          </motion.div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2 rounded-xl nm-raised bg-red-50/80 px-3.5 py-2.5 dark:bg-red-500/10"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl nm-btn-primary text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              'Masuk'
            )}
          </motion.button>

          {/* Divider */}
          <motion.div variants={fadeUp} className="flex items-center gap-3 py-1">
            <div className="nm-divider flex-1" />
            <span className="text-[11px] text-[var(--nm-text-muted)]">atau</span>
            <div className="nm-divider flex-1" />
          </motion.div>

          {/* Register link */}
          <motion.p
            variants={fadeUp}
            className="text-center text-sm text-[var(--nm-text-muted)]"
          >
            Belum punya akun?{' '}
            <button
              onClick={() => setScreen('register')}
              className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
            >
              Daftar sekarang
            </button>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

export default LoginPage;
