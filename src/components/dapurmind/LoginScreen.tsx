'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, ChefHat, Sparkles } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bounce, GlowingText } from '@/components/dapurmind/ReactBits';
import { BorderBeam } from '@/components/dapurmind/MagicUI';
import { CaptchaInput } from '@/components/dapurmind/CaptchaInput';
import { authenticateUser } from '@/lib/auth';

/* ── Admin credentials ── */
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'dapurmind2024';

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

/* ── LoginScreen ──────────────────────────────────────────────── */

export default function LoginScreen() {
  const setScreen = useAppStore((s) => s.setScreen);
  const setIsLoggedIn = useAppStore((s) => s.setIsLoggedIn);
  const setIsAdmin = useAppStore((s) => s.setIsAdmin);
  const updateOnboarding = useAppStore((s) => s.updateOnboarding);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const isOnboarded = useAppStore((s) => s.user?.isOnboarded);

  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to appropriate screen
  React.useEffect(() => {
    if (isLoggedIn) {
      const isAdmin = useAppStore.getState().isAdmin;
      if (isAdmin) {
        setScreen('admin-affiliate');
      } else if (isOnboarded) {
        setScreen('dashboard');
      } else {
        setScreen('onboarding');
      }
    }
  }, [isLoggedIn, isOnboarded, setScreen]);

  const handleLogin = useCallback(async () => {
    setError('');

    if (!username.trim() || !password.trim()) {
      setError(t('login.error.empty'));
      return;
    }

    if (!captchaValid) {
      setError(t('login.captchaError'));
      return;
    }

    setLoading(true);

    // Simulate a brief loading delay for UX polish
    await new Promise((r) => setTimeout(r, 400));

    // Check if admin login
    const isAdminUser =
      username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD;

    if (isAdminUser) {
      setIsAdmin(true);
      setIsLoggedIn(true);
      updateOnboarding({
        name: 'Admin',
        isOnboarded: true,
      });
      // Admin goes directly to admin marketplace hub
      setScreen('admin-affiliate');
    } else {
      // Regular user login - authenticate against stored accounts
      const user = authenticateUser(username, password);
      if (user) {
        setIsAdmin(false);
        setIsLoggedIn(true);
        // Reset user profile with the correct username (clears any stale admin data)
        updateOnboarding({
          name: user.username,
          isOnboarded: false,
        });
        setScreen('onboarding');
      } else {
        setError(t('login.error.invalid'));
      }
    }

    setLoading(false);
  }, [username, password, captchaValid, setIsAdmin, setIsLoggedIn, setScreen, updateOnboarding, t]);

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
            {t('login.subtitle')}
          </p>
        </motion.div>

        {/* ── Login Card ── */}
        <motion.div variants={fadeUp} className="w-full max-w-sm">
          <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-lg">
            <BorderBeam
              duration={8}
              size={100}
              color={['#10b981', '#f59e0b', '#10b981']}
              borderWidth={1.5}
              borderRadius={16}
            />

            <div className="relative z-10 space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="login-username" className="text-sm font-medium">
                  {t('login.username')}
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <ChefHat className="h-4 w-4" />
                  </div>
                  <Input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t('login.usernamePlaceholder')}
                    className="h-11 rounded-xl border-border/50 bg-background pl-9"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">
                  {t('login.password')}
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    className="h-11 rounded-xl border-border/50 bg-background pr-10"
                    autoComplete="current-password"
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

              {/* Captcha */}
              <CaptchaInput
                value={captchaValue}
                onChange={setCaptchaValue}
                onVerify={setCaptchaValid}
                error={!!error && error === t('login.captchaError')}
                label={t('login.captchaLabel')}
                placeholder={t('login.captchaPlaceholder')}
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

              {/* Login Button */}
              <motion.div variants={fadeUp}>
                <motion.div
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    onClick={handleLogin}
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <LogIn className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5" />
                        {t('login.button')}
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>

              {/* Footer hint */}
              <p className="text-center text-[11px] text-muted-foreground/70 pt-1">
                DapurMind AI v1.0.0
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Footer Links ── */}
        <motion.div variants={fadeUp} className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={() => setScreen('forgot-password')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('login.goForgot')}
          </button>
          <button
            onClick={() => setScreen('register')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('login.noAccount')}{' '}
            <span className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
              {t('login.goRegister')}
            </span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
