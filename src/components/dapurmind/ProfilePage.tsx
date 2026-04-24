'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Pencil,
  Heart,
  Calendar,
  Trophy,
  Lock,
  Moon,
  Sun,
  Globe,
  Info,
  Trash2,
  Plus,
  X,
  ChevronRight,
  ChefHat,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import type { Achievement } from '@/types';
import { AnimatedList } from '@/components/dapurmind/MagicUI';
import { GlowingText, Bounce, StarBorder } from '@/components/dapurmind/ReactBits';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

/* ── Helpers ──────────────────────────────────────────────────── */

function formatDateID(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/* ── Animation variants ───────────────────────────────────────── */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 14, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── ProfilePage component ────────────────────────────────────── */

export function ProfilePage() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const achievements = useAppStore((s) => s.achievements);
  const mealPlans = useAppStore((s) => s.mealPlans);
  const favoriteRecipes = useAppStore((s) => s.favoriteRecipes);
  const isDark = useAppStore((s) => s.isDark);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const setScreen = useAppStore((s) => s.setScreen);
  const setCurrentMealPlan = useAppStore((s) => s.setCurrentMealPlan);

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [showAllergyDialog, setShowAllergyDialog] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);

  const unlockedCount = useMemo(
    () => achievements.filter((a) => a.unlockedAt).length,
    [achievements]
  );

  /* ── Achievement list items for AnimatedList ──── */
  const achievementItems = useMemo(
    () =>
      achievements.map((a) => ({
        id: a.id,
        content: (
          <AchievementCard achievement={a} />
        ),
      })),
    [achievements]
  );

  /* ── Handlers ──────────────────────────────────────── */
  const handleSaveName = useCallback(() => {
    if (user && tempName.trim()) {
      setUser({ ...user, name: tempName.trim() });
    }
    setEditingName(false);
  }, [user, tempName, setUser]);

  const handleStartEditName = useCallback(() => {
    setTempName(user?.name ?? '');
    setEditingName(true);
  }, [user]);

  const handleAddAllergy = useCallback(() => {
    if (user && newAllergy.trim() && !user.allergies.includes(newAllergy.trim())) {
      setUser({
        ...user,
        allergies: [...user.allergies, newAllergy.trim()],
      });
      setNewAllergy('');
    }
  }, [user, newAllergy, setUser]);

  const handleRemoveAllergy = useCallback(
    (allergy: string) => {
      if (user) {
        setUser({
          ...user,
          allergies: user.allergies.filter((a) => a !== allergy),
        });
      }
    },
    [user, setUser]
  );

  const handleResetData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dapurmind-store');
      window.location.reload();
    }
  }, []);

  const handleMealPlanTap = useCallback(
    (index: number) => {
      setCurrentMealPlan(mealPlans[index]);
      setScreen('meal-plan-detail');
    },
    [mealPlans, setCurrentMealPlan, setScreen]
  );

  /* ── Render ────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-stone-50/50 to-white dark:from-background dark:via-stone-950/20 dark:to-background">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="flex flex-col pb-28"
      >
        {/* ── Header ─────────────────────────────────── */}
        <header className="sticky top-0 z-20 border-b border-border/50 bg-white/90 backdrop-blur-xl dark:bg-background/90">
          <div className="flex items-center gap-3 px-4 py-3">
            <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <GlowingText color="amber" intensity={1}>
                Profil
              </GlowingText>{' '}
              Saya
            </h1>
          </div>
        </header>

        {/* ── Profile Card ───────────────────────────── */}
        <motion.section variants={fadeUp} className="px-4 pt-5">
          <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 shadow-sm dark:from-emerald-500/10 dark:via-card dark:to-amber-500/5">
            {/* Decorative blobs */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-200/30 dark:bg-emerald-500/10 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-amber-200/30 dark:bg-amber-500/10 blur-2xl" />

            <div className="relative flex items-start gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl font-bold text-white shadow-lg shadow-emerald-500/30">
                  {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                </div>
                <motion.div
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs shadow-sm"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                >
                  👨‍🍳
                </motion.div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                  {editingName ? (
                    <motion.div
                      key="editing"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="flex items-center gap-2"
                    >
                      <Input
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        className="h-8 rounded-lg border-emerald-300 bg-white text-sm focus-visible:ring-emerald-400/40"
                        autoFocus
                        maxLength={30}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveName}
                        className="h-8 rounded-lg bg-emerald-500 px-3 text-xs hover:bg-emerald-600"
                      >
                        Simpan
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="display"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="flex items-center gap-2"
                    >
                      <h2 className="text-xl font-bold truncate">
                        {user?.name || 'Chef Baru'}
                      </h2>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleStartEditName}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/60 transition-colors hover:bg-muted"
                        aria-label="Edit nama"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-2 space-y-1">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="text-sm">👨‍👩‍👧‍👦</span>
                    {user?.familySize ?? 4} anggota keluarga
                  </p>
                  {user?.createdAt && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Bergabung {formatDateID(user.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="relative mt-4 grid grid-cols-3 gap-3 rounded-xl bg-white/60 p-3 dark:bg-black/20">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Heart className="h-3.5 w-3.5 text-rose-500" />
                  <p className="text-lg font-bold text-foreground">{favoriteRecipes.length}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">Resep Disimpan</p>
              </div>
              <div className="border-x border-border/30">
                <div className="flex items-center justify-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  <p className="text-lg font-bold text-foreground">{mealPlans.length}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">Menu Direncanakan</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Trophy className="h-3.5 w-3.5 text-emerald-500" />
                  <p className="text-lg font-bold text-foreground">{unlockedCount}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">Pencapaian</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Preferences ────────────────────────────── */}
        <motion.section variants={fadeUp} className="px-4 pt-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Preferensi
          </h3>
          <div className="space-y-2">
            {/* Allergies */}
            <PreferenceCard
              label="Allergi"
              value={
                user?.allergies.length
                  ? user.allergies.slice(0, 2).join(', ') +
                    (user.allergies.length > 2 ? ` +${user.allergies.length - 2}` : '')
                  : 'Belum ada'
              }
              icon="🛡️"
              onEdit={() => setShowAllergyDialog(true)}
            />

            {/* Budget */}
            <PreferenceCard
              label="Budget Mingguan"
              value={formatRupiah(user?.weeklyBudget ?? 300000)}
              icon="💰"
            />

            {/* Taste Preferences */}
            <PreferenceCard
              label="Selera"
              value={
                user?.tastePreferences.length
                  ? user.tastePreferences.slice(0, 3).join(', ') +
                    (user.tastePreferences.length > 3 ? ` +${user.tastePreferences.length - 3}` : '')
                  : 'Belum ada'
              }
              icon="👅"
            />
          </div>
        </motion.section>

        {/* ── Achievements ───────────────────────────── */}
        <motion.section variants={fadeUp} className="px-4 pt-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Trophy className="h-4 w-4 text-amber-500" />
              Pencapaian
              <span className="text-xs font-normal text-muted-foreground">
                ({unlockedCount}/{achievements.length})
              </span>
            </h3>
          </div>
          <AnimatedList
            items={achievementItems}
            staggerDelay={0.08}
            animationDuration={0.4}
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          />
        </motion.section>

        {/* ── Menu History ───────────────────────────── */}
        {mealPlans.length > 0 && (
          <motion.section variants={fadeUp} className="px-4 pt-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ChefHat className="h-4 w-4 text-emerald-500" />
              Riwayat Menu
            </h3>
            <div className="space-y-2">
              {mealPlans.slice(0, 5).map((plan, idx) => (
                <motion.button
                  key={plan.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleMealPlanTap(idx)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-card p-3.5 text-left shadow-sm transition-colors hover:bg-muted/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      Menu {plan.days.length} hari
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mulai{' '}
                      {new Date(plan.weekStart).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(plan.totalPrice)}
                    </p>
                    <ChevronRight className="ml-auto mt-0.5 h-3.5 w-3.5 text-muted-foreground/50" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Settings ───────────────────────────────── */}
        <motion.section variants={fadeUp} className="px-4 pt-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4 text-slate-500" />
            Pengaturan
          </h3>
          <div className="space-y-2">
            {/* Dark Mode */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  {isDark ? (
                    <Moon className="h-4.5 w-4.5 text-slate-600 dark:text-slate-300" />
                  ) : (
                    <Sun className="h-4.5 w-4.5 text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Mode Gelap</p>
                  <p className="text-xs text-muted-foreground">
                    {isDark ? 'Sedang aktif' : 'Sedang nonaktif'}
                  </p>
                </div>
              </div>
              <Switch checked={isDark} onCheckedChange={toggleTheme} />
            </div>

            {/* Language */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-500/10">
                  <Globe className="h-4.5 w-4.5 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Bahasa</p>
                  <p className="text-xs text-muted-foreground">Bahasa Indonesia</p>
                </div>
              </div>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                ID
              </Badge>
            </div>

            {/* About */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                  <Info className="h-4.5 w-4.5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tentang DapurMind AI</p>
                  <p className="text-xs text-muted-foreground">
                    Versi 1.0.0 · Dibuat dengan ❤️
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Danger Zone ────────────────────────────── */}
        <motion.section variants={fadeUp} className="px-4 pt-5 pb-4">
          <Button
            variant="outline"
            onClick={() => setShowResetDialog(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Reset Semua Data
          </Button>
          <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
            Semua data akan dihapus dan tidak dapat dikembalikan
          </p>
        </motion.section>
      </motion.div>

      {/* ── Allergy Dialog ──────────────────────────── */}
      <Dialog open={showAllergyDialog} onOpenChange={setShowAllergyDialog}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              Kelola Allergi
            </DialogTitle>
            <DialogDescription>
              Tambahkan atau hapus allergi makanan kamu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Current allergies */}
            {user?.allergies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {user.allergies.map((allergy) => (
                  <Badge
                    key={allergy}
                    variant="secondary"
                    className="gap-1 rounded-full px-3 py-1.5 text-xs"
                  >
                    {allergy}
                    <button
                      onClick={() => handleRemoveAllergy(allergy)}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add new */}
            <div className="flex gap-2">
              <Input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAllergy()}
                placeholder="Contoh: Kacang, Susu..."
                className="flex-1 rounded-xl border-border/50 bg-muted/30 text-sm"
                maxLength={30}
              />
              <Button
                onClick={handleAddAllergy}
                disabled={!newAllergy.trim()}
                size="sm"
                className="rounded-xl bg-emerald-500 px-4 hover:bg-emerald-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAllergyDialog(false)}
              className="flex-1 rounded-full"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset Dialog ────────────────────────────── */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Trash2 className="h-5 w-5" />
              Reset Semua Data?
            </DialogTitle>
            <DialogDescription>
              Semua data termasuk profil, rencana menu, daftar belanja, dan resep
              favorit akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-rose-50 p-4 text-center dark:bg-rose-500/10">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="text-4xl">⚠️</span>
            </motion.div>
            <p className="mt-2 text-sm font-medium text-rose-700 dark:text-rose-300">
              Apakah kamu benar-benar yakin?
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              className="flex-1 rounded-full"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetData}
              className="flex-1 rounded-full"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Ya, Hapus Semua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Preference Card ──────────────────────────────────────────── */

function PreferenceCard({
  label,
  value,
  icon,
  onEdit,
}: {
  label: string;
  value: string;
  icon: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card p-3.5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/60 text-lg">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium">{value}</p>
        </div>
      </div>
      {onEdit && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/60 transition-colors hover:bg-muted"
          aria-label={`Edit ${label}`}
        >
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </motion.button>
      )}
    </div>
  );
}

/* ── Achievement Card ─────────────────────────────────────────── */

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isUnlocked = !!achievement.unlockedAt;

  return (
    <div className="relative">
      {isUnlocked ? (
        <StarBorder color="amber" speed={8} starCount={6} className="rounded-xl">
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50 p-3 text-center dark:from-amber-500/10 dark:to-orange-500/5 dark:border-amber-500/20">
            <span className="text-2xl">{achievement.icon}</span>
            <p className="text-xs font-semibold leading-tight">{achievement.title}</p>
            <p className="text-[10px] leading-tight text-muted-foreground">
              {achievement.description}
            </p>
            <p className="mt-0.5 text-[9px] text-amber-600/70 dark:text-amber-400/60">
              {formatDateID(achievement.unlockedAt)}
            </p>
          </div>
        </StarBorder>
      ) : (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border/30 bg-muted/30 p-3 text-center opacity-50">
          <div className="relative">
            <span className="text-2xl grayscale">{achievement.icon}</span>
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-muted">
              <Lock className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          </div>
          <p className="text-xs font-medium leading-tight text-muted-foreground">
            {achievement.title}
          </p>
          <p className="text-[10px] text-muted-foreground/60">???</p>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
