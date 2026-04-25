'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Eye,
  MousePointerClick,
  ArrowLeft,
  Calendar,
  RefreshCw,
  ExternalLink,
  ShoppingBag,
  Zap,
  Target,
  Globe,
  Activity,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import type { AffiliateAnalytics, AppScreen } from '@/types';
import { AFFILIATE_MARKETPLACES } from '@/lib/affiliate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ShineBorder } from '@/components/dapurmind/MagicUI';
import { BentoGrid, BentoGridItem } from '@/components/dapurmind/MagicUI';
import { NumberTicker } from '@/components/dapurmind/MagicUI';
import { Particles } from '@/components/dapurmind/MagicUI';
import { GlowingText } from '@/components/dapurmind/ReactBits';
import { StarBorder } from '@/components/dapurmind/ReactBits';
import { ClickSpark } from '@/components/dapurmind/ReactBits';
import { Bounce } from '@/components/dapurmind/ReactBits';

/* ── Animation Variants ─────────────────────────────────── */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: 'blur(3px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
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

/* ── Label Helpers ──────────────────────────────────────── */

const CONTEXT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  weekly_plan: { label: 'Rencana Mingguan', icon: '📅', color: 'bg-emerald-500' },
  zero_waste: { label: 'Zero Waste', icon: '♻️', color: 'bg-teal-500' },
  recommendation: { label: 'Rekomendasi', icon: '⭐', color: 'bg-amber-500' },
  shopping_list: { label: 'Daftar Belanja', icon: '🛒', color: 'bg-orange-500' },
  recipe_detail: { label: 'Detail Resep', icon: '🍳', color: 'bg-rose-500' },
  chat: { label: 'Chat AI', icon: '💬', color: 'bg-violet-500' },
  dashboard: { label: 'Dashboard', icon: '🏠', color: 'bg-blue-500' },
};

function getContextInfo(key: string) {
  return (
    CONTEXT_LABELS[key] ?? {
      label: key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
      icon: '📊',
      color: 'bg-gray-500',
    }
  );
}

function getPlatformInfo(id: string) {
  return AFFILIATE_MARKETPLACES.find((mp) => mp.id === id);
}

function formatNum(n: number): string {
  return n.toLocaleString('id-ID');
}

/* ── Loading Skeleton ───────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="min-h-screen pb-28 px-4 pt-4 max-w-2xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-8 w-48" />
      </div>

      {/* Period selector skeleton */}
      <Skeleton className="h-10 w-64 rounded-lg" />

      {/* Bento grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      {/* Platform chart skeleton */}
      <Skeleton className="h-56 rounded-xl" />

      {/* Context skeleton */}
      <Skeleton className="h-40 rounded-xl" />

      {/* Daily trend skeleton */}
      <Skeleton className="h-48 rounded-xl" />

      {/* Top products skeleton */}
      <Skeleton className="h-52 rounded-xl" />

      {/* Tips skeleton */}
      <Skeleton className="h-36 rounded-xl" />
    </div>
  );
}

/* ── Empty State ────────────────────────────────────────── */

function EmptyState() {
  const setScreen = useAppStore((s) => s.setScreen);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
    >
      <Bounce intensity={2} delay={0.1}>
        <div className="text-6xl mb-4">📊</div>
      </Bounce>
      <motion.h3 variants={fadeUp} className="text-xl font-semibold text-foreground mb-2">
        Belum Ada Data Klik
      </motion.h3>
      <motion.p variants={fadeUp} className="text-muted-foreground text-sm max-w-xs mb-6">
        Mulai bagikan tautan afiliasi untuk melihat analitik performa di sini!
      </motion.p>
      <motion.div variants={fadeUp}>
        <Button
          onClick={() => setScreen('admin-affiliate' as AppScreen)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Buka Hub Marketplace
        </Button>
      </motion.div>
    </motion.div>
  );
}

/* ── Platform Bar Row ───────────────────────────────────── */

function PlatformBar({
  platformId,
  clicks,
  total,
  isTop,
}: {
  platformId: string;
  clicks: number;
  total: number;
  isTop: boolean;
}) {
  const mp = getPlatformInfo(platformId);
  const name = mp?.name ?? platformId;
  const logo = mp?.logo ?? '🔗';
  const pct = total > 0 ? (clicks / total) * 100 : 0;

  const barWidth = useSpring(0, { stiffness: 120, damping: 22 });

  useEffect(() => {
    barWidth.set(pct);
  }, [pct, barWidth]);

  return (
    <motion.div variants={fadeUp} className="group space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">{logo}</span>
          <span className="font-medium text-foreground">{name}</span>
          {isTop && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] px-1.5 py-0">
              Terpopuler
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <NumberTicker value={clicks} className="text-sm font-semibold tabular-nums text-foreground" />
          <span className="text-xs text-muted-foreground">
            ({pct.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Animated bar */}
      <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          style={{
            width: barWidth,
            minWidth: clicks > 0 ? 8 : 0,
          }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        />
      </div>
    </motion.div>
  );
}

/* ── Daily Bar ──────────────────────────────────────────── */

function DailyBar({
  date,
  count,
  maxCount,
  index,
}: {
  date: string;
  count: number;
  maxCount: number;
  index: number;
}) {
  const barHeight = useSpring(0, { stiffness: 140, damping: 20 });
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;

  useEffect(() => {
    const timer = setTimeout(() => barHeight.set(pct), index * 40);
    return () => clearTimeout(timer);
  }, [pct, barHeight, index]);

  const dayLabel = new Date(date).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col items-center gap-1.5 flex-1 min-w-0"
    >
      {/* Tooltip on hover */}
      <motion.div
        className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {formatNum(count)}
      </motion.div>

      {/* Bar */}
      <div className="w-full flex justify-center items-end" style={{ height: 100 }}>
        <motion.div
          className="w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 cursor-pointer"
          style={{
            height: barHeight,
            minWidth: count > 0 ? 12 : 0,
          }}
          whileHover={{
            scale: 1.15,
            backgroundColor: '#f59e0b',
            transition: { duration: 0.2 },
          }}
        />
      </div>

      {/* Day label */}
      <span className="text-[10px] text-muted-foreground truncate w-full text-center leading-tight">
        {dayLabel}
      </span>
    </motion.div>
  );
}

/* ── Product Row ────────────────────────────────────────── */

function ProductRow({
  rank,
  product,
}: {
  rank: number;
  product: { productName: string; platform: string; clicks: number };
}) {
  const mp = getPlatformInfo(product.platform);
  const isTop = rank === 0;

  const rowContent = (
    <div className="flex items-center gap-3 py-3 px-4 rounded-xl transition-colors hover:bg-muted/50">
      {/* Rank */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground">
        {rank + 1}
      </div>

      {/* Platform color dot */}
      <div
        className={`flex-shrink-0 w-2 h-2 rounded-full ${
          mp?.textColor ?? 'bg-gray-400'
        }`}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {product.productName}
        </p>
        <p className="text-xs text-muted-foreground">
          {mp?.name ?? product.platform}
        </p>
      </div>

      {/* Clicks */}
      <NumberTicker
        value={product.clicks}
        className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
      />
    </div>
  );

  return (
    <motion.div variants={fadeUp}>
      {isTop ? (
        <StarBorder as="div" color="amber" speed={5} starCount={10}>
          {rowContent}
        </StarBorder>
      ) : (
        rowContent
      )}
    </motion.div>
  );
}

/* ── Tip Card ───────────────────────────────────────────── */

function TipCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <ClickSpark color="emerald" count={6}>
      <motion.div
        variants={fadeUp}
        className="bg-card border border-border/50 rounded-xl p-4 cursor-pointer hover:border-emerald-500/40 transition-colors"
      >
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </motion.div>
    </ClickSpark>
  );
}

/* ── Main Component ─────────────────────────────────────── */

export function AdminAnalytics() {
  const goBack = useAppStore((s) => s.goBack);
  const setScreen = useAppStore((s) => s.setScreen);

  const [analytics, setAnalytics] = useState<AffiliateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ── Fetch ─────────────────────────────────── */
  const fetchAnalytics = useCallback(async (p: string) => {
    try {
      const res = await fetch(`/api/affiliate/analytics?period=${p}`);
      if (!res.ok) throw new Error('Gagal memuat analitik');
      const data: AffiliateAnalytics = await res.json();
      setAnalytics(data);
    } catch {
      setAnalytics(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    fetchAnalytics(period);
  };

  const handlePeriodChange = (val: string) => {
    setPeriod(val);
  };

  /* ── Derived data ──────────────────────────── */
  const sortedPlatforms = analytics
    ? Object.entries(analytics.clicksByPlatform)
        .sort((a, b) => b[1] - a[1])
    : [];

  const sortedContexts = analytics
    ? Object.entries(analytics.clicksByContext)
        .sort((a, b) => b[1] - a[1])
    : [];

  const maxDailyCount = analytics
    ? Math.max(...analytics.clicksByDay.map((d) => d.count), 1)
    : 1;

  /* ── Generate tips from analytics ──────────── */
  const generateTips = useCallback((): {
    icon: string;
    title: string;
    description: string;
  }[] => {
    if (!analytics || analytics.totalClicks === 0) return [];

    const tips: { icon: string; title: string; description: string }[] = [];

    // Top platform tip
    if (sortedPlatforms.length > 0) {
      const [topId, topClicks] = sortedPlatforms[0];
      const mp = getPlatformInfo(topId);
      tips.push({
        icon: '🏆',
        title: `Platform ${mp?.name ?? topId} Paling Banyak Diklik!`,
        description: `${formatNum(topClicks)} klik (${((topClicks / analytics.totalClicks) * 100).toFixed(1)}%). Fokus optimasi platform ini untuk hasil terbaik.`,
      });
    }

    // Context tip
    if (sortedContexts.length > 0) {
      const [topCtx, topCtxClicks] = sortedContexts[0];
      const ctxInfo = getContextInfo(topCtx);
      tips.push({
        icon: ctxInfo.icon,
        title: `${ctxInfo.label} Adalah Sumber Klik Terbanyak`,
        description: `Konteks "${ctxInfo.label}" menghasilkan ${formatNum(topCtxClicks)} klik. Pertimbangkan untuk menambah tautan afiliasi di area ini.`,
      });
    }

    // Product tip
    if (analytics.topProducts.length > 0) {
      tips.push({
        icon: '🔥',
        title: `${analytics.topProducts[0].productName} Sedang Populer`,
        description: `Produk ini mendapat ${formatNum(analytics.topProducts[0].clicks)} klik. Tambahkan produk serupa untuk meningkatkan konversi.`,
      });
    }

    // General tips
    if (analytics.activePlatforms.length < 3) {
      tips.push({
        icon: '💡',
        title: 'Aktifkan Lebih Banyak Platform',
        description: `Hanya ${analytics.activePlatforms.length} platform aktif. Tambahkan lebih banyak untuk menjangkau audiens yang lebih luas.`,
      });
    }

    if (analytics.totalProductLinks < 20) {
      tips.push({
        icon: '🚀',
        title: 'Perluas Jumlah Tautan Produk',
        description: `${formatNum(analytics.totalProductLinks)} tautan terdaftar. Tambahkan lebih banyak produk untuk meningkatkan peluang klik.`,
      });
    }

    return tips.slice(0, 3);
  }, [analytics, sortedPlatforms, sortedContexts]);

  /* ── Render ────────────────────────────────── */
  if (loading) return <LoadingSkeleton />;
  if (!analytics || analytics.totalClicks === 0) {
    return (
      <div className="min-h-screen pb-28 px-4 pt-4 max-w-2xl mx-auto">
        {/* Header still shown on empty state */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-10 w-10 flex-shrink-0"
            onClick={goBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <GlowingText color="emerald" intensity={2} className="text-xl">
            Analitik Afiliasi
          </GlowingText>
        </div>
        <EmptyState />
      </div>
    );
  }

  const tips = generateTips();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="min-h-screen pb-28 px-4 pt-4 max-w-2xl mx-auto space-y-6"
    >
      {/* ── 1. Header ─────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-10 w-10 flex-shrink-0"
            onClick={goBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <GlowingText color="emerald" intensity={2} className="text-xl">
            Analitik Afiliasi
          </GlowingText>
        </div>

        <motion.div
          animate={{ rotate: isRefreshing ? 360 : 0 }}
          transition={{
            duration: 0.8,
            ease: 'linear',
            repeat: isRefreshing ? Infinity : 0,
          }}
        >
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl h-9 w-9 flex-shrink-0"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>

      {/* ── Period Selector ──────────────────────── */}
      <motion.div variants={fadeUp}>
        <Tabs value={period} onValueChange={handlePeriodChange}>
          <TabsList className="bg-muted/60">
            <TabsTrigger value="7d" className="gap-1.5 text-xs">
              <Calendar className="h-3 w-3" />
              7 Hari
            </TabsTrigger>
            <TabsTrigger value="30d" className="gap-1.5 text-xs">
              <Calendar className="h-3 w-3" />
              30 Hari
            </TabsTrigger>
            <TabsTrigger value="90d" className="gap-1.5 text-xs">
              <Calendar className="h-3 w-3" />
              90 Hari
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* ── 2. Summary Stats BentoGrid ───────────── */}
      <motion.div variants={stagger}>
        <BentoGrid columns={{ default: 2, sm: 2, lg: 4 }} gap={0.75}>
          {/* Total Klik */}
          <ShineBorder
            color={['#10b981', '#34d399', '#6ee7b7']}
            borderRadius={12}
            borderWidth={2}
            duration={6}
            className="rounded-xl"
          >
            <BentoGridItem className="relative bg-emerald-50/50 dark:bg-emerald-950/30">
              <Particles count={8} sizeRange={[2, 4]} colors={['#10b981', '#34d399', '#6ee7b7']} />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    Total Klik
                  </span>
                </div>
                <NumberTicker
                  value={analytics.totalClicks}
                  className="text-2xl font-bold text-emerald-700 dark:text-emerald-300"
                  duration={1.5}
                />
              </div>
            </BentoGridItem>
          </ShineBorder>

          {/* Akun Aktif */}
          <BentoGridItem className="relative bg-blue-50/50 dark:bg-blue-950/30">
            <Particles count={5} sizeRange={[2, 4]} colors={['#3b82f6', '#60a5fa']} />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-2">
                <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Akun Aktif
                </span>
              </div>
              <NumberTicker
                value={analytics.totalAffiliateAccounts}
                className="text-2xl font-bold text-blue-700 dark:text-blue-300"
                duration={1.5}
              />
            </div>
          </BentoGridItem>

          {/* Produk Terlink */}
          <BentoGridItem className="relative bg-amber-50/50 dark:bg-amber-950/30">
            <Particles count={5} sizeRange={[2, 4]} colors={['#f59e0b', '#fbbf24']} />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-2">
                <ShoppingBag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Produk Terlink
                </span>
              </div>
              <NumberTicker
                value={analytics.totalProductLinks}
                className="text-2xl font-bold text-amber-700 dark:text-amber-300"
                duration={1.5}
              />
            </div>
          </BentoGridItem>

          {/* Platform Aktif */}
          <BentoGridItem className="relative bg-violet-50/50 dark:bg-violet-950/30">
            <Particles count={5} sizeRange={[2, 4]} colors={['#8b5cf6', '#a78bfa']} />
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                  Platform Aktif
                </span>
              </div>
              <NumberTicker
                value={analytics.activePlatforms.length}
                className="text-2xl font-bold text-violet-700 dark:text-violet-300"
                duration={1.5}
              />
            </div>
          </BentoGridItem>
        </BentoGrid>
      </motion.div>

      {/* ── 3. Clicks by Platform ─────────────────── */}
      <motion.div variants={fadeUp}>
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MousePointerClick className="h-4 w-4 text-emerald-500" />
              Klik per Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="space-y-4 max-h-72 overflow-y-auto pr-1"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(16,185,129,0.3) transparent',
              }}
            >
              {sortedPlatforms.map(([id, clicks]) => (
                <PlatformBar
                  key={id}
                  platformId={id}
                  clicks={clicks}
                  total={analytics.totalClicks}
                  isTop={id === sortedPlatforms[0][0]}
                />
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── 4. Clicks by Context ──────────────────── */}
      {sortedContexts.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-amber-500" />
                Klik per Konteks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 gap-3"
              >
                {sortedContexts.map(([key, count]) => {
                  const info = getContextInfo(key);
                  const pct = ((count / analytics.totalClicks) * 100).toFixed(1);
                  return (
                    <motion.div
                      key={key}
                      variants={scaleIn}
                      className="bg-muted/40 rounded-xl p-3 flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${info.color}`}
                        />
                        <span className="text-lg">{info.icon}</span>
                        <span className="text-xs font-medium text-foreground truncate">
                          {info.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <NumberTicker
                          value={count}
                          className="text-lg font-bold text-foreground"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          ({pct}%)
                        </span>
                      </div>
                      {/* Mini progress */}
                      <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            duration: 0.8,
                            ease: [0.25, 0.46, 0.45, 0.94],
                          }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── 5. Daily Clicks Trend ─────────────────── */}
      {analytics.clicksByDay.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-emerald-500" />
                Tren Klik Harian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="flex items-end gap-1.5 overflow-x-auto pb-1"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(16,185,129,0.3) transparent',
                }}
              >
                {analytics.clicksByDay.map((day, i) => (
                  <DailyBar
                    key={day.date}
                    date={day.date}
                    count={day.count}
                    maxCount={maxDailyCount}
                    index={i}
                  />
                ))}
              </motion.div>

              {/* Summary line */}
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Rata-rata:{' '}
                  <span className="font-semibold text-foreground">
                    {formatNum(
                      Math.round(
                        analytics.clicksByDay.reduce((s, d) => s + d.count, 0) /
                          analytics.clicksByDay.length
                      )
                    )}
                  </span>{' '}
                  klik/hari
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {analytics.clicksByDay.length} hari
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── 6. Top Products Table ─────────────────── */}
      {analytics.topProducts.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-amber-500" />
                Produk Terpopuler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="space-y-2 max-h-64 overflow-y-auto"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(16,185,129,0.3) transparent',
                }}
              >
                {analytics.topProducts.map((product, i) => (
                  <ProductRow key={`${product.productName}-${product.platform}`} rank={i} product={product} />
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Separator className="opacity-40" />

      {/* ── 7. Performance Tips ───────────────────── */}
      {tips.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <GlowingText color="amber" intensity={1} className="text-sm">
              💡 Tips Performa
            </GlowingText>
          </div>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {tips.map((tip, i) => (
              <TipCard
                key={`tip-${i}`}
                icon={tip.icon}
                title={tip.title}
                description={tip.description}
              />
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ── Footer Note ───────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="text-center text-xs text-muted-foreground pt-2 pb-4"
      >
        Data diperbarui secara otomatis saat periode berubah.
      </motion.div>
    </motion.div>
  );
}

export default AdminAnalytics;
