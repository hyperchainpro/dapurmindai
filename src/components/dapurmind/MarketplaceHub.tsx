'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Star,
  ExternalLink,
  Sparkles,
  ShoppingBag,
  Zap,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Globe,
  TrendingUp,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import type { ShoppingItem, ProductLink } from '@/types';
import {
  AFFILIATE_MARKETPLACES,
  buildAffiliateUrl,
  buildBulkAffiliateUrl,
  getRecommendedMarketplaces,
} from '@/lib/affiliate';
import type { AffiliateMarketplace } from '@/lib/affiliate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ShineBorder,
  BentoGrid,
  BentoGridItem,
  NumberTicker,
  Marquee,
} from '@/components/dapurmind/MagicUI';
import {
  GlowingText,
  CountUp,
  ClickSpark,
  Bounce,
} from '@/components/dapurmind/ReactBits';

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

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

/* ── Constants ────────────────────────────────────────────────── */

const CATEGORY_TABS = [
  { id: 'semua', label: 'Semua', emoji: '🔍' },
  { id: 'Sayuran', label: 'Sayuran', emoji: '🥬' },
  { id: 'Daging', label: 'Daging', emoji: '🥩' },
  { id: 'Bumbu', label: 'Bumbu', emoji: '🌶️' },
  { id: 'Bahan Pokok', label: 'Bahan Pokok', emoji: '🍚' },
  { id: 'Susu & Telur', label: 'Susu & Telur', emoji: '🥚' },
];

const CATEGORY_ICONS: Record<string, string> = {
  Sayuran: '🥬',
  Daging: '🥩',
  Bumbu: '🌶️',
  'Bahan Pokok': '🍚',
  'Susu & Telur': '🥚',
  Lainnya: '📦',
};

const CATEGORY_COLORS: Record<string, string> = {
  Sayuran: 'from-green-500 to-emerald-600',
  Daging: 'from-rose-500 to-red-600',
  Bumbu: 'from-amber-500 to-orange-500',
  'Bahan Pokok': 'from-orange-500 to-yellow-500',
  'Susu & Telur': 'from-yellow-400 to-amber-500',
  Lainnya: 'from-slate-400 to-slate-600',
};

function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

function mapToCategory(category: string): string {
  const lc = category.toLowerCase();
  if (lc.includes('sayur') || lc.includes('kol') || lc.includes('tauge') || lc.includes('kangkung') || lc.includes('sawi') || lc.includes('daun bawang') || lc.includes('seledri') || lc.includes('nangka') || lc.includes('kacang panjang') || lc.includes('labu') || lc.includes('melinjo') || lc.includes('kecipir')) return 'Sayuran';
  if (lc.includes('protein') || lc.includes('ayam') || lc.includes('daging') || lc.includes('sapi') || lc.includes('telur') || lc.includes('tempe') || lc.includes('tahu') || lc.includes('ikan')) return 'Daging';
  if (lc.includes('bumbu') || lc.includes('cabai') || lc.includes('bawang') || lc.includes('kunyit') || lc.includes('jahe') || lc.includes('lengkuas') || lc.includes('serai') || lc.includes('garam') || lc.includes('gula') || lc.includes('kecap') || lc.includes('santan') || lc.includes('merica') || lc.includes('sambal')) return 'Bumbu';
  if (lc.includes('bahan utama') || lc.includes('nasi') || lc.includes('beras') || lc.includes('mie') || lc.includes('tepung') || lc.includes('air') || lc.includes('minyak') || lc.includes('susu')) return 'Bahan Pokok';
  if (lc.includes('susu') || lc.includes('telur') || lc.includes('kelapa')) return 'Susu & Telur';
  return 'Lainnya';
}

/* ── Sub-components ───────────────────────────────────────────── */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  );
}

/* ── Marketplace Horizontal Card ──────────────────────────────── */

function MarketplaceHCard({
  marketplace,
  isTopPick,
}: {
  marketplace: AffiliateMarketplace;
  isTopPick: boolean;
}) {
  const handleOpen = () => {
    window.open(marketplace.searchBaseUrl, '_blank', 'noopener,noreferrer');
  };

  const cardContent = (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={handleOpen}
      className={`relative w-[200px] shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-border/40 bg-card p-4 text-left transition-shadow hover:shadow-lg ${marketplace.bgColor}`}
    >
      {/* Top pick badge */}
      {isTopPick && (
        <div className="absolute top-2 right-2 z-10">
          <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
            <Sparkles className="h-2.5 w-2.5" />
            #1
          </span>
        </div>
      )}

      {/* Logo */}
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-3xl shadow-sm">
        {marketplace.logo}
      </div>

      {/* Info */}
      <h3 className="text-sm font-bold text-foreground truncate">{marketplace.name}</h3>
      <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{marketplace.tagline}</p>

      {/* Rating */}
      <div className="mt-2">
        <StarRating rating={marketplace.rating} />
      </div>

      {/* Features */}
      <div className="mt-2 flex flex-wrap gap-1">
        {marketplace.features.slice(0, 2).map((f) => (
          <Badge key={f} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-medium">
            {f}
          </Badge>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-3 flex items-center gap-1">
        <div className={`flex items-center gap-1 rounded-full bg-gradient-to-r ${marketplace.color} px-3 py-1 text-[10px] font-semibold text-white`}>
          <ExternalLink className="h-2.5 w-2.5" />
          Kunjungi
        </div>
      </div>
    </motion.div>
  );

  if (isTopPick) {
    return (
        <ShineBorder borderWidth={2} borderRadius={16} duration={4} color={['#10b981', '#f59e0b', '#10b981']}>
          {cardContent}
        </ShineBorder>
    );
  }

  return cardContent;
}

/* ── Product Recommendation Card ──────────────────────────────── */

function ProductCard({
  item,
  onBuy,
}: {
  item: ShoppingItem;
  onBuy: (item: ShoppingItem) => void;
}) {
  const category = mapToCategory(item.category);
  const icon = CATEGORY_ICONS[category] || '📦';
  const gradient = CATEGORY_COLORS[category] || 'from-slate-400 to-slate-600';

  return (
    <motion.div variants={fadeUp} className="group">
      <div className="rounded-xl border border-border/40 bg-card p-3 transition-all hover:border-border hover:shadow-sm">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white shadow-sm`}>
            <span className="text-lg">{icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.amount} {item.unit}
            </p>

            {/* Price & Buy */}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {item.estimatedPrice ? formatRupiah(item.estimatedPrice) : 'Est. ~Rp 15.000'}
              </span>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onBuy(item)}
                  className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                >
                  <ShoppingBag className="h-2.5 w-2.5" />
                  Beli
                </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── AI Result Card ───────────────────────────────────────────── */

interface AILinkResult {
  platform: string;
  affiliateUrl: string;
  originalPrice?: number | null;
}

function AILinkResultCard({ result, index }: { result: AILinkResult; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
        <button
          onClick={() => window.open(result.affiliateUrl, '_blank', 'noopener,noreferrer')}
          className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-card p-3 text-left transition-all hover:bg-muted/30 hover:shadow-sm"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
            <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{result.platform}</p>
            {result.originalPrice && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {formatRupiah(result.originalPrice)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] font-medium">Buka</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </button>
    </motion.div>
  );
}

/* ── Main Component ───────────────────────────────────────────── */

export function MarketplaceHub() {
  const setScreen = useAppStore((s) => s.setScreen);
  const goBack = useAppStore((s) => s.goBack);
  const shoppingItems = useAppStore((s) => s.shoppingItems);
  const setShoppingItems = useAppStore((s) => s.setShoppingItems);
  const user = useAppStore((s) => s.user);
  const setAILoading = useAppStore((s) => s.setAILoading);
  const isAILoading = useAppStore((s) => s.isAILoading);

  /* ── Local state ───────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('semua');
  const [aiResults, setAiResults] = useState<AILinkResult[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiProductName, setAiProductName] = useState('');
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [isAILinkLoading, setIsAILinkLoading] = useState(false);

  /* ── Derived state ─────────────────────────────────── */
  const uncheckedItems = useMemo(
    () => shoppingItems.filter((i) => !i.checked),
    [shoppingItems]
  );

  const filteredItems = useMemo(() => {
    let items = uncheckedItems;
    if (activeCategory !== 'semua') {
      items = items.filter((i) => mapToCategory(i.category) === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [uncheckedItems, activeCategory, searchQuery]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    filteredItems.forEach((item) => {
      const cat = mapToCategory(item.category);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    const order = ['Sayuran', 'Daging', 'Bumbu', 'Bahan Pokok', 'Susu & Telur', 'Lainnya'];
    const sorted: [string, ShoppingItem[]][] = [];
    order.forEach((cat) => {
      if (groups[cat]) sorted.push([cat, groups[cat]]);
    });
    Object.keys(groups).forEach((cat) => {
      if (!order.includes(cat)) sorted.push([cat, groups[cat]]);
    });
    return sorted;
  }, [filteredItems]);

  // Estimated total
  const estimatedTotal = useMemo(
    () => filteredItems.reduce((sum, i) => sum + (i.estimatedPrice ?? 15000), 0),
    [filteredItems]
  );

  // Top recommended marketplace
  const topMarketplace = useMemo(
    () => AFFILIATE_MARKETPLACES.find((m) => m.rating === 5) ?? AFFILIATE_MARKETPLACES[0],
    []
  );

  /* ── Handlers ──────────────────────────────────────── */
  const handleBuyItem = useCallback((item: ShoppingItem) => {
    const url = buildAffiliateUrl('tokopedia-now', item.name);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleBuyAllTokopedia = useCallback(() => {
    const names = filteredItems.map((i) => i.name);
    if (names.length === 0) return;
    const url = buildBulkAffiliateUrl('tokopedia-now', names);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [filteredItems]);

  const handleBuyAllShopee = useCallback(() => {
    const names = filteredItems.map((i) => i.name);
    if (names.length === 0) return;
    const url = buildBulkAffiliateUrl('shopee-segar', names);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [filteredItems]);

  const handleBuyAllMulti = useCallback(() => {
    const names = filteredItems.map((i) => i.name);
    if (names.length === 0) return;
    ['tokopedia-now', 'shopee-segar', 'sayurbox'].forEach((mpId, idx) => {
      setTimeout(() => {
        const url = buildBulkAffiliateUrl(mpId, names);
        window.open(url, '_blank', 'noopener,noreferrer');
      }, idx * 300);
    });
  }, [filteredItems]);

  const handleSearchAllMarketplaces = useCallback(() => {
    const query = searchQuery.trim() || 'bahan masakan';
    AFFILIATE_MARKETPLACES.forEach((mp, idx) => {
      setTimeout(() => {
        const url = buildAffiliateUrl(mp.id, query);
        window.open(url, '_blank', 'noopener,noreferrer');
      }, idx * 500);
    });
  }, [searchQuery]);

  const handleAIGenerateLinks = useCallback(async (productName: string) => {
    setIsAILinkLoading(true);
    setAiError(null);
    setAiResults([]);
    setAiProductName(productName);

    try {
      const response = await fetch('/api/affiliate/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          category: activeCategory !== 'semua' ? activeCategory : 'Lainnya',
          context: 'marketplace-hub',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAiError(data.error || 'Gagal generate tautan. Coba lagi.');
        return;
      }

      if (data.links && data.links.length > 0) {
        setAiResults(data.links);
      } else {
        setAiError('Tidak ada akun afiliasi aktif. Hubungi admin.');
      }
    } catch {
      setAiError('Terjadi kesalahan jaringan. Periksa koneksi dan coba lagi.');
    } finally {
      setIsAILinkLoading(false);
    }
  }, [activeCategory]);

  const handleRetryAI = useCallback(() => {
    if (aiProductName) {
      handleAIGenerateLinks(aiProductName);
    }
  }, [aiProductName, handleAIGenerateLinks]);

  /* ── Empty state ───────────────────────────────────── */
  if (shoppingItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-stone-50/50 to-white dark:from-background dark:via-stone-950/20 dark:to-background">
        <div className="flex flex-col pb-28">
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-border/50 bg-white/90 backdrop-blur-xl dark:bg-background/90">
            <div className="flex items-center gap-3 px-4 py-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={goBack}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-card shadow-sm transition-colors hover:bg-accent"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-4 w-4" />
              </motion.button>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-500" />
                <h1 className="text-lg font-bold tracking-tight">
                  <GlowingText color="emerald" intensity={1}>
                    Marketplace Hub
                  </GlowingText>
                </h1>
              </div>
            </div>
          </header>

          {/* Empty content */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center gap-6 px-4 pt-20 text-center"
          >
            <motion.div variants={fadeUp}>
              <Bounce intensity={3} repeat>
                <div className="relative">
                  <div className="text-8xl">🛒</div>
                  <motion.div
                    className="absolute -right-2 -top-2 text-2xl"
                    animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  >
                    ✨
                  </motion.div>
                </div>
              </Bounce>
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Belum ada bahan belanja
              </h2>
              <p className="max-w-[280px] text-sm text-muted-foreground">
                Buat rencana menu mingguan dulu yuk, biar bisa langsung belanja bahan-bahannya dengan harga terbaik!
              </p>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Button
                onClick={() => setScreen('chat')}
                className="gap-2 rounded-full bg-emerald-500 px-6 shadow-lg shadow-emerald-500/25 hover:bg-emerald-600"
              >
                <Sparkles className="h-4 w-4" />
                Buat Rencana Menu
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Main render ───────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-stone-50/50 to-white dark:from-background dark:via-stone-950/20 dark:to-background">
      <div className="flex flex-col pb-40">
        {/* ── Header ─────────────────────────────────────── */}
        <header className="sticky top-0 z-20 border-b border-border/50 bg-white/90 backdrop-blur-xl dark:bg-background/90">
          <div className="flex items-center gap-3 px-4 py-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goBack}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-card shadow-sm transition-colors hover:bg-accent"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-4 w-4" />
            </motion.button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-500" />
                <h1 className="text-lg font-bold tracking-tight">
                  <GlowingText color="emerald" intensity={1}>
                    Marketplace Hub
                  </GlowingText>
                </h1>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <NumberTicker value={uncheckedItems.length} duration={1} /> bahan siap beli
                {' · '}
                {AFFILIATE_MARKETPLACES.length} marketplace
              </p>
            </div>
          </div>
        </header>

        {/* ── Search Bar ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="px-4 pt-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari di Marketplace..."
              className="h-10 rounded-xl border-border/50 bg-muted/30 pl-9 pr-12 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-emerald-500/30"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSearchAllMarketplaces}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 items-center gap-1 rounded-lg bg-emerald-500 px-2 text-[10px] font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
            >
              <Globe className="h-3 w-3" />
              Semua
            </motion.button>
          </div>
        </motion.div>

        {/* ── Category Tabs ──────────────────────────────── */}
        <div className="mt-3 px-4">
          <div className="relative">
            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id)}
                  className="relative shrink-0 px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  <span
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${
                      activeCategory === tab.id
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    {tab.label}
                  </span>
                  {activeCategory === tab.id && (
                    <motion.div
                      layoutId="category-underline"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-emerald-500"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Featured Marketplaces ─────────────────────── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mt-5"
        >
          {/* Section Header */}
          <motion.div variants={fadeUp} className="px-4 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-foreground">Marketplace Pilihan</h2>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Rekomendasi AI
              </span>
            </div>
          </motion.div>

          {/* Marquee scroll */}
          <div className="mb-3 overflow-hidden">
            <Marquee pauseOnHover className="[--duration:15s]">
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} className="shrink-0 flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <Sparkles className="h-2.5 w-2.5" />
                    Rekomendasi AI · Harga Terbaik · Pengiriman Tercepat
                  </span>
                ))}
              </div>
            </Marquee>
          </div>

          {/* Horizontal scroll cards */}
          <div className="overflow-x-auto no-scrollbar">
            <motion.div
              variants={stagger}
              className="flex gap-3 px-4 pb-2"
            >
              {AFFILIATE_MARKETPLACES.map((mp) => (
                <motion.div key={mp.id} variants={fadeUp}>
                  <MarketplaceHCard
                    marketplace={mp}
                    isTopPick={mp.id === topMarketplace.id}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <Separator className="mx-4 my-4 bg-border/30" />

        {/* ── Product Recommendations Grid ──────────────── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="px-4"
        >
          <motion.div variants={fadeUp} className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold text-foreground">Rekomendasi Bahan</h2>
            </div>
            <Badge variant="outline" className="text-[10px] font-medium px-2 py-0">
              {filteredItems.length} item
              {filteredItems.length !== 1 ? 's' : ''}
            </Badge>
          </motion.div>

          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-12 text-center"
            >
              <div className="text-5xl">🔍</div>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? `Tidak ada bahan yang cocok dengan "${searchQuery}"`
                  : 'Tidak ada bahan dalam kategori ini'}
              </p>
              {(searchQuery || activeCategory !== 'semua') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('semua');
                  }}
                  className="text-xs text-emerald-600 dark:text-emerald-400"
                >
                  Reset Filter
                </Button>
              )}
            </motion.div>
          ) : (
            <BentoGrid className="grid-cols-1 sm:grid-cols-2 gap-2">
              {groupedItems.map(([category, items]) => (
                <motion.div key={category} variants={fadeUp}>
                  <BentoGridItem className="col-span-1 sm:col-span-2 p-0 gap-0">
                    {/* Category group header */}
                    <div className="flex items-center gap-2 px-1 pb-2 pt-1">
                      <span className="text-base">{CATEGORY_ICONS[category] || '📦'}</span>
                      <span className="text-xs font-semibold text-foreground">{category}</span>
                      <span className="text-[10px] text-muted-foreground">
                        ({items.length} item)
                      </span>
                    </div>
                    {/* Items */}
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <ProductCard
                          key={item.id}
                          item={item}
                          onBuy={handleBuyItem}
                        />
                      ))}
                    </div>
                  </BentoGridItem>
                </motion.div>
              ))}
            </BentoGrid>
          )}
        </motion.section>

        <Separator className="mx-4 my-4 bg-border/30" />

        {/* ── Quick Shopping Actions ────────────────────── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="px-4"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-foreground">Belanja Cepat</h2>
          </motion.div>

          <motion.div variants={stagger} className="space-y-2">
            {/* Tokopedia Now */}
            <motion.div variants={fadeUp}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBuyAllTokopedia}
                  disabled={filteredItems.length === 0}
                  className="flex w-full items-center gap-3 rounded-xl border border-green-200/60 bg-green-50/50 p-3 text-left transition-all hover:shadow-md dark:border-green-800/30 dark:bg-green-500/5 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-2xl shadow-sm">
                    🛒
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Beli Semua di Tokopedia Now</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Pengiriman 2 jam · Cashback 10% · {filteredItems.length} item
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                </motion.button>
            </motion.div>

            {/* Shopee Segar */}
            <motion.div variants={fadeUp}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBuyAllShopee}
                  disabled={filteredItems.length === 0}
                  className="flex w-full items-center gap-3 rounded-xl border border-orange-200/60 bg-orange-50/50 p-3 text-left transition-all hover:shadow-md dark:border-orange-800/30 dark:bg-orange-500/5 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-2xl shadow-sm">
                    🧡
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Beli Semua di Shopee Segar</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Segar dari kebun · Gratis Ongkir XTRA · {filteredItems.length} item
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
                </motion.button>
            </motion.div>

            {/* Multi-Platform */}
            <motion.div variants={fadeUp}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBuyAllMulti}
                  disabled={filteredItems.length === 0}
                  className="flex w-full items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3 text-left transition-all hover:shadow-md dark:border-emerald-800/30 dark:bg-emerald-500/5 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-amber-500 text-white shadow-sm">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Beli Semua (Multi-Platform)</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Bandingkan harga di 3 marketplace sekaligus
                    </p>
                  </div>
                  <div className="flex -space-x-1.5 shrink-0">
                    {['🛒', '🧡', '🥬'].map((e, i) => (
                      <span
                        key={i}
                        className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px]"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </motion.button>
            </motion.div>
          </motion.div>
        </motion.section>

        <Separator className="mx-4 my-4 bg-border/30" />

        {/* ── AI Link Generation Section ────────────────── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="px-4 pb-6"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-foreground">Cari Produk AI</h2>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50/50 via-white to-emerald-50/50 p-4 dark:from-amber-500/5 dark:via-background dark:to-emerald-500/5 dark:border-amber-800/20">
              <div className="flex items-start gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cari tautan afiliasi terbaik untuk produk tertentu menggunakan AI. 
                  Kami akan menemukan harga terbaik di semua platform.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Contoh: Ayam broiler 1 kg"
                  className="h-9 rounded-lg border-border/50 bg-background text-sm flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        setShowAIDialog(true);
                        handleAIGenerateLinks(val);
                      }
                    }
                  }}
                  id="ai-product-input"
                />
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('ai-product-input') as HTMLInputElement;
                      const val = input?.value.trim();
                      if (val) {
                        setShowAIDialog(true);
                        handleAIGenerateLinks(val);
                      }
                    }}
                    disabled={isAILinkLoading}
                    className="gap-1.5 h-9 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm hover:from-amber-600 hover:to-amber-700 shrink-0"
                  >
                    {isAILinkLoading ? (
                      <Bounce intensity={2}>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      </Bounce>
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Cari
                  </Button>
              </div>
            </div>
          </motion.div>
        </motion.section>
      </div>

      {/* ── Fixed Bottom Bar ──────────────────────────────── */}
      <div className="fixed bottom-[68px] inset-x-0 z-30 px-4 pb-2">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-card p-4 shadow-lg backdrop-blur-xl">
          {/* Animated gradient border replacement */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent"
              style={{
                background: 'linear-gradient(var(--tw-gradient-from, #10b981), #f59e0b, var(--tw-gradient-to, #10b981)) border-box',
                WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                opacity: 0.4,
              }}
            />
          </div>

          <div className="relative z-10 space-y-2">
            {/* Price summary */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Estimasi total ({filteredItems.length} item)
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <CountUp
                  from={0}
                  to={estimatedTotal}
                  duration={1.2}
                  formatter={(val) => formatRupiah(val)}
                />
              </span>
            </div>

            {/* CTA */}
            <ClickSpark color="#10b981" count={10}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (filteredItems.length > 0) {
                    handleBuyAllTokopedia();
                  }
                }}
                disabled={filteredItems.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="h-4 w-4" />
                Beli Semua Bahan
                {estimatedTotal > 0 && (
                  <span className="ml-1 text-xs opacity-80">
                    ({formatRupiah(estimatedTotal)})
                  </span>
                )}
              </motion.button>
            </ClickSpark>
          </div>
        </div>
      </div>

      {/* ── AI Results Dialog ────────────────────────────── */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-h-[80vh] overflow-hidden rounded-2xl sm:max-w-md p-0 gap-0">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-border/40 bg-card px-5 pt-5 pb-4">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-emerald-500 text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <GlowingText color="emerald" intensity={1}>
                  Hasil Pencarian AI
                </GlowingText>
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                {aiProductName
                  ? `Tautan afiliasi untuk "${aiProductName}" di berbagai platform.`
                  : 'Mencari tautan terbaik...'}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[50vh] px-4 py-3">
            <AnimatePresence mode="wait">
              {isAILinkLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 py-8"
                >
                  <Bounce intensity={4} repeat>
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-emerald-100 dark:from-amber-500/10 dark:to-emerald-500/10">
                      <Sparkles className="h-8 w-8 text-amber-500 animate-pulse" />
                    </div>
                  </Bounce>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-foreground">AI sedang mencari...</p>
                    <p className="text-xs text-muted-foreground">
                      Menemukan tautan terbaik di semua marketplace
                    </p>
                  </div>
                  <div className="w-full space-y-2 px-4">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                </motion.div>
              ) : aiError ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 py-8 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10">
                    <AlertCircle className="h-7 w-7 text-rose-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Oops, terjadi kesalahan</p>
                    <p className="max-w-[240px] text-xs text-muted-foreground">{aiError}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryAI}
                    className="gap-1.5 rounded-full"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Coba Lagi
                  </Button>
                </motion.div>
              ) : aiResults.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Ditemukan {aiResults.length} tautan
                    </span>
                  </div>
                  {aiResults.map((result, idx) => (
                    <AILinkResultCard key={idx} result={result} index={idx} />
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-border/40 bg-muted/30 px-5 py-3">
            <p className="text-center text-[10px] text-muted-foreground">
              Tautan dihasilkan oleh AI dan mungkin perlu verifikasi. DapurMind AI mendapat komisi dari pembelian yang berhasil.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Small helper icon ─────────────────────────────────────── */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default MarketplaceHub;
