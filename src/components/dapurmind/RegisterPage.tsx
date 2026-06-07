'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  User,
  Mail,
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

/* ── Register component ────────────────────────────────── */

export function RegisterPage() {
  const setScreen = useAppStore((s) => s.setScreen);
  const setAuthUser = useAppStore((s) => s.setAuthUser);
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setFirstLaunch = useAppStore((s) => s.setFirstLaunch);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  const handleCaptchaChange = useCallback((val: string) => {
    setCaptchaValue(val);
    // Check if the captcha answer matches by extracting numbers from the current captcha display
    // The MathCaptcha component handles validation internally, we just need to know if it's valid
  }, []);

  const handleRegister = useCallback(async () => {
    setError('');

    // Validations
    if (!name.trim()) {
      setError('Nama lengkap wajib diisi');
      return;
    }
    if (!username.trim()) {
      setError('Username wajib diisi');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username minimal 3 karakter');
      return;
    }
    if (!/^[a-zA-Z0-9._]+$/.test(username.trim())) {
      setError('Username hanya boleh huruf, angka, titik, dan underscore');
      return;
    }
    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Format email tidak valid');
      return;
    }
    if (!password) {
      setError('Password wajib diisi');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }
    if (!captchaValue || captchaValue.length === 0) {
      setError('Silakan jawab captcha terlebih dahulu');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registrasi gagal');
        setResetTrigger((t) => t + 1);
        setIsLoading(false);
        return;
      }

      // Success
      const newUser = data.user;
      setAuthUser(newUser);
      setLoggedIn(true);
      setFirstLaunch(false);
      setScreen('onboarding');
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setResetTrigger((t) => t + 1);
    }

    setIsLoading(false);
  }, [name, username, email, password, confirmPassword, captchaValue, setAuthUser, setLoggedIn, setFirstLaunch, setScreen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRegister();
      }
    },
    [handleRegister]
  );

  return (
    <div className="min-h-screen bg-[var(--nm-bg)]">
      <div className="flex flex-col items-center px-6 py-8 min-h-screen">
        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setScreen('login')}
          className="absolute top-4 left-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card shadow-sm transition-colors hover:bg-accent"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 mb-6 flex flex-col items-center text-center"
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
            <ChefHat className="h-7 w-7 text-white" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Buat Akun Baru
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daftar untuk mulai menggunakan DapurMind AI
          </p>
        </motion.div>

        {/* Register Form */}
        <motion.div
          ref={formRef}
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm space-y-3.5 pb-8"
        >
          {/* Nama Lengkap */}
          <motion.div variants={fadeUp} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                onKeyDown={handleKeyDown}
                autoComplete="name"
                className="h-11 w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 shadow-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </motion.div>

          {/* Username */}
          <motion.div variants={fadeUp} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground/40">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username_anda"
                onKeyDown={handleKeyDown}
                autoComplete="username"
                className="h-11 w-full rounded-xl border border-border/60 bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 shadow-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </motion.div>

          {/* Email */}
          <motion.div variants={fadeUp} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@email.com"
                onKeyDown={handleKeyDown}
                autoComplete="email"
                className="h-11 w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 shadow-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </motion.div>

          {/* Password */}
          <motion.div variants={fadeUp} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                onKeyDown={handleKeyDown}
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-border/60 bg-card pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 shadow-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>

          {/* Konfirmasi Password */}
          <motion.div variants={fadeUp} className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Konfirmasi Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                onKeyDown={handleKeyDown}
                autoComplete="new-password"
                className="h-11 w-full rounded-xl border border-border/60 bg-card pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 shadow-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>

          {/* Captcha */}
          <motion.div variants={fadeUp}>
            <MathCaptcha
              onCaptchaChange={(val) => {
                setCaptchaValue(val);
                setCaptchaValid(val.length > 0);
              }}
              onVerify={setCaptchaValid}
              resetTrigger={resetTrigger}
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
                className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 dark:bg-red-500/10"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Register button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleRegister}
            disabled={isLoading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              'Daftar Sekarang'
            )}
          </motion.button>

          {/* Login link */}
          <motion.p
            variants={fadeUp}
            className="text-center text-sm text-muted-foreground"
          >
            Sudah punya akun?{' '}
            <button
              onClick={() => setScreen('login')}
              className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
            >
              Masuk di sini
            </button>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

export default RegisterPage;
