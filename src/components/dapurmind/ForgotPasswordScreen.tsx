'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, KeyRound, ChefHat, Sparkles } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bounce, GlowingText } from '@/components/dapurmind/ReactBits';
import { BorderBeam } from '@/components/dapurmind/MagicUI';
import { CaptchaInput } from '@/components/dapurmind/CaptchaInput';
import { resetPassword, getUserAccounts } from '@/lib/auth';

/* ── Admin credentials (cannot reset from forgot-password page) ── */
const ADMIN_USERNAME = 'admin';

/* ── Animation variants ───────────────────────────────────────── */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

/* ── ForgotPasswordScreen ─────────────────────────────────────── */

export default function ForgotPasswordScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = useCallback(async () => {
    setError('');

    // Validation
    if (!username.trim() || !newPassword.trim()) {
      setError(t('forgot.error.empty'));
      return;
    }

    // Prevent admin password reset
    if (username.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
      setError(t('forgot.error.userNotFound'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('forgot.error.passwordWeak'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('forgot.error.passwordMismatch'));
      return;
    }

    if (!captchaValid) {
      setError(t('forgot.error.captcha'));
      return;
    }

    setLoading(true);

    // Simulate brief loading for UX
    await new Promise((r) => setTimeout(r, 500));

    // Check user exists
    const accounts = getUserAccounts();
    const exists = accounts.find(
      (a) => a.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!exists) {
      setError(t('forgot.error.userNotFound'));
      setLoading(false);
      return;
    }

    // Reset password
    const result = resetPassword(username, newPassword);

    if ('error' in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Success
    setSuccess(true);
    setLoading(false);

    // Auto-redirect to login after 1.5s
    setTimeout(() => {
      setScreen('login');
    }, 1500);
  }, [username, newPassword, confirmPassword, captchaValid, setScreen, t]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 via-white to-amber-50/30 dark:from-background dark:via-emerald-950/20 dark:to-background">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex flex-1 flex-col items-center justify-center px-6 py-12"
      >
        {/* ── Logo ── */}
        <motion.div variants={fadeUp} className="mb-2">
          <Bounce intensity={3} delay={0.1}>
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-5xl shadow-2xl shadow-emerald-500/30">
                🍳
              </div>
              <motion.div
                className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 shadow-lg"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </motion.div>
            </div>
          </Bounce>
        </motion.div>

        {/* ── Title ── */}
        <motion.div variants={fadeUp} className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            <GlowingText color="emerald" intensity={2}>
              DapurMind
            </GlowingText>{' '}
            <span className="text-amber-500">AI</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('forgot.subtitle')}
          </p>
        </motion.div>

        {/* ── Reset Card ── */}
        <motion.div variants={fadeUp} className="w-full max-w-sm">
          <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-lg">
            <BorderBeam
              duration={8}
              size={100}
              color={['#10b981', '#f59e0b', '#10b981']}
              borderWidth={1.5}
              borderRadius={16}
            />

            {/* Success overlay */}
            {success ? (
              <div className="relative z-10 flex flex-col items-center justify-center py-8 space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30"
                >
                  <span className="text-3xl">✅</span>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400"
                >
                  {t('forgot.success')}
                </motion.p>
              </div>
            ) : (
              <div className="relative z-10 space-y-4">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="forgot-username" className="text-sm font-medium">
                    {t('forgot.username')}
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <ChefHat className="h-4 w-4" />
                    </div>
                    <Input
                      id="forgot-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('forgot.usernamePlaceholder')}
                      className="h-11 rounded-xl border-border/50 bg-background pl-9"
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="forgot-password" className="text-sm font-medium">
                    {t('forgot.newPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="forgot-password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('forgot.newPasswordPlaceholder')}
                      className="h-11 rounded-xl border-border/50 bg-background pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="forgot-confirm" className="text-sm font-medium">
                    {t('forgot.confirmPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="forgot-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('forgot.confirmPasswordPlaceholder')}
                      className="h-11 rounded-xl border-border/50 bg-background pr-10"
                      autoComplete="new-password"
                      onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Captcha */}
                <CaptchaInput
                  value={captchaValue}
                  onChange={setCaptchaValue}
                  onVerify={setCaptchaValid}
                  error={!!error && error === t('forgot.error.captcha')}
                  label={t('forgot.captchaLabel')}
                  placeholder={t('forgot.captchaPlaceholder')}
                />

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-xs font-medium text-rose-500 dark:text-rose-400"
                  >
                    ⚠️ {error}
                  </motion.p>
                )}

                {/* Reset Button */}
                <motion.div variants={fadeUp}>
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={handleReset}
                      disabled={loading}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <KeyRound className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <>
                          <KeyRound className="h-5 w-5" />
                          {t('forgot.button')}
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Footer Link ── */}
        <motion.div variants={fadeUp} className="mt-6">
          <button
            onClick={() => setScreen('login')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('forgot.goLogin')}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
