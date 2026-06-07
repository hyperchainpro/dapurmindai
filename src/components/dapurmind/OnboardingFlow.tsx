'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Check,
  Sparkles,
  Users,
  Flame,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { NumberTicker } from '@/components/dapurmind/MagicUI';
import { Bounce } from '@/components/dapurmind/ReactBits';
import confetti from 'canvas-confetti';

/* ── Constants ────────────────────────────────────────────────── */

const ALLERGIES = [
  { id: 'kacang', label: '🥜 Kacang' },
  { id: 'susu', label: '🥛 Susu' },
  { id: 'telur', label: '🥚 Telur' },
  { id: 'seafood', label: '🦐 Seafood' },
  { id: 'gluten', label: '🌾 Gluten' },
  { id: 'durian', label: '🥝 Durian' },
] as const;

const TASTE_PREFERENCES = [
  { id: 'pedas', label: '🌶️ Pedas' },
  { id: 'manis', label: '🍯 Manis' },
  { id: 'asin', label: '🧂 Asin' },
  { id: 'gurih', label: '🍲 Gurih' },
  { id: 'asam', label: '🍋 Asam' },
] as const;

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const slideTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

/* ── Step components ──────────────────────────────────────────── */

/** Step 1 – Welcome */
function StepWelcome({
  name,
  setName,
}: {
  name: string;
  setName: (v: string) => void;
}) {
  const isDark = useAppStore((s) => s.isDark);

  return (
    <div className="flex flex-col items-center gap-6 px-4 pt-4">
      <Bounce intensity={3} delay={0.1}>
        <span className="text-7xl sm:text-8xl" role="img" aria-label="chef">
          👨‍🍳
        </span>
      </Bounce>

      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Selamat Datang di{' '}
          <span className="text-emerald-500">DapurMind</span>{' '}
          <span className="text-amber-500">AI!</span>
        </h2>
        <p
          className={`mt-2 text-sm sm:text-base ${
            isDark ? 'text-stone-400' : 'text-stone-500'
          }`}
        >
          Asisten perencana makanan cerdas untuk keluarga Indonesia
        </p>
      </div>

      <div className="w-full max-w-sm">
        <label
          htmlFor="onboard-name"
          className={`mb-2 block text-sm font-medium ${
            isDark ? 'text-stone-300' : 'text-stone-700'
          }`}
        >
          Siapa namamu?
        </label>
        <input
          id="onboard-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Budi Santoso"
          className={`w-full rounded-xl border px-4 py-3 text-base outline-none transition-all focus:ring-2 focus:ring-emerald-500/50 ${
            isDark
              ? 'border-white/10 bg-white/5 placeholder:text-stone-500'
              : 'nm-input placeholder:text-[var(--nm-text-light)]'
          }`}
          autoFocus
        />
      </div>
    </div>
  );
}

/** Step 2 – Keluarga */
function StepKeluarga({
  familySize,
  setFamilySize,
}: {
  familySize: number;
  setFamilySize: (v: number) => void;
}) {
  const isDark = useAppStore((s) => s.isDark);

  return (
    <div className="flex flex-col items-center gap-6 px-4 pt-4">
      <Bounce intensity={3} delay={0.1}>
        <span className="text-7xl sm:text-8xl" role="img" aria-label="family">
          👨‍👩‍👧‍👦
        </span>
      </Bounce>

      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Berapa Orang di{' '}
          <span className="text-emerald-500">Keluargamu</span>?
        </h2>
        <p
          className={`mt-2 text-sm sm:text-base ${
            isDark ? 'text-stone-400' : 'text-stone-500'
          }`}
        >
          Kami akan menyesuaikan porsi dan budget
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setFamilySize(Math.max(1, familySize - 1))}
            disabled={familySize <= 1}
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold transition-all active:scale-90 ${
              familySize <= 1
                ? 'cursor-not-allowed opacity-30'
                : isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'nm-raised-sm text-foreground'
            }`}
            aria-label="Kurangi"
          >
            <Minus className="h-5 w-5" />
          </button>

          <div
            className={`flex h-20 w-24 items-center justify-center rounded-2xl nm-pressed-deep shadow-lg`}
          >
            <NumberTicker
              key={familySize}
              value={familySize}
              duration={0.5}
              className="text-4xl font-bold text-emerald-500"
            />
          </div>

          <button
            onClick={() => setFamilySize(Math.min(10, familySize + 1))}
            disabled={familySize >= 10}
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold transition-all active:scale-90 ${
              familySize >= 10
                ? 'cursor-not-allowed opacity-30'
                : isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'nm-raised-sm text-foreground'
            }`}
            aria-label="Tambah"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <p className={`text-sm ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
          <Users className="mr-1 inline h-4 w-4" />
          {familySize === 1
            ? 'Hanya untuk dirimu sendiri'
            : `Untuk ${familySize} orang anggota keluarga`}
        </p>
      </div>
    </div>
  );
}

/** Step 3 – Preferensi */
function StepPreferensi({
  allergies,
  toggleAllergy,
  tastePrefs,
  toggleTaste,
  budget,
  setBudget,
}: {
  allergies: string[];
  toggleAllergy: (id: string) => void;
  tastePrefs: string[];
  toggleTaste: (id: string) => void;
  budget: string;
  setBudget: (v: string) => void;
}) {
  const isDark = useAppStore((s) => s.isDark);
  const [budgetError, setBudgetError] = useState('');

  const handleBudgetChange = (val: string) => {
    // Only allow numbers
    const numeric = val.replace(/[^0-9]/g, '');
    if (numeric.length > 12) return;
    const num = parseInt(numeric, 10) || 0;
    if (num > 50000000) {
      setBudgetError('Maksimal Rp 50.000.000');
      return;
    }
    setBudgetError('');
    setBudget(numeric);
  };

  const formatBudget = (val: string) => {
    const num = parseInt(val, 10) || 0;
    return num.toLocaleString('id-ID');
  };

  return (
    <div className="flex flex-col items-start gap-6 px-4 pt-4 pb-2">
      <div className="w-full flex flex-col items-center gap-3">
        <Bounce intensity={3} delay={0.1}>
          <span className="text-7xl sm:text-8xl" role="img" aria-label="spicy">
            🌶️
          </span>
        </Bounce>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="text-amber-500">Preferensi</span> Makanan
          </h2>
          <p
            className={`mt-2 text-sm sm:text-base ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}
          >
            Pilih alergi dan selera makananmu
          </p>
        </div>
      </div>

      {/* Allergies */}
      <div className="w-full max-w-sm">
        <h3
          className={`mb-3 text-sm font-semibold flex items-center gap-1.5 ${
            isDark ? 'text-stone-300' : 'text-stone-700'
          }`}
        >
          <span className="text-red-400">⚠️</span> Alergi Makanan
        </h3>
        <div className="flex flex-wrap gap-2">
          {ALLERGIES.map((item) => {
            const active = allergies.includes(item.id);
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => toggleAllergy(item.id)}
                whileTap={{ scale: 0.93 }}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all border ${
                  active
                    ? 'bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400'
                    : isDark
                      ? 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
                      : 'nm-badge text-foreground'
                }`}
              >
                {active && <Check className="mr-1 inline h-3.5 w-3.5" />}
                {item.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Taste preferences */}
      <div className="w-full max-w-sm">
        <h3
          className={`mb-3 text-sm font-semibold flex items-center gap-1.5 ${
            isDark ? 'text-stone-300' : 'text-stone-700'
          }`}
        >
          <Flame className="h-4 w-4 text-amber-500" /> Selera Makanan
        </h3>
        <div className="flex flex-wrap gap-2">
          {TASTE_PREFERENCES.map((item) => {
            const active = tastePrefs.includes(item.id);
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => toggleTaste(item.id)}
                whileTap={{ scale: 0.93 }}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition-all border ${
                  active
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    : isDark
                      ? 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
                      : 'nm-badge text-foreground'
                }`}
              >
                {active && <Check className="mr-1 inline h-3.5 w-3.5" />}
                {item.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Budget */}
      <div className="w-full max-w-sm">
        <h3
          className={`mb-3 text-sm font-semibold flex items-center gap-1.5 ${
            isDark ? 'text-stone-300' : 'text-stone-700'
          }`}
        >
          💰 Budget Mingguan
        </h3>
        <div className="relative">
          <span
            className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}
          >
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={formatBudget(budget)}
            onChange={(e) => handleBudgetChange(e.target.value)}
            placeholder="300.000"
            className={`w-full rounded-xl border py-3 pl-11 pr-4 text-base outline-none transition-all focus:ring-2 focus:ring-emerald-500/50 ${
              isDark
                ? 'border-white/10 bg-white/5 placeholder:text-stone-500'
                : 'nm-input placeholder:text-[var(--nm-text-light)]'
            }`}
          />
        </div>
        {budgetError && (
          <p className="mt-1.5 text-xs text-red-500">{budgetError}</p>
        )}
      </div>
    </div>
  );
}

/** Step 4 – Selesai */
function StepSelesai({
  name,
  familySize,
  allergies,
  tastePrefs,
  budget,
}: {
  name: string;
  familySize: number;
  allergies: string[];
  tastePrefs: string[];
  budget: string;
}) {
  const isDark = useAppStore((s) => s.isDark);
  const budgetNum = parseInt(budget, 10) || 0;
  const budgetFormatted = budgetNum.toLocaleString('id-ID');

  const allergyLabels = allergies
    .map((id) => ALLERGIES.find((a) => a.id === id)?.label)
    .filter(Boolean);
  const tasteLabels = tastePrefs
    .map((id) => TASTE_PREFERENCES.find((t) => t.id === id)?.label)
    .filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-6 px-4 pt-4 pb-2">
      <Bounce intensity={3} delay={0.1}>
        <span className="text-7xl sm:text-8xl" role="img" aria-label="sparkle">
          ✨
        </span>
      </Bounce>

      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Semua <span className="text-emerald-500">Siap!</span>
        </h2>
        <p
          className={`mt-2 text-sm sm:text-base ${
            isDark ? 'text-stone-400' : 'text-stone-500'
          }`}
        >
          Profil dapurmu sudah dikonfigurasi
        </p>
      </div>

      {/* Summary card */}
      <div
        className={`w-full max-w-sm rounded-2xl border p-5 space-y-4 ${
          isDark
            ? 'bg-white/5 border-white/10'
            : 'nm-raised'
        }`}
      >
        <SummaryRow icon="👤" label="Nama" value={name || '—'} />
        <SummaryRow icon="👨‍👩‍👧‍👦" label="Keluarga" value={`${familySize} orang`} />
        {allergyLabels.length > 0 && (
          <SummaryRow icon="⚠️" label="Alergi" value={allergyLabels.join(', ')} />
        )}
        {tasteLabels.length > 0 && (
          <SummaryRow icon="🌶️" label="Selera" value={tasteLabels.join(', ')} />
        )}
        <SummaryRow
          icon="💰"
          label="Budget / minggu"
          value={`Rp ${budgetFormatted}`}
        />
      </div>

      <div
        className={`rounded-xl px-4 py-3 text-center text-sm ${
          isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
        }`}
      >
        <Sparkles className="mr-1 inline h-4 w-4" />
        AI akan menyesuaikan resep &amp; menu berdasarkan preferensimu
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const isDark = useAppStore((s) => s.isDark);
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-lg">{icon}</span>
      <div>
        <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-stone-400'}`}>
          {label}
        </p>
        <p className={`text-sm font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ── Main OnboardingFlow ──────────────────────────────────────── */

export default function OnboardingFlow() {
  const { setScreen, updateOnboarding, isDark } = useAppStore();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Form state
  const [name, setName] = useState('');
  const [familySize, setFamilySize] = useState(4);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [tastePrefs, setTastePrefs] = useState<string[]>([]);
  const [budget, setBudget] = useState('300000');

  const toggleAllergy = (id: string) =>
    setAllergies((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  const toggleTaste = (id: string) =>
    setTastePrefs((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const canGoNext = () => {
    if (step === 0) return name.trim().length > 0;
    return true;
  };

  const goNext = () => {
    if (!canGoNext()) return;
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      // Final step – save & launch
      handleSubmit();
    }
  };

  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = () => {
    const budgetNum = parseInt(budget, 10) || 300000;

    updateOnboarding({
      name: name.trim(),
      familySize,
      allergies,
      tastePreferences: tastePrefs,
      weeklyBudget: budgetNum,
      isOnboarded: true,
    });

    // Fire confetti
    const fire = () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#fbbf24', '#34d399', '#fb923c'],
      });
    };
    fire();
    setTimeout(fire, 300);

    setTimeout(() => {
      setScreen('dashboard');
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') goNext();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden ${
        isDark
          ? 'bg-gradient-to-b from-stone-950 via-emerald-950/40 to-stone-950'
          : 'bg-[var(--nm-bg)]'
      }`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* ── Progress dots ── */}
      <div className="flex justify-center gap-2 pt-6 pb-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <motion.div
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step
                ? 'w-8 bg-emerald-500'
                : i < step
                  ? 'w-2 bg-emerald-400'
                  : 'w-2 ' + (isDark ? 'bg-white/20' : 'bg-[var(--nm-shadow-dark)]')
            }`}
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        ))}
      </div>

      {/* ── Step content (scrollable) ── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="flex flex-col items-center justify-start min-h-full"
          >
            {step === 0 && <StepWelcome name={name} setName={setName} />}
            {step === 1 && (
              <StepKeluarga
                familySize={familySize}
                setFamilySize={setFamilySize}
              />
            )}
            {step === 2 && (
              <StepPreferensi
                allergies={allergies}
                toggleAllergy={toggleAllergy}
                tastePrefs={tastePrefs}
                toggleTaste={toggleTaste}
                budget={budget}
                setBudget={setBudget}
              />
            )}
            {step === 3 && (
              <StepSelesai
                name={name}
                familySize={familySize}
                allergies={allergies}
                tastePrefs={tastePrefs}
                budget={budget}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom navigation ── */}
      <div className="flex items-center gap-3 px-6 pb-8 pt-4">
        {step > 0 && (
          <motion.button
            onClick={goBack}
            whileTap={{ scale: 0.93 }}
            className={`flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-medium transition-all ${
              isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'nm-raised-sm text-foreground'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </motion.button>
        )}

        <div className="flex-1" />

        <motion.button
          onClick={goNext}
          whileTap={{ scale: 0.93 }}
          disabled={!canGoNext()}
          className={`flex items-center gap-1.5 rounded-xl px-6 py-3 text-sm font-semibold transition-all shadow-nm-accent disabled:opacity-40 disabled:cursor-not-allowed ${
            step === TOTAL_STEPS - 1
              ? 'bg-gradient-to-r from-emerald-500 to-amber-500 text-white'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          {step === TOTAL_STEPS - 1 ? (
            <>
              Mulai Memasak!
              <Sparkles className="h-4 w-4" />
            </>
          ) : (
            <>
              Lanjut
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
