'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  Star,
  Check,
  Sparkles,
  Tag,
  Clock,
  Truck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShineBorder } from '@/components/dapurmind/MagicUI';
import { GlowingText, ClickSpark, Bounce } from '@/components/dapurmind/ReactBits';
import {
  AFFILIATE_MARKETPLACES,
  buildAffiliateUrl,
  buildBulkAffiliateUrl,
  getRecommendedMarketplaces,
} from '@/lib/affiliate';
import type { ShoppingItem } from '@/types';
import type { AffiliateMarketplace } from '@/lib/affiliate';

/* ── Animation variants ───────────────────────────────────────── */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── Props ────────────────────────────────────────────────────── */

interface AffiliatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Single item mode: show marketplaces for one ingredient */
  singleItem?: ShoppingItem | null;
  /** Bulk mode: show marketplaces for all unchecked items */
  bulkItems?: ShoppingItem[];
}

/* ── Star Rating Component ───────────────────────────────────── */

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

/* ── Feature Badge ───────────────────────────────────────────── */

function FeatureBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {text.includes('jam') || text.includes('hari') ? (
        <Clock className="h-2.5 w-2.5" />
      ) : text.includes('Ongkir') || text.includes('Cashback') || text.includes('Voucher') ? (
        <Tag className="h-2.5 w-2.5" />
      ) : (
        <Truck className="h-2.5 w-2.5" />
      )}
      {text}
    </span>
  );
}

/* ── Marketplace Card ────────────────────────────────────────── */

function MarketplaceCard({
  marketplace,
  onClick,
  isTopPick,
  itemSummary,
}: {
  marketplace: AffiliateMarketplace;
  onClick: () => void;
  isTopPick: boolean;
  itemSummary: string;
}) {
  return (
    <ClickSpark key={marketplace.id} color={isTopPick ? '#10b981' : '#f59e0b'} count={6}>
      <motion.button
        variants={fadeUp}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className="w-full text-left"
      >
        {isTopPick ? (
          <ShineBorder
            borderWidth={1.5}
            borderRadius={16}
            duration={5}
            color={['#10b981', '#f59e0b', '#10b981']}
          >
            <div className="rounded-[14px] bg-card p-4">
              <MarketplaceCardContent
                marketplace={marketplace}
                isTopPick={isTopPick}
                itemSummary={itemSummary}
              />
            </div>
          </ShineBorder>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-card p-4 transition-colors hover:border-border">
            <MarketplaceCardContent
              marketplace={marketplace}
              isTopPick={isTopPick}
              itemSummary={itemSummary}
            />
          </div>
        )}
      </motion.button>
    </ClickSpark>
  );
}

function MarketplaceCardContent({
  marketplace,
  isTopPick,
  itemSummary,
}: {
  marketplace: AffiliateMarketplace;
  isTopPick: boolean;
  itemSummary: string;
}) {
  return (
    <div className="flex gap-3">
      {/* Logo */}
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${marketplace.bgColor}`}
      >
        {marketplace.logo}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-foreground truncate">
            {marketplace.name}
          </h3>
          {isTopPick && (
            <span className="shrink-0 flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-2.5 w-2.5" />
              Rekomendasi
            </span>
          )}
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground truncate">
          {marketplace.tagline}
        </p>

        <div className="mt-1.5 flex items-center gap-2">
          <StarRating rating={marketplace.rating} />
        </div>

        {/* Features */}
        <div className="mt-2 flex flex-wrap gap-1">
          {marketplace.features.map((f) => (
            <FeatureBadge key={f} text={f} />
          ))}
        </div>

        {/* Item summary */}
        <p className="mt-2 text-[11px] text-muted-foreground truncate">
          Cari: <span className="font-medium text-foreground">{itemSummary}</span>
        </p>
      </div>

      {/* Arrow */}
      <div className="flex items-center">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${marketplace.color} text-white shadow-md`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────── */

export function AffiliatePicker({
  open,
  onOpenChange,
  singleItem,
  bulkItems,
}: AffiliatePickerProps) {
  const isSingleMode = !!singleItem;
  const items = bulkItems ?? (singleItem ? [singleItem] : []);

  // Determine category for recommendations
  const primaryCategory = singleItem?.category || items[0]?.category || 'Lainnya';
  const recommendedIds = getRecommendedMarketplaces(primaryCategory).map((m) => m.id);

  // Build marketplace list with recommended first
  const sortedMarketplaces = [...AFFILIATE_MARKETPLACES].sort((a, b) => {
    const aIdx = recommendedIds.indexOf(a.id);
    const bIdx = recommendedIds.indexOf(b.id);
    if (aIdx >= 0 && bIdx < 0) return -1;
    if (bIdx >= 0 && aIdx < 0) return 1;
    return 0;
  });

  // Build query strings
  const itemNames = items.map((i) => i.name);
  const singleQuery = singleItem ? `${singleItem.name} ${singleItem.amount} ${singleItem.unit}`.trim() : '';
  const bulkQuery = itemNames.slice(0, 5).join(', ');

  const title = isSingleMode
    ? `Beli "${singleItem!.name}"`
    : `Beli Semua Bahan (${items.length} item)`;
  const description = isSingleMode
    ? 'Pilih marketplace untuk membeli bahan ini secara online.'
    : 'Pilih marketplace untuk membeli semua bahan belanjamu sekaligus.';

  const handleMarketplaceClick = (marketplace: AffiliateMarketplace) => {
    const url = isSingleMode
      ? buildAffiliateUrl(marketplace.id, singleQuery)
      : buildBulkAffiliateUrl(marketplace.id, itemNames);
    // Open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden rounded-2xl sm:max-w-md gap-0">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border/40 bg-card px-5 pt-5 pb-4">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-amber-500 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <GlowingText color="emerald" intensity={1}>
                Pilih Marketplace
              </GlowingText>
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm">
              {description}
            </DialogDescription>
          </DialogHeader>

          {/* Info banner */}
          <div className="mt-3 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                <strong>Rekomendasi AI:</strong> Marketplace ditampilkan berdasarkan kategori bahan yang kamu beli untuk harga terbaik dan pengiriman tercepat.
                {isSingleMode && singleItem?.estimatedPrice && (
                  <span className="block mt-1">
                    Estimasi harga:{' '}
                    <strong>Rp {singleItem.estimatedPrice.toLocaleString('id-ID')}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Marketplace List */}
        <div className="overflow-y-auto max-h-[50vh] px-4 py-3 no-scrollbar">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {/* Recommended section label */}
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isSingleMode ? 'Rekomendasi untuk ' + primaryCategory : 'Marketplace Terbaik'}
              </span>
            </div>

            {sortedMarketplaces.map((mp) => (
              <MarketplaceCard
                key={mp.id}
                marketplace={mp}
                onClick={() => handleMarketplaceClick(mp)}
                isTopPick={recommendedIds.indexOf(mp.id) === 0}
                itemSummary={isSingleMode ? singleQuery : bulkQuery}
              />
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <div className=" bg-muted/30 px-5 py-3">
          <p className="text-center text-[10px] text-muted-foreground">
            Dengan menekan tombol, kamu akan diarahkan ke situs marketplace pilihan.
            DapurMind AI mendapat komisi dari pembelian yang berhasil.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
