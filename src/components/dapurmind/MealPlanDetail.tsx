'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/hooks/useAppState';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Flame,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { ShineBorder } from '@/components/dapurmind/MagicUI/ShineBorder';
import { NumberTicker } from '@/components/dapurmind/MagicUI/NumberTicker';
import { BentoGrid, BentoGridItem } from '@/components/dapurmind/MagicUI/BentoGrid';
import { ClickSpark } from '@/components/dapurmind/ReactBits/ClickSpark';
import { useState, useMemo } from 'react';
import type { MealDay } from '@/types';

const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

function DayCard({ day, index }: { day: MealDay; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { setSelectedRecipe, setScreen } = useAppStore();

  const allMeals = [
    { key: 'sarapan', label: 'Sarapan', emoji: '🌅', time: '07:00' },
    { key: 'makanSiang', label: 'Makan Siang', emoji: '☀️', time: '12:00' },
    { key: 'makanMalam', label: 'Makan Malam', emoji: '🌙', time: '19:00' },
  ] as const;

  const mealEntries = allMeals
    .map((m) => ({
      ...m,
      data: day.meals[m.key],
    }))
    .filter((m) => m.data);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <ShineBorder
        borderWidth={1.5}
        duration={6}
        borderRadius={16}
        color={['#10b981', '#f59e0b', '#10b981']}
      >
        <div className="rounded-[14px] bg-card p-4">
          {/* Day Header */}
          <button
            className="flex w-full items-center justify-between"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-lg font-bold text-emerald-600">
                {index + 1}
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground">{day.day}</h3>
                <p className="text-xs text-muted-foreground">
                  {mealEntries.length} menu • {day.totalCalories || '~'} kkal
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </button>

          {/* Meals */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  {mealEntries.map((meal) => (
                    <ClickSpark key={meal.key} color="#10b981" count={6}>
                      <button
                        className="flex w-full items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3 text-left transition-colors hover:border-emerald-500/30 hover:bg-emerald-500/5"
                        onClick={() => {
                          if (meal.data) {
                            setSelectedRecipe(meal.data.recipe);
                            setScreen('recipe-detail');
                          }
                        }}
                      >
                        <span className="text-xl">{meal.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {meal.data.recipe.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {meal.data.recipe.cookTime} mnt
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {meal.data.scaledServings} porsi
                            </span>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                          {meal.label}
                        </span>
                      </button>
                    </ClickSpark>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ShineBorder>
    </motion.div>
  );
}

export function MealPlanDetail() {
  const { currentMealPlan, goBack, setScreen, setShoppingItems } = useAppStore();

  const totalDays = currentMealPlan?.days.length || 0;
  const totalMeals = useMemo(() => {
    if (!currentMealPlan) return 0;
    return currentMealPlan.days.reduce((acc, day) => {
      return (
        acc +
        (day.meals.sarapan ? 1 : 0) +
        (day.meals.makanSiang ? 1 : 0) +
        (day.meals.makanMalam ? 1 : 0)
      );
    }, 0);
  }, [currentMealPlan]);

  const handleGenerateShopping = () => {
    if (!currentMealPlan) return;
    const ingredientMap = new Map<string, { name: string; amount: number; unit: string; category: string }>();

    currentMealPlan.days.forEach((day) => {
      const allMeals = [day.meals.sarapan, day.meals.makanSiang, day.meals.makanMalam].filter(Boolean);
      allMeals.forEach((meal) => {
        if (!meal) return;
        meal.recipe.ingredients.forEach((ing) => {
          const key = ing.name.toLowerCase();
          const existing = ingredientMap.get(key);
          if (existing) {
            existing.amount += ing.amount;
          } else {
            ingredientMap.set(key, {
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              category: ing.category || 'Lainnya',
            });
          }
        });
      });
    });

    const items = Array.from(ingredientMap.values()).map((ing, i) => ({
      id: `shop-${Date.now()}-${i}`,
      name: ing.name,
      amount: Math.round(ing.amount * 100) / 100,
      unit: ing.unit,
      category: ing.category,
      checked: false,
      estimatedPrice: Math.floor(Math.random() * 15000 + 3000),
    }));

    setShoppingItems(items);
    setScreen('shopping');
  };

  if (!currentMealPlan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10">
          <Calendar className="h-10 w-10 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold">Tidak Ada Rencana</h1>
        <p className="text-sm text-muted-foreground text-center">
          Buat rencana menu mingguan melalui chat dengan Chef Mindi
        </p>
        <button
          onClick={() => setScreen('chat')}
          className="mt-4 rounded-xl bg-emerald-500 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-600"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Buat Rencana Menu
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={goBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/80 transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">Rencana Menu Mingguan</h1>
            <p className="text-xs text-muted-foreground">
              Mulai {currentMealPlan.weekStart}
            </p>
          </div>
          <UtensilsCrossed className="h-5 w-5 text-emerald-500" />
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pt-4 pb-2">
        <BentoGrid columns={{ default: 3 }} gap={1}>
          <BentoGridItem className="flex flex-col items-center py-4">
            <Calendar className="h-5 w-5 text-emerald-500 mb-1" />
            <NumberTicker value={totalDays} className="text-xl font-bold" />
            <span className="text-[11px] text-muted-foreground">Hari</span>
          </BentoGridItem>
          <BentoGridItem className="flex flex-col items-center py-4">
            <Flame className="h-5 w-5 text-amber-500 mb-1" />
            <NumberTicker value={totalMeals} className="text-xl font-bold" />
            <span className="text-[11px] text-muted-foreground">Menu</span>
          </BentoGridItem>
          <BentoGridItem className="flex flex-col items-center py-4">
            <span className="text-xl mb-1">💰</span>
            <NumberTicker value={currentMealPlan.totalPrice || 0} className="text-xl font-bold" prefix="Rp" />
            <span className="text-[11px] text-muted-foreground">Estimasi</span>
          </BentoGridItem>
        </BentoGrid>
      </div>

      {/* Action Bar */}
      <div className="px-4 py-3">
        <ClickSpark color="#f59e0b" count={10}>
          <button
            onClick={handleGenerateShopping}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Buat Daftar Belanja dari Rencana Ini
            </span>
          </button>
        </ClickSpark>
      </div>

      {/* Day List */}
      <div className="px-4 space-y-3 pb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Menu Per Hari
        </h2>
        {currentMealPlan.days.map((day, i) => (
          <DayCard key={day.day} day={day} index={i} />
        ))}
      </div>

      {/* Footer Disclaimer */}
      <div className="px-4 pb-8">
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 p-4">
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            <strong>Catatan:</strong> Estimasi harga dapat berbeda tergantung lokasi dan toko. 
            DapurMind AI adalah alat bantu perencanaan, bukan sumber medis atau gizi resmi.
          </p>
        </div>
      </div>
    </div>
  );
}
