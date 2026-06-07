'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Sparkles,
  ChefHat,
  ShoppingCart,
  Save,
  Flame,
  Trash2,
  Pencil,
  Check,
  X,
  Copy,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { ShineBorder, BorderBeam } from '@/components/dapurmind/MagicUI';
import { Bounce, ClickSpark } from '@/components/dapurmind/ReactBits';
import { AFFILIATE_MARKETPLACES, buildBulkAffiliateUrl } from '@/lib/affiliate';
import type {
  ChatMessage,
  MealPlan,
  ShoppingItem,
  AppScreen,
} from '@/types';

/* ── Animation Variants ──────────────────────────────────────── */

const messageSlideUp = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const typingDot = {
  animate: (i: number) => ({
    y: [0, -6, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      delay: i * 0.15,
      ease: 'easeInOut',
    },
  }),
};

/* ── Quick Suggestions ───────────────────────────────────────── */

const quickSuggestions = [
  { label: 'Menu seminggu budget hemat', icon: '💰' },
  { label: 'Tanpa ayam & seafood', icon: '🐟' },
  { label: 'Masakan Padang saja', icon: '🌶️' },
  { label: 'Menu sehat bergizi', icon: '🥗' },
];

/* ── Typing Indicator ────────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      {/* Chef avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
        <ChefHat className="h-4 w-4 text-white" />
      </div>

      <div className="max-w-[80%] rounded-2xl nm-raised px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              custom={i}
              variants={typingDot}
              animate="animate"
              className="h-2 w-2 rounded-full bg-emerald-400"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Message Bubble ──────────────────────────────────────────── */

interface MessageBubbleProps {
  message: ChatMessage;
  onSavePlan?: (mealPlan: MealPlan) => void;
  onViewShopping?: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
}

function MessageBubble({ message, onSavePlan, onViewShopping, onDelete, onEdit }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [showActions, setShowActions] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
  }, [message.content]);

  const handleDelete = useCallback(() => {
    onDelete?.(message.id);
  }, [message.id, onDelete]);

  const handleEditStart = useCallback(() => {
    setEditValue(message.content);
    setIsEditing(true);
    setShowActions(false);
  }, [message.content]);

  const handleEditSave = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit?.(message.id, trimmed);
    }
    setIsEditing(false);
  }, [editValue, message.id, message.content, onEdit]);

  const handleEditCancel = useCallback(() => {
    setEditValue(message.content);
    setIsEditing(false);
  }, [message.content]);

  if (isUser) {
    return (
      <motion.div
        variants={messageSlideUp}
        initial="hidden"
        animate="visible"
        className="flex justify-end mb-3"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="max-w-[82%] relative group">
          <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-3 shadow-md shadow-emerald-500/20">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full rounded-lg bg-white/20 border border-white/30 px-3 py-2 text-sm text-white placeholder:text-white/50 resize-none focus:outline-none focus:ring-1 focus:ring-white/50"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={handleEditCancel}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                  <button
                    onClick={handleEditSave}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">
                {message.content}
              </p>
            )}
            <p className="mt-1.5 text-right text-[10px] text-emerald-100/70">
              {message.editedAt ? '(diedit) ' : ''}{formatTime(message.timestamp)}
            </p>
          </div>
          {/* Action buttons for user messages */}
          {!isEditing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: showActions ? 1 : 0, scale: showActions ? 1 : 0.9 }}
              className="absolute -top-3 right-2 z-10 flex items-center gap-1 rounded-lg nm-raised-sm px-1.5 py-1"
            >
              <button
                onClick={handleCopy}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Salin"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={handleEditStart}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Edit"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={handleDelete}
                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                title="Hapus"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  /* ── AI message ───────────────────────────────────────────── */

  const containsMealPlan = message.mealPlan != null;

  return (
    <motion.div
      variants={messageSlideUp}
      initial="hidden"
      animate="visible"
      className="flex items-end gap-2 mb-3"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Chef avatar badge */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
        <ChefHat className="h-4 w-4 text-white" />
      </div>

      <div className="max-w-[82%]">
        <div className="mb-1 rounded-2xl nm-raised px-4 py-3">
            {/* Chef name badge */}
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Chef Mindi
              </span>
              <Sparkles className="h-3 w-3 text-amber-500" />
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                {formatTime(message.timestamp)}
              </p>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: showActions ? 1 : 0, scale: showActions ? 1 : 0.9 }}
                className="flex items-center gap-1"
              >
                <button
                  onClick={handleCopy}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Salin"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button
                  onClick={handleDelete}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </motion.div>
            </div>
          </div>

        {/* Action buttons if meal plan is present */}
        {containsMealPlan && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-2 flex flex-col gap-2"
          >
            <ClickSpark color="emerald" count={6}>
              <button
                onClick={() => message.mealPlan && onSavePlan?.(message.mealPlan)}
                className="relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 active:scale-[0.97]"
              >
                <BorderBeam
                  duration={4}
                  size={120}
                  color={['#34d399', '#6ee7b7', '#a7f3d0']}
                  borderWidth={2}
                  borderRadius={12}
                />
                <Save className="h-4 w-4 relative z-10" />
                <span className="relative z-10">Simpan Rencana</span>
              </button>
            </ClickSpark>

            <button
              onClick={onViewShopping}
              className="flex items-center justify-center gap-2 rounded-xl nm-btn px-4 py-2.5 text-sm font-medium text-[var(--nm-text)] active:scale-[0.97]"
            >
              <ShoppingCart className="h-4 w-4 text-emerald-500" />
              <span>Lihat Daftar Belanja</span>
            </button>

            {/* Belanja Cepat - Quick affiliate buy buttons */}
            <div className="mt-1 space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Belanja Cepat
              </p>
              <div className="flex gap-2">
                {AFFILIATE_MARKETPLACES.slice(0, 3).map((mp) => (
                  <ClickSpark key={mp.id} color="#10b981" count={4}>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const items = message.mealPlan
                          ? createShoppingItemsFromPlan(message.mealPlan)
                          : [];
                        const names = items.map((i) => i.name);
                        if (names.length > 0) {
                          const url = buildBulkAffiliateUrl(mp.id, names);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className={`flex flex-1 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-medium transition-all active:scale-95 ${mp.borderColor} ${mp.bgColor}`}
                    >
                      <span className="text-sm">{mp.logo}</span>
                      <span className="truncate">{mp.name.split(' ')[0]}</span>
                    </motion.button>
                  </ClickSpark>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 0 : dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff + (diff === 0 ? -6 : 0));
  return monday.toISOString().split('T')[0];
}

/**
 * Attempts to extract a MealPlan from an AI response that contains
 * meal plan data. Returns null if no structured plan is detected.
 */
function extractMealPlanFromResponse(
  content: string,
  totalPrice: number
): MealPlan | null {
  const dayNames = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu',
  ];

  const foundDays: { day: string; meals: Record<string, string>; calories: number }[] = [];

  for (const day of dayNames) {
    const dayRegex = new RegExp(
      `\\b${day}\\b[:\\s]*([\\s\\S]*?)(?=\\b(?:Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu)\\b[:\\s]|$)`,
      'i'
    );
    const match = content.match(dayRegex);
    if (!match) continue;

    const block = match[1];
    const meals: Record<string, string> = {};

    const sarapanMatch = block.match(/sarapan[:\s]*([^\n•]+)/i);
    if (sarapanMatch) meals.sarapan = sarapanMatch[1].trim();

    const siangMatch = block.match(/(?:makan\s+)?siang[:\s]*([^\n•]+)/i);
    if (siangMatch) meals['makanSiang'] = siangMatch[1].trim();

    const malamMatch = block.match(/(?:makan\s+)?malam[:\s]*([^\n•]+)/i);
    if (malamMatch) meals['makanMalam'] = malamMatch[1].trim();

    if (Object.keys(meals).length > 0) {
      foundDays.push({ day, meals, calories: 0 });
    }
  }

  if (foundDays.length === 0) return null;

  const plan: MealPlan = {
    id: crypto.randomUUID(),
    weekStart: getWeekStart(),
    days: foundDays.map((d) => ({
      day: d.day,
      meals: {
        sarapan: d.meals.sarapan
          ? {
              recipe: {
                id: crypto.randomUUID(),
                name: d.meals.sarapan,
                description: '',
                image: '🍳',
                category: 'Sarapan',
                difficulty: 'Mudah',
                cookTime: 15,
                prepTime: 10,
                servings: 4,
                ingredients: [],
                steps: [],
                tags: [],
                rating: 4.5,
              },
              scaledServings: 4,
            }
          : undefined,
        makanSiang: d.meals['makanSiang']
          ? {
              recipe: {
                id: crypto.randomUUID(),
                name: d.meals['makanSiang'],
                description: '',
                image: '🍽️',
                category: 'Makan Siang',
                difficulty: 'Sedang',
                cookTime: 30,
                prepTime: 15,
                servings: 4,
                ingredients: [],
                steps: [],
                tags: [],
                rating: 4.5,
              },
              scaledServings: 4,
            }
          : undefined,
        makanMalam: d.meals['makanMalam']
          ? {
              recipe: {
                id: crypto.randomUUID(),
                name: d.meals['makanMalam'],
                description: '',
                image: '🌙',
                category: 'Makan Malam',
                difficulty: 'Sedang',
                cookTime: 25,
                prepTime: 10,
                servings: 4,
                ingredients: [],
                steps: [],
                tags: [],
                rating: 4.5,
              },
              scaledServings: 4,
            }
          : undefined,
      },
      totalCalories: 0,
    })),
    totalPrice,
    createdAt: new Date().toISOString(),
  };

  return plan;
}

/**
 * Creates shopping items from a meal plan by aggregating all ingredients.
 */
function createShoppingItemsFromPlan(plan: MealPlan): ShoppingItem[] {
  const ingredientMap = new Map<
    string,
    { amount: number; unit: string; category: string }
  >();

  const categoryMap: Record<string, string> = {
    Sarapan: 'Bahan Sarapan',
    'Makan Siang': 'Bahan Makan Siang',
    'Makan Malam': 'Bahan Makan Malam',
    Snack: 'Cemilan',
    Minuman: 'Minuman',
  };

  for (const day of plan.days) {
    const mealEntries = Object.entries(day.meals) as [
      string,
      { recipe: { ingredients: Array<{ name: string; amount: number; unit: string; category?: string }> } } | undefined,
    ][];

    for (const [mealType, mealItem] of mealEntries) {
      if (!mealItem) continue;

      for (const ing of mealItem.recipe.ingredients) {
        const key = ing.name.toLowerCase();
        const existing = ingredientMap.get(key);
        if (existing) {
          existing.amount += ing.amount;
        } else {
          ingredientMap.set(key, {
            amount: ing.amount,
            unit: ing.unit,
            category: ing.category || categoryMap[mealType] || 'Lainnya',
          });
        }
      }
    }
  }

  return Array.from(ingredientMap.entries()).map(([name, data], idx) => ({
    id: `shop-${idx + 1}-${Date.now()}`,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    amount: Math.round(data.amount * 100) / 100,
    unit: data.unit,
    category: data.category,
    checked: false,
    estimatedPrice: undefined,
  }));
}

/* ── Welcome Message ─────────────────────────────────────────── */

function WelcomeCard() {
  return (
    <Bounce delay={0.2} intensity={1}>
      <div className="flex items-start gap-2 mb-4">
        {/* Chef avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
          <ChefHat className="h-5 w-5 text-white" />
        </div>

        <ShineBorder
          borderRadius={16}
          borderWidth={2}
          duration={10}
          color={['#10b981', '#f59e0b', '#34d399', '#fbbf24']}
        >
          <div className="rounded-2xl nm-raised px-4 py-4 max-w-[85%]">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Chef Mindi
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">
              Halo! Saya <span className="font-semibold text-emerald-600 dark:text-emerald-400">Chef Mindi</span> 👨‍🍳
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Aku siap membantu merencanakan menu mingguanmu. Ceritakan kebutuhanmu, misalnya:
            </p>
            <div className="mt-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 px-3 py-2.5">
              <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300 italic">
                &quot;Buatkan menu seminggu budget 300 ribu untuk 4 orang&quot;
              </p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              👇 Atau tap salah satu saran di bawah
            </p>
          </div>
        </ShineBorder>
      </div>
    </Bounce>
  );
}

/* ── ChatInterface ───────────────────────────────────────────── */

export function ChatInterface() {
  const user = useAppStore((s) => s.user);
  const chatMessages = useAppStore((s) => s.chatMessages);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const deleteChatMessage = useAppStore((s) => s.deleteChatMessage);
  const updateChatMessage = useAppStore((s) => s.updateChatMessage);
  const setAILoading = useAppStore((s) => s.setAILoading);
  const isAILoading = useAppStore((s) => s.isAILoading);
  const setScreen = useAppStore((s) => s.setScreen);
  const setShoppingItems = useAppStore((s) => s.setShoppingItems);
  const addMealPlan = useAppStore((s) => s.addMealPlan);
  const setCurrentMealPlan = useAppStore((s) => s.setCurrentMealPlan);

  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasShownWelcome = useRef(false);

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAILoading]);

  // Auto-focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // The welcome message
  const showWelcome = chatMessages.length === 0;

  // Build conversation history for context
  const conversationHistory = useMemo(
    () =>
      chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    [chatMessages]
  );

  /* ── Send message handler ────────────────────────────────── */

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isAILoading) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setInputValue('');
    setAILoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: {
            userProfile: user,
            conversationHistory,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan. Coba lagi.');
      }

      const aiContent = data.response || 'Maaf, aku tidak bisa memproses permintaan itu.';

      // Check if the response looks like it contains a meal plan
      const hasDayKeywords =
        /senin|selasa|rabu|kamis|jumat|sabtu|minggu/i.test(aiContent);
      const hasMealKeywords =
        /sarapan|makan\s*(siang|malam)/i.test(aiContent);

      let mealPlan: MealPlan | undefined;

      if (hasDayKeywords && hasMealKeywords) {
        // Extract a rough total price from budget context or response
        const budgetMatch = aiContent.match(
          /(?:rp|budget|total)\s*\.?\s*([\d.]+)\s*(?:ribu|rb)?/i
        );
        const totalPrice = budgetMatch
          ? parseInt(budgetMatch[1].replace(/\./g, ''), 10) * 1000
          : user?.weeklyBudget || 300000;

        mealPlan =
          extractMealPlanFromResponse(aiContent, totalPrice) ?? undefined;
      }

      // Add AI message
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString(),
        mealPlan,
      };
      addChatMessage(aiMsg);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          err instanceof Error
            ? `⚠️ ${err.message}`
            : '⚠️ Maaf, terjadi kesalahan koneksi. Silakan coba lagi.',
        timestamp: new Date().toISOString(),
      };
      addChatMessage(errorMsg);
    } finally {
      setAILoading(false);
    }
  }, [
    inputValue,
    isAILoading,
    user,
    conversationHistory,
    addChatMessage,
    setAILoading,
  ]);

  /* ── Save plan handler ───────────────────────────────────── */

  const handleSavePlan = useCallback(
    (plan: MealPlan) => {
      addMealPlan(plan);

      // Create shopping items
      const items = createShoppingItemsFromPlan(plan);
      if (items.length > 0) {
        setShoppingItems(items);
      }

      // Navigate to meal plan detail
      setCurrentMealPlan(plan);
      setScreen('meal-plan-detail');
    },
    [addMealPlan, setShoppingItems, setCurrentMealPlan, setScreen]
  );

  /* ── View shopping handler ───────────────────────────────── */

  const handleViewShopping = useCallback(() => {
    // Find the latest message with a meal plan
    const lastPlanMsg = [...chatMessages]
      .reverse()
      .find((m) => m.role === 'assistant' && m.mealPlan);

    if (lastPlanMsg?.mealPlan) {
      const items = createShoppingItemsFromPlan(lastPlanMsg.mealPlan);
      setShoppingItems(items);
    }

    setScreen('shopping');
  }, [chatMessages, setShoppingItems, setScreen]);

  /* ── Quick suggestion handler ────────────────────────────── */

  const handleSuggestion = useCallback((label: string) => {
    setInputValue(label);
    inputRef.current?.focus();
  }, []);

  /* ── Keydown handler ─────────────────────────────────────── */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="glass sticky top-0 z-40">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          {/* Back button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => useAppStore.getState().goBack()}
            className="flex h-9 w-9 items-center justify-center rounded-full nm-raised-sm transition-colors hover:bg-accent"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </motion.button>

          {/* Title block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                Chef Mindi
              </h1>
              <div className="flex items-center gap-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Online
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Perencana Menu AI
            </p>
          </div>

          {/* Chef icon */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
            <Flame className="h-4.5 w-4.5 text-white" />
          </div>
        </div>

        {/* Animated gradient underline */}
        <div className="h-[2px] w-full overflow-hidden">
          <motion.div
            className="h-full w-full"
            style={{
              background:
                'linear-gradient(90deg, #10b981, #34d399, #f59e0b, #34d399, #10b981)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </header>

      {/* ── Chat Area ───────────────────────────────────────── */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: '180px' }}
      >
        <div className="mx-auto max-w-lg px-4 pt-4">
          {/* Welcome message on first load */}
          {showWelcome && <WelcomeCard />}

          {/* Chat messages */}
          <AnimatePresence initial={false}>
            {chatMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onSavePlan={handleSavePlan}
                onViewShopping={handleViewShopping}
                onDelete={deleteChatMessage}
                onEdit={updateChatMessage}
              />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isAILoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div ref={chatEndRef} className="h-1" />
        </div>
      </div>

      {/* ── Input Area (fixed to bottom, above nav) ─────────── */}
      <div
        className="glass fixed bottom-[68px] left-0 right-0 z-30"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="mx-auto max-w-lg px-4 pt-3 pb-2">
          {/* Quick suggestion chips */}
          <div className="mb-2.5 flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {quickSuggestions.map((suggestion) => (
              <motion.button
                key={suggestion.label}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => handleSuggestion(suggestion.label)}
                className="flex shrink-0 items-center gap-1.5 rounded-full nm-badge px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 transition-colors hover:opacity-80 active:opacity-70"
              >
                <span>{suggestion.icon}</span>
                <span>{suggestion.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tulis kebutuhan menu..."
                disabled={isAILoading}
                className="w-full rounded-2xl nm-input px-4 py-3 pr-12 text-sm text-[var(--nm-text)] placeholder:text-[var(--nm-text-light)] disabled:opacity-50"
              />
            </div>

            {/* Send button */}
            <ClickSpark color="emerald" count={4}>
              <motion.button
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.05 }}
                onClick={handleSend}
                disabled={!inputValue.trim() || isAILoading}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-nm-accent transition-all disabled:opacity-40 disabled:shadow-none"
                aria-label="Kirim pesan"
              >
                <motion.div
                  animate={
                    inputValue.trim() && !isAILoading
                      ? { scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }
                      : {}
                  }
                  transition={{ duration: 0.4 }}
                >
                  <Send className="h-5 w-5 text-white" />
                </motion.div>
              </motion.button>
            </ClickSpark>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
