'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppState';
import { getRecipeById } from '@/lib/recipes';
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
  ShoppingCart,
  ExternalLink,
  MessageSquare,
  Lightbulb,
  Repeat,
  Snowflake,
  BrainCircuit,
  Send,
  ChevronDown,
  ChevronUp,
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

const AI_THINKING_MESSAGES = [
  'Menganalisis bahan-bahan Anda...',
  'Mencari kombinasi resep terbaik...',
  'Mempertimbangkan waktu kadaluarsa...',
  'Menghitung nilai nutrisi...',
  'Menyusun langkah-langkah...',
  'Hampir selesai...',
];

/* ── Types ─────────────────────────────────────────────────── */

interface ZeroWasteResult {
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: string;
  matchedIngredients: string[];
  steps: string[];
  allIngredients?: string[];
  recipeId?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/* ── AI Thinking Animation Component ──────────────────────── */

function AIThinkingAnimation() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % AI_THINKING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {/* Pulsing brain icon */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/30">
          <BrainCircuit className="h-8 w-8 text-white" />
        </div>
        {/* Orbiting dots */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-8px]"
        >
          <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-300" />
          <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-teal-300" />
          <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-300" />
          <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-green-300" />
        </motion.div>
      </motion.div>

      {/* Animated message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          {AI_THINKING_MESSAGES[messageIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Progress shimmer bar */}
      <div className="h-1 w-48 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/40">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '50%' }}
        />
      </div>
    </div>
  );
}

/* ── AI Chat Follow-up Component ──────────────────────────── */

function AIChatFollowUp({
  ingredients,
  results,
}: {
  ingredients: string[];
  results: ZeroWasteResult[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = useCallback(async () => {
    if (!inputMessage.trim() || isSending) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setInputMessage('');
    setIsSending(true);

    try {
      const contextMsg = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          context: {
            conversationHistory: contextMsg,
          },
        }),
      });

      const data = await res.json();

      if (data.success && data.response) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.response,
            timestamp: Date.now(),
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Maaf, gagal mendapatkan respons. Silakan coba lagi.',
            timestamp: Date.now(),
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [inputMessage, chatMessages, isSending]);

  if (!isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4"
      >
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="w-full rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Tanya Chef Mindi tentang resep ini
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4 overflow-hidden rounded-xl border border-emerald-200/50 bg-white/80 dark:border-emerald-800/50 dark:bg-card/80"
    >
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-emerald-100 px-4 py-3 dark:border-emerald-800/50">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10">
            <ChefHat className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Chat dengan Chef Mindi
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full"
          onClick={() => setIsOpen(false)}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="text-3xl">👨‍🍳</div>
            <p className="text-xs text-muted-foreground">
              Tanyakan tentang resep, substitusi bahan, atau tips memasak!
            </p>
          </div>
        )}
        {chatMessages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-foreground dark:bg-emerald-900/20'
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs dark:bg-emerald-900/20">
              <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
              Chef Mindi sedang berpikir...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat input */}
      <div className="border-t border-emerald-100 p-3 dark:border-emerald-800/50">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Tanya tentang resep..."
            className="min-h-[36px] max-h-[80px] flex-1 resize-none rounded-lg border-emerald-200/50 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-emerald-400/50 dark:border-emerald-800/50"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isSending || !inputMessage.trim()}
            className="h-9 w-9 shrink-0 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── AI Quick Actions Component ───────────────────────────── */

function AIQuickActions({
  ingredients,
  onActionComplete,
}: {
  ingredients: string[];
  onActionComplete: (response: string) => void;
}) {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const actions = [
    {
      id: 'tips',
      icon: Lightbulb,
      label: 'Tips Penyimpanan',
      prompt: `Beri saya tips singkat cara menyimpan bahan berikut agar tahan lama: ${ingredients.join(', ')}. Berikan tips praktis dalam 3-4 poin.`,
      color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800 dark:hover:bg-amber-900/30',
    },
    {
      id: 'substitute',
      icon: Repeat,
      label: 'Substitusi Bahan',
      prompt: `Untuk bahan-bahan: ${ingredients.join(', ')}, berikan alternatif substitusi yang bisa digunakan jika salah satu bahan tidak tersedia.`,
      color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/30',
    },
    {
      id: 'freeze',
      icon: Snowflake,
      label: 'Panduan Beku',
      prompt: `Beri panduan singkat tentang bahan mana dari: ${ingredients.join(', ')} yang bisa dibekukan, cara membekukannya, dan berapa lama tahan disimpan di freezer.`,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200 hover:bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-900/20 dark:border-cyan-800 dark:hover:bg-cyan-900/30',
    },
  ];

  const handleAction = useCallback(
    async (action: (typeof actions)[0]) => {
      if (activeAction) return;
      setActiveAction(action.id);

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: action.prompt }),
        });
        const data = await res.json();
        if (data.success && data.response) {
          onActionComplete(data.response);
        }
      } catch {
        onActionComplete('Gagal mendapatkan respons. Silakan coba lagi.');
      } finally {
        setActiveAction(null);
      }
    },
    [activeAction, ingredients, onActionComplete]
  );

  return (
    <div className="mt-4 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
        Aksi Cepat AI
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAction(action)}
              disabled={activeAction === action.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${action.color} ${
                activeAction === action.id ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              {activeAction === action.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
              {action.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ── AI Quick Action Result Modal ─────────────────────────── */

function AIActionResultModal({
  result,
  onClose,
}: {
  result: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="mx-4 mb-4 w-full max-w-md rounded-2xl border border-emerald-200/50 bg-white p-5 shadow-2xl sm:mb-0 dark:border-emerald-800/50 dark:bg-card"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Respons AI
            </h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-80 overflow-y-auto text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {result}
        </div>
      </motion.div>
    </motion.div>
  );
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
  const [resultSource, setResultSource] = useState<'ai' | 'local' | 'none' | null>(null);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [aiActionResult, setAiActionResult] = useState<string | null>(null);

  // Get all selected ingredients
  const allIngredients = React.useMemo(() => {
    const list = [...selectedChips];
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
    setResultSource(null);
    setFallbackReason(null);

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

      setResultSource(data.source || 'ai');
      setFallbackReason(data.fallbackReason || null);
      const parsed = parseAIResponse(data.response, allIngredients);
      setResults(parsed);
    } catch {
      setError('Gagal terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  }, [allIngredients, expiryDays]);

  // Quick action handler
  const handleQuickActionResult = useCallback((response: string) => {
    setAiActionResult(response);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-background dark:to-emerald-950/20">
      {/* Content */}
      <div className="relative z-10 flex flex-col pb-24">
        {/* ── Header ───────────────────────────────────── */}
        <header className="sticky top-0 z-20 glass">
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
                  Zero Waste Recipe
                </h1>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 dark:border-emerald-900/50">
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
                          ? 'bg-emerald-500 text-white shadow-nm-accent'
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
                className="relative h-12 w-full overflow-hidden rounded-xl bg-emerald-600 text-base font-semibold text-white shadow-nm-accent hover:bg-emerald-700 disabled:opacity-50"
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

                {/* AI Thinking Animation */}
                {isLoading && <AIThinkingAnimation />}

                {/* Fallback notice */}
                {!isLoading && fallbackReason && resultSource === 'local' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-950/20"
                  >
                    <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Menggunakan resep lokal karena AI sedang tidak tersedia.
                    </p>
                  </motion.div>
                )}

                {/* Source badge */}
                {!isLoading && resultSource && results.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={resultSource === 'ai' ? 'default' : 'secondary'}
                      className={
                        resultSource === 'ai'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }
                    >
                      {resultSource === 'ai' ? '✨ AI-Generated' : '📚 Resep Lokal'}
                    </Badge>
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

                {/* AI Quick Actions (shown after results) */}
                {!isLoading && !error && hasSearched && (
                  <AIQuickActions
                    ingredients={allIngredients}
                    onActionComplete={handleQuickActionResult}
                  />
                )}

                {/* AI Chat Follow-up (shown after results) */}
                {!isLoading && !error && results.length > 0 && (
                  <AIChatFollowUp
                    ingredients={allIngredients}
                    results={results}
                  />
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
                      Coba tambahkan lebih banyak bahan atau ubah jangka waktu
                      kadaluarsa.
                    </p>
                  </motion.div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* AI Quick Action Result Modal */}
      <AnimatePresence>
        {aiActionResult && (
          <AIActionResultModal
            result={aiActionResult}
            onClose={() => setAiActionResult(null)}
          />
        )}
      </AnimatePresence>
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
  const { setSelectedRecipe, setScreen, addShoppingItem } = useAppStore();
  const [addedToCart, setAddedToCart] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleViewRecipe = () => {
    // If recipe exists in DB, use it directly
    if (result.recipeId) {
      const recipe = getRecipeById(result.recipeId);
      if (recipe) {
        setSelectedRecipe(recipe);
        setScreen('recipe-detail');
        return;
      }
    }
    // Otherwise create a synthetic recipe from AI result
    const syntheticRecipe: Recipe = {
      id: `zw-${result.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .slice(0, 40)}`,
      name: result.title,
      description:
        result.description ||
        `Resep Zero Waste dari bahan: ${result.matchedIngredients.join(', ')}`,
      image: '🌿',
      category: 'Makan Siang',
      difficulty: (result.difficulty as Recipe['difficulty']) || 'Mudah',
      cookTime: parseInt(result.estimatedTime) || 20,
      prepTime: 10,
      servings: 2,
      calories: 300,
      ingredients: (result.allIngredients || result.matchedIngredients).map(
        (ing) => ({
          name: ing,
          amount: 1,
          unit: 'biji',
          category: 'Bahan Utama',
        })
      ),
      steps:
        result.steps.length > 0
          ? result.steps
          : [
              'Siapkan semua bahan yang tersedia.',
              'Bersihkan dan potong bahan sesuai kebutuhan.',
              'Masak dengan api sedang hingga matang.',
              'Bumbui sesuai selera.',
              'Sajikan selagi hangat.',
            ],
      tags: [
        'zero-waste',
        ...result.matchedIngredients.map((i) => i.toLowerCase()),
      ],
      rating: 4.5,
    };
    setSelectedRecipe(syntheticRecipe);
    setScreen('recipe-detail');
  };

  const handleAddToShopping = () => {
    const items = result.allIngredients || result.matchedIngredients;
    items.forEach((ing) => {
      addShoppingItem({
        id: crypto.randomUUID(),
        name: ing,
        amount: 1,
        unit: 'biji',
        category: 'Bahan Utama',
        checked: false,
      });
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
      }}
      className="group overflow-hidden rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-emerald-800/50 dark:bg-card/80"
    >
      <div className="space-y-3 p-4">
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
              {(isExpanded ? result.steps : result.steps.slice(0, 3)).map(
                (step, i) => (
                  <li
                    key={i}
                    className="text-[11px] leading-relaxed text-muted-foreground"
                  >
                    <span className="mr-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      {i + 1}.
                    </span>
                    {step}
                  </li>
                )
              )}
            </ol>
            {result.steps.length > 3 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Tampilkan sedikit
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    +{result.steps.length - 3} langkah lainnya...
                  </>
                )}
              </button>
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
              Lihat Resep
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddToShopping}
              disabled={addedToCart}
              className="rounded-lg border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
            >
              {addedToCart ? (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Ditambahkan
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                  Belanja
                </>
              )}
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
            <div className="scroll-strip-sm">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 px-2">
              {AFFILIATE_MARKETPLACES.slice(0, 4).map((mp) => (
                <motion.button
                  key={mp.id}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => {
                    const query = result.title
                      .split(' ')
                      .slice(0, 3)
                      .join(' ');
                    window.open(
                      buildAffiliateUrl(mp.id, query),
                      '_blank',
                      'noopener,noreferrer'
                    );
                  }}
                  className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${mp.borderColor} ${mp.bgColor}`}
                >
                  <span className="text-xs">{mp.logo}</span>
                  <span className="max-w-[60px] truncate">
                    {mp.name.split(' ')[0]}
                  </span>
                </motion.button>
              ))}
              </div>
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

  const recipeBlocks = response
    .split(/(?:^|\n)(?:#{1,3}\s+|\d+\.\s+)/)
    .filter(Boolean);

  if (recipeBlocks.length > 1) {
    for (const block of recipeBlocks) {
      const result = parseSingleRecipe(block, userIngredients);
      if (result) results.push(result);
    }
  }

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

  const titleLine = lines[0]
    .replace(/^#+\s*/, '')
    .replace(/^\d+\.\s*/, '')
    .trim();
  const title =
    titleLine.length > 80 ? titleLine.slice(0, 80) + '...' : titleLine;

  const matchedIngredients = userIngredients.filter((ing) =>
    text.toLowerCase().includes(ing.toLowerCase())
  );

  // Extract all ingredients from the text
  const allIngredients: string[] = [];
  const ingSectionMatch = text.match(
    /(?:bahan[- ]?:?|ingredients?:?)([\s\S]*?)(?:langkah|cara|steps|directions)/i
  );
  if (ingSectionMatch) {
    const ingLines = ingSectionMatch[1]
      .split(/[-*•\d+[\].]/)
      .map((s) => s.replace(/[^a-zA-Z\s,]/g, '').trim())
      .filter((s) => s.length > 2 && s.length < 60);
    ingLines.forEach((s) => {
      const parts = s
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      allIngredients.push(...parts.slice(0, 2));
    });
  }
  if (allIngredients.length === 0) {
    allIngredients.push(...matchedIngredients);
  }

  const steps: string[] = [];
  const stepPattern = /^\s*(?:\d+[\.\)]|[-*])\s+(.{10,})/;
  for (const line of lines) {
    const match = line.match(stepPattern);
    if (match) {
      steps.push(match[1].trim());
      if (steps.length >= 5) break;
    }
  }

  const descriptionLines = lines
    .slice(1)
    .filter((l) => !l.match(stepPattern) && !l.match(/^#/))
    .slice(0, 2);
  const description =
    descriptionLines.length > 0 ? descriptionLines.join(' ').trim() : '';

  let estimatedTime = '';
  const timeMatch = text.match(
    /(\d+)\s*(?:menit|jam|mnt|minutes?|hours?)/i
  );
  if (timeMatch) {
    const val = parseInt(timeMatch[1]);
    estimatedTime =
      timeMatch[0].includes('jam') || timeMatch[0].includes('hour')
        ? `${val} jam`
        : `${val} menit`;
  }

  let difficulty = 'Mudah';
  if (/susah|difficult|hard/i.test(text)) difficulty = 'Susah';
  else if (/sedang|medium/i.test(text)) difficulty = 'Sedang';

  return {
    title,
    description,
    estimatedTime,
    difficulty,
    matchedIngredients,
    allIngredients,
    steps,
  };
}

export default ZeroWasteRecipe;
