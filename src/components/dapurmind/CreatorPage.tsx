'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Heart,
  Clock,
  ChefHat,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Globe2,
  RefreshCw,
  Loader2,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/hooks/useAppState';
import { useTranslation } from '@/hooks/useTranslation';
import type { CreatorRecipeItem } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ── Constants ──────────────────────────────────────────────── */

const CATEGORIES = [
  'Sarapan', 'Makan Siang', 'Makan Malam', 'Snack',
  'Minuman', 'Dessert', 'Western', 'Lainnya',
];

const DIFFICULTIES = ['Mudah', 'Sedang', 'Susah'];

const DIFFICULTY_COLORS: Record<string, string> = {
  Mudah: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Sedang: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Susah: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

/* ── Animation variants ───────────────────────────────────────── */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: 'blur(3px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── Form defaults ───────────────────────────────────────────── */

interface RecipeFormData {
  name: string;
  description: string;
  category: string;
  difficulty: string;
  cookTime: string;
  prepTime: string;
  servings: string;
  ingredients: string;
  steps: string;
  tags: string;
  youtubeUrl: string;
  image: string;
  isPublished: boolean;
}

const EMPTY_FORM: RecipeFormData = {
  name: '',
  description: '',
  category: 'Sarapan',
  difficulty: 'Mudah',
  cookTime: '30',
  prepTime: '15',
  servings: '4',
  ingredients: '',
  steps: '',
  tags: '',
  youtubeUrl: '',
  image: '🍛',
  isPublished: false,
};

/* ── Main Component ──────────────────────────────────────────── */

export function CreatorPage() {
  const authUser = useAppStore((s) => s.authUser);
  const setScreen = useAppStore((s) => s.setScreen);
  const goBack = useAppStore((s) => s.goBack);
  const { t } = useTranslation();

  const userId = authUser?.id;
  const [activeTab, setActiveTab] = useState<'my' | 'community'>('my');

  // Data
  const [myRecipes, setMyRecipes] = useState<CreatorRecipeItem[]>([]);
  const [communityRecipes, setCommunityRecipes] = useState<CreatorRecipeItem[]>([]);
  const [loadingMy, setLoadingMy] = useState(false);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<CreatorRecipeItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CreatorRecipeItem | null>(null);

  // Form
  const [form, setForm] = useState<RecipeFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ── Fetch my recipes ──
  const fetchMyRecipes = useCallback(async () => {
    if (!userId) return;
    setLoadingMy(true);
    try {
      const res = await fetch(`/api/creator/recipes?userId=${userId}&includeUnpublished=true`);
      const json = await res.json();
      setMyRecipes(json.data ?? []);
    } catch {
      toast.error('Gagal memuat resep');
    } finally {
      setLoadingMy(false);
    }
  }, [userId]);

  // ── Fetch community recipes ──
  const fetchCommunityRecipes = useCallback(async () => {
    setLoadingCommunity(true);
    try {
      const res = await fetch('/api/creator/recipes?userId=all');
      const json = await res.json();
      setCommunityRecipes(json.data ?? []);
    } catch {
      toast.error('Gagal memuat resep komunitas');
    } finally {
      setLoadingCommunity(false);
    }
  }, []);

  useEffect(() => { fetchMyRecipes(); }, [fetchMyRecipes]);
  useEffect(() => { fetchCommunityRecipes(); }, [fetchCommunityRecipes]);

  // ── Open create form ──
  const openCreate = () => {
    setEditingRecipe(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  // ── Open edit form ──
  const openEdit = (recipe: CreatorRecipeItem) => {
    setEditingRecipe(recipe);
    setForm({
      name: recipe.name,
      description: recipe.description,
      category: recipe.category,
      difficulty: recipe.difficulty,
      cookTime: String(recipe.cookTime),
      prepTime: String(recipe.prepTime),
      servings: String(recipe.servings),
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tags: recipe.tags,
      youtubeUrl: recipe.youtubeUrl ?? '',
      image: recipe.image,
      isPublished: recipe.isPublished,
    });
    setFormOpen(true);
  };

  // ── Save (create or update) ──
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nama resep wajib diisi'); return; }
    const ingredientLines = form.ingredients.split('\n').filter(l => l.trim());
    if (ingredientLines.length === 0) { toast.error('Minimal 1 bahan diperlukan'); return; }
    const stepLines = form.steps.split('\n').filter(l => l.trim());
    if (stepLines.length === 0) { toast.error('Minimal 1 langkah diperlukan'); return; }

    setSaving(true);
    try {
      const body = {
        userId,
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        difficulty: form.difficulty,
        cookTime: Number(form.cookTime) || 0,
        prepTime: Number(form.prepTime) || 0,
        servings: Number(form.servings) || 1,
        ingredients: ingredientLines.join('\n'),
        steps: stepLines.join('\n'),
        tags: form.tags,
        youtubeUrl: form.youtubeUrl.trim(),
        image: form.image.trim() || '🍛',
        isPublished: form.isPublished,
        ...(editingRecipe ? { id: editingRecipe.id } : {}),
      };

      const res = await fetch('/api/creator/recipes', {
        method: editingRecipe ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Save failed');

      toast.success(editingRecipe ? 'Resep diperbarui!' : 'Resep berhasil dibuat!');
      setFormOpen(false);
      fetchMyRecipes();
      fetchCommunityRecipes();
    } catch {
      toast.error('Gagal menyimpan resep');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch('/api/creator/recipes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id, userId }),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Resep dihapus');
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchMyRecipes();
      fetchCommunityRecipes();
    } catch {
      toast.error('Gagal menghapus resep');
    }
  };

  // ── Toggle publish ──
  const togglePublish = async (recipe: CreatorRecipeItem) => {
    try {
      const res = await fetch('/api/creator/recipes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recipe.id, userId, isPublished: !recipe.isPublished }),
      });
      if (!res.ok) throw new Error('Toggle failed');
      toast.success(recipe.isPublished ? 'Resep disimpan sebagai draf' : 'Resep dipublikasikan!');
      fetchMyRecipes();
      fetchCommunityRecipes();
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  // ── Like community recipe ──
  const handleLike = async (recipe: CreatorRecipeItem) => {
    try {
      const res = await fetch('/api/creator/recipes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recipe.id, action: 'like' }),
      });
      if (!res.ok) throw new Error('Like failed');
      setCommunityRecipes(prev =>
        prev.map(r => r.id === recipe.id ? { ...r, likes: r.likes + 1 } : r),
      );
    } catch {
      toast.error('Gagal menyukai resep');
    }
  };

  // ── Stats ──
  const totalLikes = myRecipes.reduce((sum, r) => sum + r.likes, 0);
  const publishedCount = myRecipes.filter(r => r.isPublished).length;

  // ── Form field updater ──
  const updateForm = (key: keyof RecipeFormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="min-h-screen pb-24"
    >
      {/* ── Header ─────────────────────────────────────── */}
      <header className="glass sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => goBack()}
              className="flex h-9 w-9 items-center justify-center rounded-full nm-raised-sm"
            >
              <ArrowLeft className="h-4.5 w-4.5 text-foreground" />
            </motion.button>
            <h1 className="text-lg font-bold tracking-tight">
              {t('creator.title')}
            </h1>
          </div>
          {activeTab === 'my' && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={openCreate}
              className="flex h-9 items-center gap-1.5 rounded-xl nm-raised bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              <span className="text-xs">{t('creator.addRecipe')}</span>
            </motion.button>
          )}
        </div>

        {/* ── Tab Switcher ─────────────────────────────── */}
        <div className="px-4 pb-3">
          <div className="flex rounded-xl border border-emerald-200/50 bg-emerald-50/50 p-1 dark:border-emerald-800/50 dark:bg-emerald-950/20">
            {(['my', 'community'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 rounded-lg py-2 text-xs font-medium transition-all"
              >
                <AnimatePresence mode="wait">
                  {activeTab === tab && (
                    <motion.div
                      layoutId="creator-tab-indicator"
                      className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-card/80"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </AnimatePresence>
                <span className={`relative z-10 flex items-center justify-center gap-1.5 ${activeTab === tab ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>
                  {tab === 'my' ? (
                    <>
                      <UtensilsCrossed className="h-3.5 w-3.5" />
                      {t('creator.myRecipes')}
                    </>
                  ) : (
                    <>
                      <Globe2 className="h-3.5 w-3.5" />
                      {t('creator.communityRecipes')}
                    </>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Tab Content ───────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'my' ? (
          <motion.div
            key="my-recipes"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="px-4 pt-4"
          >
            {/* ── Stats Row ─────────────────────────────── */}
            {!loadingMy && myRecipes.length > 0 && (
              <motion.div variants={fadeUp} className="mb-4 grid grid-cols-3 gap-2">
                {[
                  { emoji: '📋', value: myRecipes.length, label: t('creator.totalRecipes') },
                  { emoji: '❤️', value: totalLikes, label: t('creator.likes') },
                  { emoji: '🌐', value: publishedCount, label: t('creator.published') },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center gap-1 rounded-xl border border-emerald-200/50 bg-white/80 p-3 text-center shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80"
                  >
                    <span className="text-lg">{stat.emoji}</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {stat.value}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ── Loading ──────────────────────────────── */}
            {loadingMy && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2 rounded-xl border border-emerald-200/50 bg-white/80 p-4 dark:border-emerald-800/50 dark:bg-card/80">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-14" />
                      <Skeleton className="h-5 w-14" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Recipe List ───────────────────────────── */}
            {!loadingMy && myRecipes.length > 0 && (
              <motion.div variants={stagger} className="space-y-3">
                {myRecipes.map((recipe) => (
                  <motion.div
                    key={recipe.id}
                    variants={fadeUp}
                    className="overflow-hidden rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80"
                  >
                    <div className="flex gap-3 p-3">
                      {/* Emoji thumbnail */}
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20">
                        <span className="text-3xl">{recipe.image || '🍛'}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold leading-snug truncate">
                            {recipe.name}
                          </h3>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              recipe.isPublished
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400'
                            }`}
                          >
                            {recipe.isPublished ? t('creator.published') : t('creator.draft')}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {recipe.category}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${DIFFICULTY_COLORS[recipe.difficulty] || ''}`}>
                            {recipe.difficulty}
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {recipe.cookTime} mnt
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Heart className="h-2.5 w-2.5 text-rose-400" />
                            {recipe.likes}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-2 flex items-center gap-1.5">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEdit(recipe)}
                            className="flex items-center gap-1 rounded-lg border border-emerald-200/50 bg-emerald-50/50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                          >
                            <Pencil className="h-3 w-3" />
                            {t('creator.editRecipe')}
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => togglePublish(recipe)}
                            className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/40 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted dark:hover:bg-muted/60"
                          >
                            {recipe.isPublished ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                            {recipe.isPublished ? t('creator.unpublish') : t('creator.publish')}
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { setDeleteTarget(recipe); setDeleteOpen(true); }}
                            className="flex items-center gap-1 rounded-lg border border-rose-200/50 bg-rose-50/50 px-2.5 py-1.5 text-[11px] font-medium text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40"
                          >
                            <Trash2 className="h-3 w-3" />
                            {t('creator.delete')}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Refresh */}
                <div className="flex justify-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchMyRecipes}
                    className="gap-1.5 rounded-full text-xs text-muted-foreground"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t('common.refresh', 'Refresh')}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Empty State ──────────────────────────── */}
            {!loadingMy && myRecipes.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 py-16 text-center"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-6xl"
                >
                  📝
                </motion.div>
                <div>
                  <h3 className="text-base font-semibold">
                    {t('creator.empty', 'Belum ada resep')}
                  </h3>
                  <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">
                    {t('creator.communityDesc', 'Mulai buat resep pertamamu dan bagikan ke komunitas!')}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={openCreate}
                  className="mt-2 flex items-center gap-2 rounded-xl nm-raised bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  {t('creator.createRecipe')}
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* ── Community Tab ─────────────────────────── */
          <motion.div
            key="community-recipes"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="px-4 pt-4"
          >
            {/* Loading */}
            {loadingCommunity && (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2 rounded-xl border border-emerald-200/50 bg-white/80 p-3 dark:border-emerald-800/50 dark:bg-card/80">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Grid */}
            {!loadingCommunity && communityRecipes.length > 0 && (
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 gap-3"
              >
                {communityRecipes.map((recipe) => (
                  <motion.div
                    key={recipe.id}
                    variants={fadeUp}
                    className="group overflow-hidden rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 dark:border-emerald-800/50 dark:bg-card/80"
                  >
                    {/* Image */}
                    <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20">
                      <span className="text-5xl">{recipe.image || '🍛'}</span>
                      <span className={`absolute bottom-2 left-2 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${DIFFICULTY_COLORS[recipe.difficulty] || ''}`}>
                        {recipe.difficulty}
                      </span>
                      {/* Like button */}
                      <motion.button
                        whileTap={{ scale: 0.7 }}
                        onClick={() => handleLike(recipe)}
                        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-colors hover:bg-white dark:bg-black/40 dark:hover:bg-black/60"
                      >
                        <Heart className="h-3.5 w-3.5 text-rose-400" />
                      </motion.button>
                    </div>
                    {/* Info */}
                    <div className="space-y-1.5 p-2.5">
                      <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
                        {recipe.name}
                      </h3>
                      <p className="line-clamp-1 text-[10px] text-muted-foreground">
                        {recipe.description}
                      </p>
                      <div className="flex items-center justify-between gap-1">
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          {recipe.cookTime} mnt
                        </span>
                        <span className="flex items-center gap-0.5 text-[10px]">
                          <Heart className="h-2.5 w-2.5 fill-rose-400 text-rose-400" />
                          <span className="font-medium text-rose-500">{recipe.likes}</span>
                        </span>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {recipe.category}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Empty */}
            {!loadingCommunity && communityRecipes.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 py-16 text-center"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-6xl"
                >
                  🌍
                </motion.div>
                <div>
                  <h3 className="text-base font-semibold">
                    {t('creator.empty', 'Belum ada resep komunitas')}
                  </h3>
                  <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">
                    {t('creator.communityDesc', 'Jadilah yang pertama mempublikasikan resep!')}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create/Edit Dialog ─────────────────────────── */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-lg border-emerald-200/50 bg-white dark:bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <ChefHat className="h-5 w-5" />
              {editingRecipe ? t('creator.editRecipe') : t('creator.createRecipe')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t('creator.recipeName')} *
              </label>
              <Input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="Nasi Goreng Spesial"
                className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t('creator.description')}
              </label>
              <Textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Deskripsi singkat resep..."
                rows={2}
                className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
              />
            </div>

            {/* Category & Difficulty */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('creator.category')}
                </label>
                <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
                  <SelectTrigger className="w-full rounded-xl border-emerald-200/50 bg-white/60 text-sm dark:border-emerald-800/50 dark:bg-card/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('creator.difficulty')}
                </label>
                <Select value={form.difficulty} onValueChange={(v) => updateForm('difficulty', v)}>
                  <SelectTrigger className="w-full rounded-xl border-emerald-200/50 bg-white/60 text-sm dark:border-emerald-800/50 dark:bg-card/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Times & Servings */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('creator.prepTime')} (mnt)
                </label>
                <Input
                  type="number"
                  value={form.prepTime}
                  onChange={(e) => updateForm('prepTime', e.target.value)}
                  className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('creator.cookTime')} (mnt)
                </label>
                <Input
                  type="number"
                  value={form.cookTime}
                  onChange={(e) => updateForm('cookTime', e.target.value)}
                  className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('creator.servings')}
                </label>
                <Input
                  type="number"
                  value={form.servings}
                  onChange={(e) => updateForm('servings', e.target.value)}
                  className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
                />
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t('creator.ingredients')} *
              </label>
              <Textarea
                value={form.ingredients}
                onChange={(e) => updateForm('ingredients', e.target.value)}
                placeholder={"Bawang merah 3 butir\nBawang putih 4 siung\nCabai merah 5 buah"}
                rows={4}
                className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
              />
            </div>

            {/* Steps */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t('creator.steps')} *
              </label>
              <Textarea
                value={form.steps}
                onChange={(e) => updateForm('steps', e.target.value)}
                placeholder={"Potong semua bahan\nTumis bumbu halus\nMasukkan nasi dan aduk rata"}
                rows={4}
                className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
              />
            </div>

            {/* Tags & Image */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  {t('creator.tags')}
                </label>
                <Input
                  value={form.tags}
                  onChange={(e) => updateForm('tags', e.target.value)}
                  placeholder="nasi, goreng, cepat"
                  className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Image (emoji / URL)
                </label>
                <Input
                  value={form.image}
                  onChange={(e) => updateForm('image', e.target.value)}
                  placeholder="🍛"
                  className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
                />
              </div>
            </div>

            {/* YouTube URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t('creator.youtubeUrl')}
              </label>
              <Input
                value={form.youtubeUrl}
                onChange={(e) => updateForm('youtubeUrl', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
              />
            </div>

            {/* Publish toggle */}
            <div className="flex items-center justify-between rounded-xl border border-emerald-200/50 bg-emerald-50/50 p-3 dark:border-emerald-800/50 dark:bg-emerald-900/10">
              <div>
                <p className="text-sm font-medium">{t('creator.publish')}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t('creator.communityDesc')}
                </p>
              </div>
              <Switch
                checked={form.isPublished}
                onCheckedChange={(v) => updateForm('isPublished', v)}
              />
            </div>

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t('creator.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ──────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm rounded-2xl border-emerald-200/50 bg-white dark:bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Trash2 className="h-5 w-5" />
              {t('creator.delete')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {t('creator.deleteConfirm', 'Apakah Anda yakin ingin menghapus resep ini?')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-emerald-200/50 text-sm hover:bg-emerald-50 dark:border-emerald-800/50 dark:hover:bg-emerald-900/20"
                onClick={() => setDeleteOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl bg-rose-600 text-sm text-white hover:bg-rose-700"
                onClick={handleDelete}
              >
                {t('creator.delete')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default CreatorPage;
