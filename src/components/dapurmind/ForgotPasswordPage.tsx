'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  Mail,
  Lock,
  ChefHat,
  CheckCircle2,
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

/* ── ForgotPasswordPage component ────────────────────────── */

export function ForgotPasswordPage() {
  const setScreen = useAppStore((s) => s.setScreen);

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);

  // Step 1: Verify email with captcha
  const handleVerifyEmail = useCallback(async () => {
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Email wajib diisi');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Format email tidak valid');
      return;
    }
    if (!captchaValid) {
      setError('Jawaban captcha salah atau belum diisi');
      setCaptchaKey((k) => k + 1);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'verify',
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Email tidak ditemukan');
        setCaptchaKey((k) => k + 1);
        setIsLoading(false);
        return;
      }

      // Email found, move to step 2 and reset captcha
      setStep('reset');
      setCaptchaValid(false);
      setCaptchaKey((k) => k + 1);
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setCaptchaKey((k) => k + 1);
    }

    setIsLoading(false);
  }, [email, captchaValid]);

  // Step 2: Set new password with captcha
  const handleResetPassword = useCallback(async () => {
    setError('');
    setSuccessMsg('');

    if (!newPassword) {
      setError('Password baru wajib diisi');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }
    if (!captchaValid) {
      setError('Jawaban captcha salah atau belum diisi');
      setCaptchaKey((k) => k + 1);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'reset',
          email: email.trim().toLowerCase(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal mengubah password');
        setCaptchaKey((k) => k + 1);
        setIsLoading(false);
        return;
      }

      // Show success then redirect
      setSuccessMsg('Password berhasil diubah! Mengarahkan ke halaman login...');
      setTimeout(() => {
        setScreen('login');
      }, 1500);
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setCaptchaKey((k) => k + 1);
    }

    setIsLoading(false);
  }, [email, newPassword, confirmPassword, captchaValid, setScreen]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (step === 'email') handleVerifyEmail();
        else handleResetPassword();
      }
    },
    [step, handleVerifyEmail, handleResetPassword]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-teal-50/30 dark:from-background dark:via-background dark:to-background">
      <div className="flex flex-col items-center justify-center px-6 py-12 min-h-screen">
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
          className="mb-8 flex flex-col items-center text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-400/20">
            <ChefHat className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {step === 'email' ? 'Lupa Password' : 'Buat Password Baru'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 'email'
              ? 'Masukkan email yang terdaftar untuk verifikasi'
              : 'Buat password baru untuk akun Anda'}
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm space-y-4"
        >
          {step === 'email' ? (
            <>
              {/* Email */}
              <motion.div variants={fadeUp} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Email Terdaftar
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
                    autoFocus
                    className="h-11 w-full rounded-xl border border-border/60 bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 shadow-sm transition-all focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </motion.div>

              {/* Captcha */}
              <motion.div variants={fadeUp}>
                <MathCaptcha
                  onVerify={setCaptchaValid}
                  key={captchaKey}
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

              {/* Verify button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleVerifyEmail}
                disabled={isLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-semibold text-white shadow-lg shadow-amber-400/25 transition-all hover:from-amber-500 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  'Verifikasi Email'
                )}
              </motion.button>
            </>
          ) : (
            <>
              {/* Success badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-500/10 px-4 py-3"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Email terverifikasi
                  </p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/60">
                    {email}
                  </p>
                </div>
              </motion.div>

              {/* New Password */}
              <motion.div variants={fadeUp} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Password Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    onKeyDown={handleKeyDown}
                    autoComplete="new-password"
                    autoFocus
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

              {/* Confirm Password */}
              <motion.div variants={fadeUp} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
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
                  onVerify={setCaptchaValid}
                  key={captchaKey}
                />
              </motion.div>

              {/* Error / Success messages */}
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

              <AnimatePresence>
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-2 rounded-xl bg-green-50 px-3.5 py-2.5 dark:bg-green-500/10"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">{successMsg}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reset button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleResetPassword}
                disabled={isLoading || !!successMsg}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  'Simpan Password Baru'
                )}
              </motion.button>
            </>
          )}

          {/* Back to login */}
          <motion.p
            variants={fadeUp}
            className="text-center text-sm text-muted-foreground"
          >
            Ingat password Anda?{' '}
            <button
              onClick={() => setScreen('login')}
              className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
            >
              Kembali ke Login
            </button>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
