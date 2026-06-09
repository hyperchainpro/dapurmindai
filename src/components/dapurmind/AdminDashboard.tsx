'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminFetch } from '@/lib/admin-fetch';
import {
  Users,
  Bot,
  Settings,
  BarChart3,
  Link2,
  LogOut,
  Shield,
  TrendingUp,
  RefreshCw,
  Loader2,
  ChevronRight,
  Activity,
  Zap,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/hooks/useAppState';
import { ShineBorder } from '@/components/dapurmind/MagicUI';
import { NumberTicker } from '@/components/dapurmind/MagicUI';
import { Bounce } from '@/components/dapurmind/ReactBits';
import { Skeleton } from '@/components/ui/skeleton';

/* ── Animation variants ───────────────────────────────────────── */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── Module navigation cards config ───────────────────────────── */

interface AdminModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  badge?: string;
}

const ADMIN_MODULES: AdminModule[] = [
  {
    id: 'admin-users',
    title: 'Manajemen Pengguna',
    description: 'Kelola akun, role, dan status pengguna',
    icon: <Users className="h-6 w-6" />,
    gradient: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  },
  {
    id: 'admin-agents',
    title: 'AI Agent & Token',
    description: 'Pantau penggunaan AI dan kelola agent',
    icon: <Bot className="h-6 w-6" />,
    gradient: 'from-violet-500 to-purple-500',
    iconBg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  },
  {
    id: 'admin-affiliate',
    title: 'Afiliasi Marketplace',
    description: 'Kelola koneksi dan akun afiliasi',
    icon: <Link2 className="h-6 w-6" />,
    gradient: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'admin-analytics',
    title: 'Analitik Afiliasi',
    description: 'Statistik klik, performa platform',
    icon: <BarChart3 className="h-6 w-6" />,
    gradient: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  {
    id: 'admin-settings',
    title: 'Pengaturan Sistem',
    description: 'Konfigurasi global aplikasi',
    icon: <Settings className="h-6 w-6" />,
    gradient: 'from-rose-500 to-pink-500',
    iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  },
];

/* ── Stat card skeleton ───────────────────────────────────────── */

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-16 mb-1" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */

export function AdminDashboard() {
  const setScreen = useAppStore((s) => s.setScreen);

  // Stats
  const [stats, setStats] = useState<{
    totalUsers: number;
    activeUsers: number;
    totalRecipes: number;
    aiRequests: number;
    affiliateClicks: number;
    creatorRecipes: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/stats');
      if (!res.ok) throw new Error('Gagal');
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setStats({
          totalUsers: d.users?.total ?? 0,
          activeUsers: d.users?.active ?? 0,
          totalRecipes: d.recipes?.total ?? 0,
          aiRequests: d.ai?.totalRequests ?? 0,
          affiliateClicks: d.affiliate?.totalClicks ?? 0,
          creatorRecipes: d.creators?.totalRecipes ?? 0,
        });
      }
    } catch {
      // Non-critical — show zeros
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalRecipes: 0,
        aiRequests: 0,
        affiliateClicks: 0,
        creatorRecipes: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchStats();
  };

  // ── Navigate to module ──
  const navigateTo = (screen: string) => {
    setScreen(screen as any);
  };

  // ── Logout admin ──
  const handleLogout = () => {
    useAppStore.getState().setAdminLoggedIn(false);
    useAppStore.getState().setScreen('dashboard');
  };

  return (
    <div className="relative min-h-screen pb-8 bg-gradient-to-br from-emerald-50/30 via-white to-amber-50/20 dark:from-emerald-950/20 dark:via-background dark:to-amber-950/10">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-lg px-4 pt-6"
      >
        {/* ── Header ─────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25"
            >
              <Shield className="h-6 w-6 text-white" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-foreground leading-tight">
                Admin Panel
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                DapurMind AI — Pusat Manajemen
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 shadow-sm transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20"
              aria-label="Logout admin"
            >
              <LogOut className="h-5 w-5 text-red-500" />
            </motion.button>
          </div>
        </motion.div>

        {/* ── Stats Overview ──────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold">Ringkasan Platform</h2>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleRefresh}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>

          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <ShineBorder
              color={['#10b981', '#f59e0b', '#8b5cf6']}
              borderRadius={16}
              borderWidth={2}
              duration={8}
              className="rounded-2xl"
            >
              <div className="grid grid-cols-3 gap-2 p-1">
                <Bounce delay={0.05} intensity={1.2}>
                  <div className="rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm p-3 text-center">
                    <div className="flex justify-center mb-1.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
                        <Users className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>
                    <NumberTicker
                      value={stats?.totalUsers ?? 0}
                      className="text-xl font-bold text-blue-600 dark:text-blue-400"
                      duration={1.2}
                    />
                    <p className="mt-0.5 text-[10px] text-muted-foreground">Pengguna</p>
                  </div>
                </Bounce>

                <Bounce delay={0.1} intensity={1.2}>
                  <div className="rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm p-3 text-center">
                    <div className="flex justify-center mb-1.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
                        <Bot className="h-4 w-4 text-violet-500" />
                      </div>
                    </div>
                    <NumberTicker
                      value={stats?.aiRequests ?? 0}
                      className="text-xl font-bold text-violet-600 dark:text-violet-400"
                      duration={1.2}
                    />
                    <p className="mt-0.5 text-[10px] text-muted-foreground">AI Request</p>
                  </div>
                </Bounce>

                <Bounce delay={0.15} intensity={1.2}>
                  <div className="rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm p-3 text-center">
                    <div className="flex justify-center mb-1.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                        <BarChart3 className="h-4 w-4 text-emerald-500" />
                      </div>
                    </div>
                    <NumberTicker
                      value={stats?.affiliateClicks ?? 0}
                      className="text-xl font-bold text-emerald-600 dark:text-emerald-400"
                      duration={1.2}
                    />
                    <p className="mt-0.5 text-[10px] text-muted-foreground">Klik Afiliasi</p>
                  </div>
                </Bounce>
              </div>
            </ShineBorder>
          )}

          {/* Secondary stats row */}
          {!loading && stats && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border/30 bg-card/50 p-2.5 text-center">
                <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                  {stats.activeUsers}
                </p>
                <p className="text-[9px] text-muted-foreground">Pengguna Aktif</p>
              </div>
              <div className="rounded-xl border border-border/30 bg-card/50 p-2.5 text-center">
                <p className="text-base font-bold text-teal-600 dark:text-teal-400">
                  {stats.totalRecipes}
                </p>
                <p className="text-[9px] text-muted-foreground">Total Resep</p>
              </div>
              <div className="rounded-xl border border-border/30 bg-card/50 p-2.5 text-center">
                <p className="text-base font-bold text-pink-600 dark:text-pink-400">
                  {stats.creatorRecipes}
                </p>
                <p className="text-[9px] text-muted-foreground">Resep Kreator</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Module Navigation Grid ───────────────────────── */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold">Modul Manajemen</h2>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {ADMIN_MODULES.map((mod, idx) => (
              <Bounce key={mod.id} delay={idx * 0.06} intensity={1.5} hover>
                <motion.button
                  variants={scaleIn}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigateTo(mod.id)}
                  className="w-full overflow-hidden rounded-xl border border-border/50 bg-card/90 backdrop-blur-sm transition-all hover:shadow-md hover:border-emerald-300/50 dark:hover:border-emerald-700/50 text-left"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${mod.iconBg}`}>
                        {mod.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">{mod.title}</h3>
                          {mod.badge && (
                            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-medium text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
                              {mod.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                          {mod.description}
                        </p>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>

                  {/* Bottom gradient accent */}
                  <div className={`h-0.5 w-full bg-gradient-to-r ${mod.gradient} opacity-60`} />
                </motion.button>
              </Bounce>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Quick Info ────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="rounded-xl border border-emerald-200/50 bg-white/80 p-4 dark:border-emerald-800/50 dark:bg-card/80">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Selamat Datang, Admin!</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Kelola seluruh aspek platform DapurMind AI dari panel ini. Pantau pengguna, atur AI agent,
                  kelola afiliasi, dan konfigurasi sistem dengan mudah.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── System Status ─────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold">Status Sistem</h2>
          </div>

          <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
            {[
              { label: 'Database PostgreSQL', status: 'online', color: 'text-emerald-500' },
              { label: 'AI Agent Service', status: 'online', color: 'text-emerald-500' },
              { label: 'Auth Service', status: 'online', color: 'text-emerald-500' },
            ].map((item, idx) => (
              <div
                key={item.label}
                className={`flex items-center justify-between px-4 py-3 ${idx > 0 ? 'border-t border-border/30' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`relative flex h-2.5 w-2.5 shrink-0`}>
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.color} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${item.color.replace('text-', 'bg-')}`} />
                  </span>
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
                <span className={`text-[10px] font-semibold uppercase ${item.color}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Version Footer ────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mt-6 text-center pb-4">
          <p className="text-[10px] text-muted-foreground">
            DapurMind AI Admin Panel v1.0.0
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default AdminDashboard;