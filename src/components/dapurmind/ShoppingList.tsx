'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShoppingCart,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Circle,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import type { ShoppingItem } from '@/types';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NumberTicker, BorderBeam } from '@/components/dapurmind/MagicUI';
import { Bounce, GlowingText } from '@/components/dapurmind/ReactBits';
import { AffiliatePicker } from '@/components/dapurmind/AffiliatePicker';
import { AFFILIATE_MARKETPLACES, buildBulkAffiliateUrl } from '@/lib/affiliate';

/* ── Category config ──────────────────────────────────────────── */

const CATEGORY_META: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  Sayuran: { label: 'Sayuran', emoji: '🥬', color: 'text-green-600 dark:text-green-400' },
  Daging: { label: 'Daging & Protein', emoji: '🥩', color: 'text-rose-600 dark:text-rose-400' },
  Bumbu: { label: 'Bumbu & Rempah', emoji: '🌶️', color: 'text-amber-600 dark:text-amber-400' },
  'Bahan Pokok': {
    label: 'Bahan Pokok',
    emoji: '🍚',
    color: 'text-orange-600 dark:text-orange-400',
  },
  'Susu & Telur': {
    label: 'Susu & Telur',
    emoji: '🥚',
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  Lainnya: { label: 'Lainnya', emoji: '📦', color: 'text-slate-600 dark:text-slate-400' },
};

const DEFAULT_CATEGORY = 'Lainnya';

function mapToCategory(category: string): string {
  const lc = category.toLowerCase();
  if (lc.includes('sayur') || lc.includes('kol') || lc.includes('tauge') || lc.includes('kangkung') || lc.includes('sawi') || lc.includes('daun bawang') || lc.includes('seledri') || lc.includes('nangka') || lc.includes('kacang panjang') || lc.includes('labu') || lc.includes('melinjo') || lc.includes('kecipir')) return 'Sayuran';
  if (lc.includes('protein') || lc.includes('ayam') || lc.includes('daging') || lc.includes('sapi') || lc.includes('telur') || lc.includes('tempe') || lc.includes('tahu') || lc.includes('ikan')) return 'Daging';
  if (lc.includes('bumbu') || lc.includes('cabai') || lc.includes('bawang') || lc.includes('kunyit') || lc.includes('jahe') || lc.includes('lengkuas') || lc.includes('serai') || lc.includes('garam') || lc.includes('gula') || lc.includes('kecap') || lc.includes('santan') || lc.includes('merica') || lc.includes('sambal')) return 'Bumbu';
  if (lc.includes('bahan utama') || lc.includes('nasi') || lc.includes('beras') || lc.includes('mie') || lc.includes('tepung') || lc.includes('air') || lc.includes('minyak') || lc.includes('susu')) return 'Bahan Pokok';
  if (lc.includes('susu') || lc.includes('telur') || lc.includes('kelapa')) return 'Susu & Telur';
  return DEFAULT_CATEGORY;
}

/* ── Format helpers ───────────────────────────────────────────── */

function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

/* ── Animation variants ───────────────────────────────────────── */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── ShoppingList component ───────────────────────────────────── */

export function ShoppingList() {
  const shoppingItems = useAppStore((s) => s.shoppingItems);
  const setShoppingItems = useAppStore((s) => s.setShoppingItems);
  const toggleShoppingItem = useAppStore((s) => s.toggleShoppingItem);
  const goBack = useAppStore((s) => s.goBack);
  const setScreen = useAppStore((s) => s.setScreen);

  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showBuyAllDialog, setShowBuyAllDialog] = useState(false);
  const [selectedAffiliateItem, setSelectedAffiliateItem] = useState<ShoppingItem | null>(null);
  const [showSingleAffiliate, setShowSingleAffiliate] = useState(false);
  const [showBulkAffiliate, setShowBulkAffiliate] = useState(false);

  /* ── Derived state ──────────────────────────────────── */
  const uncheckedItems = useMemo(
    () => shoppingItems.filter((i) => !i.checked),
    [shoppingItems]
  );

  /* ── Group by category ─────────────────────────────── */
  const grouped = useMemo(() => {
    const groups: Record<string, ShoppingItem[]> = {};
    shoppingItems.forEach((item) => {
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
  }, [shoppingItems]);

  /* ── Stats ─────────────────────────────────────────── */
  const checkedCount = useMemo(
    () => shoppingItems.filter((i) => i.checked).length,
    [shoppingItems]
  );
  const totalPrice = useMemo(
    () => shoppingItems.reduce((sum, i) => sum + (i.estimatedPrice ?? 0), 0),
    [shoppingItems]
  );
  const totalUncheckedPrice = useMemo(
    () => uncheckedItems.reduce((sum, i) => sum + (i.estimatedPrice ?? 0), 0),
    [uncheckedItems]
  );

  /* ── Handlers ──────────────────────────────────────── */
  const handleDeleteItem = useCallback(
    (id: string) => {
      setShoppingItems(shoppingItems.filter((i) => i.id !== id));
      setShowDeleteDialog(null);
    },
    [shoppingItems, setShoppingItems]
  );

  const handleAffiliateSingle = useCallback(
    (item: ShoppingItem) => {
      setSelectedAffiliateItem(item);
      setShowSingleAffiliate(true);
    },
    []
  );

  const handleAffiliateBulk = useCallback(() => {
    setShowBuyAllDialog(false);
    setSelectedAffiliateItem(null);
    setShowBulkAffiliate(true);
  }, []);

  /* ── Empty state ───────────────────────────────────── */
  if (shoppingItems.length === 0) {
    return (
      <div className="min-h-screen px-4 pb-28 pt-4">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center gap-6 pt-20 text-center"
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
                  😅
                </motion.div>
              </div>
            </Bounce>
          </motion.div>
          <motion.div variants={fadeUp} className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              Belum ada daftar belanja
            </h2>
            <p className="max-w-[260px] text-sm text-muted-foreground">
              Buat rencana menu dulu yuk, biar bisa langsung belanja bahan-bahannya!
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
    );
  }

  /* ── Main render ───────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-stone-50/50 to-white dark:from-background dark:via-stone-950/20 dark:to-background">
      <div className="flex flex-col pb-40">
        {/* ── Header ─────────────────────────────────── */}
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
                <ShoppingCart className="h-5 w-5 text-emerald-500" />
                <h1 className="text-lg font-bold tracking-tight">
                  <GlowingText color="emerald" intensity={1}>
                    Daftar Belanja
                  </GlowingText>
                </h1>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <NumberTicker value={shoppingItems.length} duration={1} /> item total
                {' · '}
                <NumberTicker value={checkedCount} duration={1} /> sudah dibeli
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Estimasi</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <NumberTicker value={totalPrice} duration={1.5} />
              </p>
            </div>
          </div>
        </header>

        {/* ── Affiliate Marketplace Banner ───────────── */}
        {uncheckedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-3"
          >
            <button
              onClick={handleAffiliateBulk}
              className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-50 via-white to-amber-50 p-3 text-left transition-all hover:shadow-md dark:from-emerald-500/10 dark:via-background dark:to-amber-500/10 border border-emerald-200/50 dark:border-emerald-800/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-amber-500 text-white">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Beli Online Sekarang
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {uncheckedItems.length} bahan belum dibeli · {formatRupiah(totalUncheckedPrice)}
                </p>
              </div>
              <div className="flex -space-x-1.5">
                {['🛒', '🧡', '🥬'].map((e, i) => (
                  <span
                    key={i}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </button>
          </motion.div>
        )}

        {/* ── Category grouped list ──────────────────── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="px-4 pt-3"
        >
          <Accordion
            type="multiple"
            defaultValue={grouped.map(([cat]) => cat)}
            className="space-y-2"
          >
            {grouped.map(([category, items]) => {
              const meta = CATEGORY_META[category] ?? CATEGORY_META[DEFAULT_CATEGORY];
              const catChecked = items.filter((i) => i.checked).length;
              const catTotal = items.reduce((s, i) => s + (i.estimatedPrice ?? 0), 0);

              return (
                <motion.div key={category} variants={fadeUp}>
                  <AccordionItem
                    value={category}
                    className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 text-left">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-lg">
                          {meta.emoji}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${meta.color}`}>
                              {meta.label}
                            </span>
                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                              {catChecked}/{items.length}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatRupiah(catTotal)}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-2">
                      <div className="space-y-1">
                        {items.map((item) => (
                          <ShoppingItemRow
                            key={item.id}
                            item={item}
                            onToggle={toggleShoppingItem}
                            onDelete={() => setShowDeleteDialog(item.id)}
                            onAffiliate={() => handleAffiliateSingle(item)}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </Accordion>
        </motion.section>
      </div>

      {/* ── Summary Bar (fixed bottom) ──────────────── */}
      <div className="fixed bottom-[68px] inset-x-0 z-30 px-4 pb-2">
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-4 shadow-lg backdrop-blur-xl">
          <BorderBeam
            duration={6}
            size={120}
            color={['#10b981', '#f59e0b', '#10b981']}
            borderWidth={1.5}
            borderRadius={16}
          />

          <div className="relative z-10 space-y-3">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-500" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {checkedCount}
                </span>
                <span className="text-muted-foreground">
                  /{shoppingItems.length} sudah dibeli
                </span>
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatRupiah(totalPrice)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-full bg-muted/60">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                initial={{ width: 0 }}
                animate={{
                  width:
                    shoppingItems.length > 0
                      ? `${(checkedCount / shoppingItems.length) * 100}%`
                      : '0%',
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>

            {/* CTA Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowBuyAllDialog(true)}
              disabled={uncheckedItems.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="h-4 w-4" />
              Beli Semua Bahan
              {totalUncheckedPrice > 0 && (
                <span className="ml-1 text-xs opacity-80">
                  ({formatRupiah(totalUncheckedPrice)})
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Single Item Affiliate Picker ──────────────── */}
      <AffiliatePicker
        open={showSingleAffiliate}
        onOpenChange={setShowSingleAffiliate}
        singleItem={selectedAffiliateItem}
      />

      {/* ── Bulk Affiliate Picker ──────────────────────── */}
      <AffiliatePicker
        open={showBulkAffiliate}
        onOpenChange={setShowBulkAffiliate}
        bulkItems={uncheckedItems}
      />

      {/* ── Delete Confirmation Dialog ───────────────── */}
      <Dialog
        open={showDeleteDialog !== null}
        onOpenChange={(open) => !open && setShowDeleteDialog(null)}
      >
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-500" />
              Hapus Item
            </DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus item ini dari daftar belanja?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(null)}
              className="flex-1 rounded-full"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteDialog && handleDeleteItem(showDeleteDialog)}
              className="flex-1 rounded-full"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Buy All Confirmation Dialog ────────────────── */}
      <Dialog open={showBuyAllDialog} onOpenChange={setShowBuyAllDialog}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-emerald-500" />
              Beli Semua Bahan
            </DialogTitle>
            <DialogDescription>
              Pilih marketplace untuk membeli {uncheckedItems.length} bahan yang belum dicentang.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Total bahan belum dibeli
              </p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatRupiah(totalUncheckedPrice)}
              </p>
            </div>
            {/* Quick marketplace shortcuts */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Pilih Marketplace:</p>
              {['tokopedia-now', 'shopee-segar', 'sayurbox'].map((mpId) => {
                const mp = AFFILIATE_MARKETPLACES.find((m) => m.id === mpId);
                if (!mp) return null;
                const url = buildBulkAffiliateUrl(mp.id, uncheckedItems.map((i) => i.name));
                return (
                  <button
                    key={mp.id}
                    onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                    className="flex w-full items-center gap-3 rounded-xl border border-border/50 p-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${mp.bgColor}`}>
                      {mp.logo}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{mp.name}</p>
                      <p className="text-[11px] text-muted-foreground">{mp.tagline}</p>
                    </div>
                    <ExternalLink className={`h-4 w-4 ${mp.textColor}`} />
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleAffiliateBulk}
              className="w-full text-center text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Lihat semua marketplace ({AFFILIATE_MARKETPLACES.length}) →
            </button>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBuyAllDialog(false)}
              className="flex-1 rounded-full"
            >
              Kembali
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Shopping Item Row ────────────────────────────────────────── */

function ShoppingItemRow({
  item,
  onToggle,
  onDelete,
  onAffiliate,
}: {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onDelete: () => void;
  onAffiliate: () => void;
}) {
  return (
    <motion.div
      layout
      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        item.checked
          ? 'bg-muted/30'
          : 'bg-transparent hover:bg-muted/30'
      }`}
    >
      {/* Checkbox */}
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={() => onToggle(item.id)}
        className="shrink-0"
        aria-label={item.checked ? 'Tandai belum dibeli' : 'Tandai sudah dibeli'}
      >
        <AnimatePresence mode="wait">
          {item.checked ? (
            <motion.div
              key="checked"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </motion.div>
          ) : (
            <motion.div
              key="unchecked"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Circle className="h-5 w-5 text-muted-foreground/40" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium transition-all ${
            item.checked
              ? 'text-muted-foreground line-through opacity-60'
              : 'text-foreground'
          }`}
        >
          {item.name}
        </p>
        <p
          className={`text-xs transition-all ${
            item.checked
              ? 'text-muted-foreground/50 line-through'
              : 'text-muted-foreground'
          }`}
        >
          {item.amount} {item.unit}
          {item.estimatedPrice !== undefined && item.estimatedPrice > 0 && (
            <span className="ml-2 font-medium text-emerald-600/80 dark:text-emerald-400/80">
              {formatRupiah(item.estimatedPrice)}
            </span>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Affiliate Buy button - always show */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onAffiliate}
          className="flex h-7 items-center gap-1 rounded-full bg-emerald-50 px-2.5 text-[10px] font-medium text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
        >
          Beli
          <ExternalLink className="h-2.5 w-2.5" />
        </motion.button>
        {/* Delete button */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/40 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 sm:opacity-100"
          aria-label="Hapus item"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default ShoppingList;
