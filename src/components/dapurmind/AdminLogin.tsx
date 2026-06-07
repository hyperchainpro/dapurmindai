'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  User,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';

/* ── Admin credentials (client-side only) ─────────────────── */

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'dapurmind2025';

/* ── Animation variants ──────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

/* ── AdminLogin component ────────────────────────────────── */

export function AdminLogin() {
  const setAdminLoggedIn = useAppStore((s) => s.setAdminLoggedIn);
  const goBack = useAppStore((s) => s.goBack);
  const setScreen = useAppStore((s) => s.setScreen);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi');
      return;
    }

    setIsLoading(true);

    // Simulate brief loading for UX
    await new Promise((r) => setTimeout(r, 600));

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setAdminLoggedIn(true);
      setScreen('admin-affiliate');
    } else {
      setError('Username atau password salah');
    }

    setIsLoading(false);
  }, [username, password, setAdminLoggedIn, setScreen]);

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
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="flex flex-col items-center justify-center px-6 py-12 min-h-screen">
        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goBack}
          className="absolute top-4 left-4 z-20 flex h-9 w-9 items-center justify-center rounded-full nm-raised transition-colors hover:bg-accent"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-nm-accent">
            <span className="text-3xl">🍳</span>
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
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm space-y-4"
        >
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                onKeyDown={handleKeyDown}
                autoComplete="username"
                className="h-11 w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 shadow-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
                className="h-11 w-full rounded-xl border border-border/60 bg-card px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 shadow-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 dark:bg-red-500/10"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-semibold text-white shadow-nm-accent transition-all hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              'Masuk'
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminLogin;
