'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Mail, ChefHat, Sparkles } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bounce, GlowingText } from '@/components/dapurmind/ReactBits';
import { BorderBeam } from '@/components/dapurmind/MagicUI';
import { CaptchaInput } from '@/components/dapurmind/CaptchaInput';
import { registerUser } from '@/lib/auth';

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

/* ── RegisterScreen ───────────────────────────────────────────── */

export default function RegisterScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = useCallback(async () => {
    setError('');

    // Validation
    if (!username.trim() || !password.trim()) {
      setError(t('register.error.empty'));
      return;
    }

    if (password.length < 6) {
      setError(t('register.error.passwordWeak'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('register.error.passwordMismatch'));
      return;
    }

    if (!captchaValid) {
      setError(t('register.error.captcha'));
      return;
    }

    setLoading(true);

    // Simulate brief loading for UX
    await new Promise((r) => setTimeout(r, 500));

    const result = registerUser(username, password, email || undefined);

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
  }, [username, email, password, confirmPassword, captchaValid, setScreen, t]);

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
            {t('register.subtitle')}
          </p>
        </motion.div>

        {/* ── Register Card ── */}
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
                  {t('register.success')}
                </motion.p>
              </div>
            ) : (
              <div className="relative z-10 space-y-4">
                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="reg-username" className="text-sm font-medium">
                    {t('register.username')}
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <ChefHat className="h-4 w-4" />
                    </div>
                    <Input
                      id="reg-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t('register.usernamePlaceholder')}
                      className="h-11 rounded-xl border-border/50 bg-background pl-9"
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Email (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-sm font-medium">
                    {t('register.email')}
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('register.emailPlaceholder')}
                      className="h-11 rounded-xl border-border/50 bg-background pl-9"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-sm font-medium">
                    {t('register.password')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('register.passwordPlaceholder')}
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
                  <Label htmlFor="reg-confirm" className="text-sm font-medium">
                    {t('register.confirmPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="reg-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('register.confirmPasswordPlaceholder')}
                      className="h-11 rounded-xl border-border/50 bg-background pr-10"
                      autoComplete="new-password"
                      onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
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
                  error={!!error && error === t('register.error.captcha')}
                  label={t('register.captchaLabel')}
                  placeholder={t('register.captchaPlaceholder')}
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

                {/* Register Button */}
                <motion.div variants={fadeUp}>
                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={handleRegister}
                      disabled={loading}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <UserPlus className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5" />
                          {t('register.button')}
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Terms */}
                <p className="text-center text-[11px] text-muted-foreground/70 pt-1">
                  {t('register.terms')}
                </p>
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
            {t('register.goLogin')}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
