'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppState';
import { getRecipeById } from '@/lib/recipes';
import { Particles } from '@/components/dapurmind/MagicUI';
import { GlowingText } from '@/components/dapurmind/ReactBits';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AFFILIATE_MARKETPLACES, buildAffiliateUrl } from '@/lib/affiliate';
import {
  ArrowLeft,
  Leaf,
  Recycle,
  Search,
  Clock,
  ChefHat,
  Loader2,
  Sparkles,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import type { Recipe } from '@/types';

/* ── Constants ──────────────────────────────────────────────── */

const COMMON_INGREDIENTS = [
  'Tahu',
  'Tempe',
  'Bayam',
  'Kangkung',
  'Tomat',
  'Cabai',
  'Bawang',
  'Telur',
  'Ayam',
  'Ikan',
  'Udang',
  'Tepung',
  'Beras',
  'Susu',
  'Keju',
  'Wortel',
  'Kentang',
  'Labu',
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Mudah: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Sedang: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Susah: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

/* ── Types ─────────────────────────────────────────────────── */

interface ZeroWasteResult {
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: string;
  matchedIngredients: string[];
  steps: string[];
  recipeId?: string;
}

/* ── Main Component ────────────────────────────────────────── */

export function ZeroWasteRecipe() {
  const { goBack } = useAppStore();

  // State
  const [customText, setCustomText] = useState('');
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [expiryDays, setExpiryDays] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ZeroWasteResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Get all selected ingredients
  const allIngredients = React.useMemo(() => {
    const list = [...selectedChips];
    // Parse custom text for additional ingredients
    const customParts = customText
      .split(/[,\n;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    customParts.forEach((p) => {
      const lower = p.toLowerCase();
      if (!list.some((l) => l.toLowerCase() === lower)) {
        list.push(p.charAt(0).toUpperCase() + p.slice(1));
      }
    });
    return list;
  }, [selectedChips, customText]);

  // Toggle chip selection
  const toggleChip = useCallback((chip: string) => {
    setSelectedChips((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) {
        next.delete(chip);
      } else {
        next.add(chip);
      }
      return next;
    });
  }, []);

  // Search handler
  const handleSearch = useCallback(async () => {
    if (allIngredients.length === 0) {
      setError('Masukkan setidaknya satu bahan makanan.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch('/api/zero-waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: allIngredients,
          expiryDays,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan. Silakan coba lagi.');
        return;
      }

      // Parse AI response into structured results
      const parsed = parseAIResponse(data.response, allIngredients);
      setResults(parsed);
    } catch {
      setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  }, [allIngredients, expiryDays]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-background dark:to-emerald-950/20">
      {/* Particles background */}
      <Particles
        className="z-0"
        count={25}
        colors={['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669']}
        sizeRange={[3, 7]}
        continuous
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col pb-24">
        {/* ── Header ───────────────────────────────────── */}
        <header className="sticky top-0 z-20 border-b border-emerald-200/50 bg-white/80 backdrop-blur-xl dark:border-emerald-800/50 dark:bg-background/80">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
              onClick={goBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-base font-bold leading-tight text-foreground">
                  <GlowingText color="emerald" intensity={1}>
                    Zero Waste
                  </GlowingText>{' '}
                  Recipe
                </h1>
              </div>
            </div>
          </div>
          <div className="border-t border-emerald-100/50 px-4 py-2 dark:border-emerald-900/50">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Recycle className="h-3 w-3 text-emerald-500" />
              Selamatkan bahan makananmu dari pemborosan
            </p>
          </div>
        </header>

        {/* ── Main Content ─────────────────────────────── */}
        <main className="flex-1 px-4 pt-4">
          {/* Input Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {/* Text Area */}
            <div className="space-y-2">
              <label
                htmlFor="ingredient-input"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <ChefHat className="h-4 w-4 text-emerald-500" />
                Bahan yang tersedia
              </label>
              <Textarea
                id="ingredient-input"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Masukkan bahan yang hampir kadaluarsa..."
                className="min-h-[80px] resize-none rounded-xl border-emerald-200/50 bg-white/60 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
                rows={3}
              />
            </div>

            {/* Ingredient Chips */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                atau pilih bahan yang umum:
              </p>
              <div className="flex flex-wrap gap-2">
                {COMMON_INGREDIENTS.map((chip) => {
                  const isSelected = selectedChips.has(chip);
                  return (
                    <motion.button
                      key={chip}
                      onClick={() => toggleChip(chip)}
                      whileTap={{ scale: 0.92 }}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <span className="h-3 w-3 rounded-full border-2 border-current opacity-40" />
                      )}
                      {chip}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Expiry Slider */}
            <div className="space-y-3 rounded-xl border border-emerald-200/50 bg-white/60 p-4 dark:border-emerald-800/50 dark:bg-card/60">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Berapa hari lagi sebelum kadaluarsa?
                </label>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {expiryDays} hari
                </span>
              </div>
              <Slider
                value={[expiryDays]}
                onValueChange={(v) => setExpiryDays(v[0])}
                min={1}
                max={7}
                step={1}
                className="[&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500 [&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&>span:first-child]:bg-emerald-200 dark:[&>span:first-child]:bg-emerald-800"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Besok</span>
                <span>1 minggu</span>
              </div>
            </div>

            {/* Search Button */}
            <motion.div className="relative">
              <Button
                onClick={handleSearch}
                disabled={isLoading || allIngredients.length === 0}
                className="relative h-12 w-full overflow-hidden rounded-xl bg-emerald-600 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Mencari resep...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Cari Resep!
                    {allIngredients.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 bg-white/20 text-white hover:bg-white/30"
                      >
                        {allIngredients.length} bahan
                      </Badge>
                    )}
                  </span>
                )}
              </Button>
              {/* BorderBeam effect wrapper */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                <motion.div
                  className="absolute inset-[-50%]"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'conic-gradient(from 0deg, transparent 0%, transparent 35%, #34d399 48%, #10b981 50%, #059669 52%, transparent 65%, transparent 100%)',
                    }}
                  />
                </motion.div>
                <div className="absolute inset-[2px] rounded-[10px] bg-emerald-600" />
              </div>
            </motion.div>
          </motion.section>

          {/* ── Results Section ────────────────────────── */}
          <AnimatePresence mode="wait">
            {hasSearched && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="mt-6 space-y-4"
              >
                {/* Error state */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-800/50 dark:bg-rose-950/30"
                  >
                    <X className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                    <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
                  </motion.div>
                )}

                {/* Loading state */}
                {isLoading && (
                  <div className="space-y-4">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.15, duration: 0.4 }}
                        className="rounded-xl border border-emerald-200/50 bg-white/80 p-4 dark:border-emerald-800/50 dark:bg-card/80"
                      >
                        <div className="space-y-3">
                          <Skeleton className="h-5 w-3/5 rounded-lg" />
                          <div className="flex gap-2">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                          </div>
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-full rounded" />
                            <Skeleton className="h-4 w-4/5 rounded" />
                            <Skeleton className="h-4 w-3/5 rounded" />
                          </div>
                          <Skeleton className="h-9 w-32 rounded-lg" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Results */}
                {!isLoading && !error && results.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-emerald-500" />
                      <h2 className="text-sm font-semibold text-foreground">
                        {results.length} resep ditemukan
                      </h2>
                    </div>
                    {results.map((result, index) => (
                      <ResultCard
                        key={`${result.title}-${index}`}
                        result={result}
                        index={index}
                      />
                    ))}
                  </div>
                )}

                {/* No results */}
                {!isLoading && !error && results.length === 0 && hasSearched && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 py-12 text-center"
                  >
                    <div className="text-5xl">🤔</div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tidak ada resep yang cocok dengan bahan yang Anda miliki.
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Coba tambahkan lebih banyak bahan atau ubah jangka waktu kadaluarsa.
                    </p>
                  </motion.div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* ── Result Card ────────────────────────────────────────────── */

function ResultCard({
  result,
  index,
}: {
  result: ZeroWasteResult;
  index: number;
}) {
  const { setSelectedRecipe, setScreen } = useAppStore();

  const handleViewRecipe = () => {
    if (result.recipeId) {
      const recipe = getRecipeById(result.recipeId);
      if (recipe) {
        setSelectedRecipe(recipe);
        setScreen('recipe-detail');
        return;
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{
        duration: 0.5,
        delay: index * 0.12,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="group relative overflow-hidden rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-emerald-800/50 dark:bg-card/80"
    >
      {/* Subtle particles per card */}
      <Particles
        className="pointer-events-none z-0"
        count={8}
        colors={['#10b981', '#34d399', '#6ee7b7']}
        sizeRange={[2, 4]}
        continuous
      />

      <div className="relative z-10 space-y-3 p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight text-foreground">
            {result.title}
          </h3>
          {result.difficulty && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[result.difficulty] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {result.difficulty}
            </span>
          )}
        </div>

        {/* Description */}
        {result.description && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {result.description}
          </p>
        )}

        {/* Time + Ingredients matched */}
        <div className="flex flex-wrap items-center gap-2">
          {result.estimatedTime && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <Clock className="h-3 w-3" />
              {result.estimatedTime}
            </span>
          )}
          {result.matchedIngredients.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <CheckCircle2 className="h-3 w-3" />
              {result.matchedIngredients.length} bahan cocok
            </span>
          )}
        </div>

        {/* Matched Ingredients */}
        {result.matchedIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {result.matchedIngredients.map((ing) => (
              <span
                key={ing}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-100/60 px-2 py-0.5 text-[10px] text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
              >
                <CheckCircle2 className="h-2.5 w-2.5" />
                {ing}
              </span>
            ))}
          </div>
        )}

        {/* Steps preview */}
        {result.steps.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">
              Langkah awal:
            </p>
            <ol className="space-y-1 pl-4">
              {result.steps.slice(0, 3).map((step, i) => (
                <li
                  key={i}
                  className="text-[11px] leading-relaxed text-muted-foreground"
                >
                  <span className="mr-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    {i + 1}.
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            {result.steps.length > 3 && (
              <p className="text-[10px] text-muted-foreground/60">
                +{result.steps.length - 3} langkah lainnya...
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
            <Button
              size="sm"
              onClick={handleViewRecipe}
              className="w-full rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <ChefHat className="mr-1.5 h-3.5 w-3.5" />
              Lihat Resep Lengkap
            </Button>
          </motion.div>
        </div>

        {/* Affiliate: Beli Bahan Tambahan */}
        {result.matchedIngredients.length > 0 && (
          <div className="mt-1 space-y-1.5">
            <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              Beli Bahan Tambahan
            </p>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {AFFILIATE_MARKETPLACES.slice(0, 4).map((mp) => (
                <motion.button
                  key={mp.id}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => {
                    const query = result.title.split(' ').slice(0, 3).join(' ');
                    window.open(buildAffiliateUrl(mp.id, query), '_blank', 'noopener,noreferrer');
                  }}
                  className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${mp.borderColor} ${mp.bgColor}`}
                >
                  <span className="text-xs">{mp.logo}</span>
                  <span className="max-w-[60px] truncate">{mp.name.split(' ')[0]}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── AI Response Parser ─────────────────────────────────────── */

function parseAIResponse(
  response: string,
  userIngredients: string[]
): ZeroWasteResult[] {
  const results: ZeroWasteResult[] = [];

  // Try to parse markdown-style recipe sections
  // Split by numbered recipes or markdown headers
  const recipeBlocks = response.split(/(?:^|\n)(?:#{1,3}\s+|\d+\.\s+)/).filter(Boolean);

  if (recipeBlocks.length > 1) {
    for (const block of recipeBlocks) {
      const result = parseSingleRecipe(block, userIngredients);
      if (result) results.push(result);
    }
  }

  // Fallback: treat the entire response as one recipe
  if (results.length === 0) {
    const result = parseSingleRecipe(response, userIngredients);
    if (result) results.push(result);
  }

  return results;
}

function parseSingleRecipe(
  text: string,
  userIngredients: string[]
): ZeroWasteResult | null {
  const lines = text.split('\n').filter((l) => l.trim());

  if (lines.length === 0) return null;

  // Try to extract title from first meaningful line
  const titleLine = lines[0].replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '').trim();
  const title = titleLine.length > 80 ? titleLine.slice(0, 80) + '...' : titleLine;

  // Try to find matched ingredients
  const matchedIngredients = userIngredients.filter((ing) =>
    text.toLowerCase().includes(ing.toLowerCase())
  );

  // Try to extract steps
  const steps: string[] = [];
  const stepPattern = /^\s*(?:\d+[\.\)]|[-*])\s+(.{10,})/;
  for (const line of lines) {
    const match = line.match(stepPattern);
    if (match) {
      steps.push(match[1].trim());
      if (steps.length >= 3) break;
    }
  }

  // Try to extract description (first non-title, non-list line)
  const descriptionLines = lines
    .slice(1)
    .filter((l) => !l.match(stepPattern) && !l.match(/^#/))
    .slice(0, 2);
  const description =
    descriptionLines.length > 0 ? descriptionLines.join(' ').trim() : '';

  // Try to extract time
  let estimatedTime = '';
  const timeMatch = text.match(/(\d+)\s*(?:menit|jam|mnt)/i);
  if (timeMatch) {
    estimatedTime = `${timeMatch[1]} menit`;
  }

  // Try to extract difficulty
  let difficulty = 'Mudah';
  if (/susah|difficult/i.test(text)) difficulty = 'Susah';
  else if (/sedang|medium/i.test(text)) difficulty = 'Sedang';

  return {
    title,
    description,
    estimatedTime,
    difficulty,
    matchedIngredients,
    steps,
  };
}

export default ZeroWasteRecipe;
