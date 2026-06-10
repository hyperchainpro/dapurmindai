'use client';

import React, { Suspense, Component, ErrorInfo, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { BottomNav } from '@/components/dapurmind/BottomNav';
import type { AppScreen } from '@/types';

/* ── Loading Spinner ──────────────────────────────────────────── */

function ScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
    </div>
  );
}

/* ── Error Boundary ──────────────────────────────────────────── */

interface ErrorBoundaryProps {
  children: ReactNode;
  screenName: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ScreenErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.screenName}]`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/15">
              <AlertTriangle className="h-8 w-8 text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Terjadi kesalahan
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-[250px]">
                Halaman {this.props.screenName} gagal dimuat. Silakan coba lagi.
              </p>
            </div>
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 rounded-xl nm-btn-primary px-5 py-2.5 text-sm font-medium text-white transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Coba Lagi
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Lazy-loaded screen components ──────────────────────────── */

const loadingComponent = () => <ScreenLoader />;

const SplashScreen = dynamic(
  () => import('@/components/dapurmind/SplashScreen'),
  { ssr: false, loading: loadingComponent }
);
const LoginPage = dynamic(
  () => import('@/components/dapurmind/LoginPage').then(m => ({ default: m.default })),
  { ssr: false, loading: loadingComponent }
);
const RegisterPage = dynamic(
  () => import('@/components/dapurmind/RegisterPage').then(m => ({ default: m.default })),
  { ssr: false, loading: loadingComponent }
);
const ForgotPasswordPage = dynamic(
  () => import('@/components/dapurmind/ForgotPasswordPage').then(m => ({ default: m.default })),
  { ssr: false, loading: loadingComponent }
);
const OnboardingFlow = dynamic(
  () => import('@/components/dapurmind/OnboardingFlow').then(m => ({ default: m.default })),
  { ssr: false, loading: loadingComponent }
);
const Dashboard = dynamic(
  () => import('@/components/dapurmind/Dashboard').then(m => ({ default: m.Dashboard })),
  { ssr: false, loading: loadingComponent }
);
const ChatInterface = dynamic(
  () => import('@/components/dapurmind/ChatInterface').then(m => ({ default: m.ChatInterface })),
  { ssr: false, loading: loadingComponent }
);
const ZeroWasteRecipe = dynamic(
  () => import('@/components/dapurmind/ZeroWasteRecipe').then(m => ({ default: m.ZeroWasteRecipe })),
  { ssr: false, loading: loadingComponent }
);
const RecipeBrowser = dynamic(
  () => import('@/components/dapurmind/RecipeBrowser').then(m => ({ default: m.RecipeBrowser })),
  { ssr: false, loading: loadingComponent }
);
const ShoppingList = dynamic(
  () => import('@/components/dapurmind/ShoppingList').then(m => ({ default: m.ShoppingList })),
  { ssr: false, loading: loadingComponent }
);
const ProfilePage = dynamic(
  () => import('@/components/dapurmind/ProfilePage').then(m => ({ default: m.ProfilePage })),
  { ssr: false, loading: loadingComponent }
);
const RecipeDetail = dynamic(
  () => import('@/components/dapurmind/RecipeDetail').then(m => ({ default: m.RecipeDetail })),
  { ssr: false, loading: loadingComponent }
);
const MealPlanDetail = dynamic(
  () => import('@/components/dapurmind/MealPlanDetail').then(m => ({ default: m.MealPlanDetail })),
  { ssr: false, loading: loadingComponent }
);
const AdminLogin = dynamic(
  () => import('@/components/dapurmind/AdminLogin').then(m => ({ default: m.AdminLogin })),
  { ssr: false, loading: loadingComponent }
);
const MarketplaceHub = dynamic(
  () => import('@/components/dapurmind/MarketplaceHub').then(m => ({ default: m.MarketplaceHub })),
  { ssr: false, loading: loadingComponent }
);
const AdminAffiliate = dynamic(
  () => import('@/components/dapurmind/AdminAffiliate').then(m => ({ default: m.AdminAffiliate })),
  { ssr: false, loading: loadingComponent }
);
const AdminAnalytics = dynamic(
  () => import('@/components/dapurmind/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })),
  { ssr: false, loading: loadingComponent }
);
const FavoritePage = dynamic(
  () => import('@/components/dapurmind/FavoritePage').then(m => ({ default: m.FavoritePage })),
  { ssr: false, loading: loadingComponent }
);
const CreatorPage = dynamic(
  () => import('@/components/dapurmind/CreatorPage').then(m => ({ default: m.default })),
  { ssr: false, loading: loadingComponent }
);
const FinancialPlannerPage = dynamic(
  () => import('@/components/dapurmind/FinancialPlannerPage').then(m => ({ default: m.default })),
  { ssr: false, loading: loadingComponent }
);
const AdminUsers = dynamic(
  () => import('@/components/dapurmind/AdminUsers').then(m => ({ default: m.default })),
  { ssr: false, loading: loadingComponent }
);
const AdminAgents = dynamic(
  () => import('@/components/dapurmind/AdminAgents').then(m => ({ default: m.default })),
  { ssr: false, loading: loadingComponent }
);
const AdminSettings = dynamic(
  () => import('@/components/dapurmind/AdminSettings').then(m => ({ default: m.default })),
  { ssr: false, loading: loadingComponent }
);
const ExplorePage = dynamic(
  () => import('@/components/dapurmind/ExplorePage').then(m => ({ default: m.default })),
  { ssr: false, loading: loadingComponent }
);
const AdminAds = dynamic(
  () => import('@/components/dapurmind/AdminAds').then(m => ({ default: m.default })),
  { ssr: false, loading: loadingComponent }
);
const AdminDashboard = dynamic(
  () => import('@/components/dapurmind/AdminDashboard').then(m => ({ default: m.default })),
  { ssr: false, loading: loadingComponent }
);

/* ── Screen wrapper with error boundary ──────────────────────── */

function ScreenWrapper({ screen, children }: { screen: string; children: ReactNode }) {
  return (
    <ScreenErrorBoundary screenName={screen}>
      <Suspense fallback={<ScreenLoader />}>
        {children}
      </Suspense>
    </ScreenErrorBoundary>
  );
}

/* ── Screen renderer ──────────────────────────────────────────── */

function ScreenRouter() {
  const currentScreen = useAppStore((s) => s.currentScreen);
  const isAdminLoggedIn = useAppStore((s) => s.isAdminLoggedIn);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const firstLaunch = useAppStore((s) => s.firstLaunch);
  const user = useAppStore((s) => s.user);
  const setScreen = useAppStore((s) => s.setScreen);

  const isOnboarded = user?.isOnboarded ?? false;

  // Auth guard: redirect to admin-login if not authenticated
  React.useEffect(() => {
    if (['admin-dashboard', 'admin-affiliate', 'admin-analytics', 'admin-users', 'admin-agents', 'admin-settings', 'admin-ads'].includes(currentScreen) && !isAdminLoggedIn) {
      setScreen('admin-login');
    }
  }, [currentScreen, isAdminLoggedIn, setScreen]);

  // User auth guard: redirect to login if not authenticated (skip auth screens & splash)
  React.useEffect(() => {
    const authScreens: AppScreen[] = ['splash', 'login', 'register', 'forgot-password', 'onboarding', 'admin-login', 'admin-dashboard', 'admin-affiliate', 'admin-analytics', 'admin-users', 'admin-agents', 'admin-settings', 'admin-ads'];
    const isAuthScreen = authScreens.includes(currentScreen);
    if (!isLoggedIn && !isAuthScreen) {
      setScreen('login');
    }
  }, [currentScreen, isLoggedIn, setScreen]);

  // Splash bypass guard: redirect immediately if already registered or logged in
  React.useEffect(() => {
    if (currentScreen === 'splash') {
      if (isLoggedIn) {
        if (isOnboarded) {
          setScreen('dashboard');
        } else {
          setScreen('onboarding');
        }
      } else if (!firstLaunch) {
        setScreen('login');
      }
    }
  }, [currentScreen, isLoggedIn, isOnboarded, firstLaunch, setScreen]);

  const showSplash = currentScreen === 'splash' && !isLoggedIn && firstLaunch;
  const showLogin = currentScreen === 'login' || (currentScreen === 'splash' && !isLoggedIn && !firstLaunch);
  const showOnboarding = currentScreen === 'onboarding' || (currentScreen === 'splash' && isLoggedIn && !isOnboarded);
  const showDashboard = currentScreen === 'dashboard' || (currentScreen === 'splash' && isLoggedIn && isOnboarded);

  return (
    <AnimatePresence mode="wait">
      {showSplash && (
        <motion.div key="splash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <ScreenWrapper screen="Splash">
            <SplashScreen />
          </ScreenWrapper>
        </motion.div>
      )}
      {showLogin && (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <ScreenWrapper screen="Login">
            <LoginPage />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'register' && (
        <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <ScreenWrapper screen="Register">
            <RegisterPage />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'forgot-password' && (
        <motion.div key="forgot-password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <ScreenWrapper screen="ForgotPassword">
            <ForgotPasswordPage />
          </ScreenWrapper>
        </motion.div>
      )}
      {showOnboarding && (
        <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <ScreenWrapper screen="Onboarding">
            <OnboardingFlow />
          </ScreenWrapper>
        </motion.div>
      )}
      {showDashboard && (
        <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="Beranda">
            <Dashboard />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'chat' && (
        <motion.div key="chat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="Chat">
            <ChatInterface />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'zero-waste' && (
        <motion.div key="zero-waste" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="ZeroWaste">
            <ZeroWasteRecipe />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'recipes' && (
        <motion.div key="recipes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="Resep">
            <RecipeBrowser />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'shopping' && (
        <motion.div key="shopping" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="Belanja">
            <ShoppingList />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'profile' && (
        <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="Profil">
            <ProfilePage />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'recipe-detail' && (
        <motion.div key="recipe-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="DetailResep">
            <RecipeDetail />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'meal-plan-detail' && (
        <motion.div key="meal-plan-detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="DetailRencana">
            <MealPlanDetail />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'marketplace' && (
        <motion.div key="marketplace" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="Marketplace">
            <MarketplaceHub />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'admin-login' && (
        <motion.div key="admin-login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="AdminLogin">
            <AdminLogin />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'admin-dashboard' && (
        <motion.div key="admin-dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="AdminDashboard">
            <AdminDashboard />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'admin-affiliate' && (
        <motion.div key="admin-affiliate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="AdminAffiliate">
            <AdminAffiliate />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'admin-analytics' && (
        <motion.div key="admin-analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="AdminAnalytics">
            <AdminAnalytics />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'admin-users' && (
        <motion.div key="admin-users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="AdminUsers">
            <AdminUsers />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'admin-agents' && (
        <motion.div key="admin-agents" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="AdminAgents">
            <AdminAgents />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'admin-settings' && (
        <motion.div key="admin-settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="AdminSettings">
            <AdminSettings />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'admin-ads' && (
        <motion.div key="admin-ads" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="AdminAds">
            <AdminAds />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'favorites' && (
        <motion.div key="favorites" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="Favorit">
            <FavoritePage />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'creator' && (
        <motion.div key="creator" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="Kreator">
            <CreatorPage />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'financial-planner' && (
        <motion.div key="financial-planner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="Keuangan">
            <FinancialPlannerPage />
          </ScreenWrapper>
        </motion.div>
      )}
      {currentScreen === 'explore' && (
        <motion.div key="explore" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
          <ScreenWrapper screen="Explore">
            <ExplorePage />
          </ScreenWrapper>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function Home() {
  const currentScreen = useAppStore((s) => s.currentScreen);
  const hideNavScreens = ['splash', 'login', 'register', 'forgot-password', 'onboarding', 'admin-login', 'admin-dashboard', 'admin-affiliate', 'admin-analytics', 'admin-users', 'admin-agents', 'admin-settings', 'admin-ads'];
  const showNav = !hideNavScreens.includes(currentScreen);
  const [hydrated, setHydrated] = React.useState(false);

  // Wait for Zustand PERSIST rehydration before rendering anything
  // This prevents screen flicker (splash → login → dashboard race condition)
  React.useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  if (!hydrated) {
    return (
      <main className="relative">
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative">
      <ScreenRouter />
      {showNav && <BottomNav />}
    </main>
  );
}
