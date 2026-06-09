'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Search,
  Star,
  Users,
  X,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/hooks/useAppState';
import { useTranslation } from '@/hooks/useTranslation';
import type { CreatorRecipeItem, CreatorProfileData } from '@/types';

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

  // Profile (1A)
  const [profile, setProfile] = useState<CreatorProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: '', bio: '', avatar: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  // Community filters (1B)
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [sortBy, setSortBy] = useState<'terbaru' | 'populer'>('terbaru');

  // Ratings (1C)
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});

  // Recipe detail dialog (1D)
  const [detailRecipe, setDetailRecipe] = useState<CreatorRecipeItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  // ── Fetch creator profile (1A) ──
  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/creator/profile?userId=${userId}`);
      const json = await res.json();
      if (json.data) {
        setProfile(json.data);
        setProfileForm({
          displayName: json.data.displayName || '',
          bio: json.data.bio || '',
          avatar: json.data.avatar || '',
        });
      }
    } catch {
      // Profile might not exist yet, which is fine
    } finally {
      setProfileLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchMyRecipes(); fetchCommunityRecipes(); fetchProfile(); }, [fetchMyRecipes, fetchCommunityRecipes, fetchProfile]);

  // ── Fetch ratings for community recipes (1C) ──
  useEffect(() => {
    if (communityRecipes.length === 0) return;
    const fetchRatings = async () => {
      const newRatings: Record<string, { avg: number; count: number }> = {};
      await Promise.all(
        communityRecipes.map(async (recipe) => {
          try {
            const res = await fetch(`/api/creator/ratings?recipeId=${recipe.id}`);
            const json = await res.json();
            if (json.success) {
              newRatings[recipe.id] = {
                avg: json.data?.avgRating ?? 0,
                count: json.data?.totalRatings ?? 0,
              };
            }
          } catch {
            // Rating endpoint may not exist yet
          }
        }),
      );
      setRatings(newRatings);
    };
    fetchRatings();
  }, [communityRecipes]);

  // ── Filter community recipes client-side (1B) ──
  const filteredCommunity = useMemo(() => {
    let result = [...communityRecipes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(q));
    }

    if (categoryFilter) {
      result = result.filter(r => r.category === categoryFilter);
    }

    if (difficultyFilter) {
      result = result.filter(r => r.difficulty === difficultyFilter);
    }

    if (sortBy === 'populer') {
      result.sort((a, b) => b.likes - a.likes);
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [communityRecipes, searchQuery, categoryFilter, difficultyFilter, sortBy]);

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

  // ── Open recipe detail (1D) ──
  const openDetail = (recipe: CreatorRecipeItem) => {
    setDetailRecipe(recipe);
    setDetailOpen(true);
  };

  // ── Save profile (1A) ──
  const handleSaveProfile = async () => {
    if (!userId) return;
    setProfileSaving(true);
    try {
      const res = await fetch('/api/creator/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...profileForm }),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Profil berhasil disimpan!');
      setProfileDialogOpen(false);
      fetchProfile();
    } catch {
      toast.error('Gagal menyimpan profil');
    } finally {
      setProfileSaving(false);
    }
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

  // ── Star rating display (1C) ──
  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const stars: React.ReactNode[] = [];
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(<Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />);
      } else if (i === full && half) {
        stars.push(<Star key={i} className="h-2.5 w-2.5 fill-amber-400/50 text-amber-400" />);
      } else {
        stars.push(<Star key={i} className="h-2.5 w-2.5 text-gray-300 dark:text-gray-600" />);
      }
    }
    return stars;
  };

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
            {/* ── 1A: Creator Profile Section ──────────────── */}
            {!profileLoading && (
              <motion.div variants={fadeUp} className="mb-4">
                <div className="rounded-xl border border-emerald-200/50 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/30">
                      <span className="text-3xl">{profile?.avatar || authUser?.avatar || '👨‍🍳'}</span>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">
                        {profile?.displayName || authUser?.name || 'Creator'}
                      </h3>
                      <p className="line-clamp-2 text-[11px] text-muted-foreground">
                        {profile?.bio || 'Belum ada bio. Tap edit untuk mengisi.'}
                      </p>
                      {/* Stats */}
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <UtensilsCrossed className="h-2.5 w-2.5" />
                          {myRecipes.length} resep
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Heart className="h-2.5 w-2.5 text-rose-400" />
                          {totalLikes} suka
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Users className="h-2.5 w-2.5" />
                          {profile?.followers ?? 0} pengikut
                        </span>
                      </div>
                    </div>
                    {/* Edit Profile Button */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setProfileDialogOpen(true)}
                      className="flex h-8 items-center gap-1 rounded-lg border border-emerald-200/50 bg-emerald-50/50 px-2.5 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {profileLoading && (
              <div className="mb-4">
                <div className="rounded-xl border border-emerald-200/50 bg-white/80 p-4 dark:border-emerald-800/50 dark:bg-card/80">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                    <div className="flex gap-3 p-2.5">
                      {/* Emoji thumbnail */}
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20">
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
            {/* ── 1B: Search & Filters ────────────────────── */}
            <motion.div variants={fadeUp} className="mb-4 space-y-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari resep komunitas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border-emerald-200/50 bg-white/60 pl-9 pr-4 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
                />
              </div>

              {/* Category pills */}
              <div className="scroll-h-wrap -mx-4 px-4">
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  <button
                    onClick={() => setCategoryFilter('')}
                    className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-medium transition-colors ${
                      !categoryFilter
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }`}
                  >
                    Semua
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
                      className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-medium transition-colors ${
                        categoryFilter === cat
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty + Sort row */}
              <div className="flex items-center gap-2">
                <Select value={difficultyFilter} onValueChange={(v) => setDifficultyFilter(v === '_all' ? '' : v)}>
                  <SelectTrigger className="h-8 rounded-lg border-emerald-200/50 bg-white/60 text-[10px] dark:border-emerald-800/50 dark:bg-card/60">
                    <Flame className="mr-1 h-3 w-3" />
                    <SelectValue placeholder="Kesulitan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Semua Level</SelectItem>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'terbaru' | 'populer')}>
                  <SelectTrigger className="h-8 rounded-lg border-emerald-200/50 bg-white/60 text-[10px] dark:border-emerald-800/50 dark:bg-card/60">
                    <Star className="mr-1 h-3 w-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terbaru" className="text-xs">Terbaru</SelectItem>
                    <SelectItem value="populer" className="text-xs">Populer</SelectItem>
                  </SelectContent>
                </Select>
                {(searchQuery || categoryFilter || difficultyFilter) && (
                  <button
                    onClick={() => { setSearchQuery(''); setCategoryFilter(''); setDifficultyFilter(''); }}
                    className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                    Reset
                  </button>
                )}
              </div>
            </motion.div>

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
            {!loadingCommunity && filteredCommunity.length > 0 && (
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 gap-2.5"
              >
                {filteredCommunity.map((recipe) => {
                  const rating = ratings[recipe.id];
                  return (
                    <motion.div
                      key={recipe.id}
                      variants={fadeUp}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => openDetail(recipe)}
                      className="group cursor-pointer overflow-hidden rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-800/50 dark:bg-card/80"
                    >
                      {/* Image */}
                      <div className="relative flex h-24 items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20">
                        <span className="text-5xl">{recipe.image || '🍛'}</span>
                        <span className={`absolute bottom-2 left-2 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${DIFFICULTY_COLORS[recipe.difficulty] || ''}`}>
                          {recipe.difficulty}
                        </span>
                        {/* Like button */}
                        <motion.button
                          whileTap={{ scale: 0.7 }}
                          onClick={(e) => { e.stopPropagation(); handleLike(recipe); }}
                          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-colors hover:bg-white dark:bg-black/40 dark:hover:bg-black/60"
                        >
                          <Heart className="h-3.5 w-3.5 text-rose-400" />
                        </motion.button>
                      </div>
                      {/* Info */}
                      <div className="space-y-1 p-2">
                        <h3 className="line-clamp-2 text-[12px] font-semibold leading-snug text-foreground">
                          {recipe.name}
                        </h3>
                        <p className="line-clamp-1 text-[10px] text-muted-foreground">
                          {recipe.description}
                        </p>
                        {/* 1C: Rating display */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{recipe.cookTime} mnt</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Heart className="h-2.5 w-2.5 fill-rose-400 text-rose-400" />
                            <span className="text-[10px] font-medium text-rose-500">{recipe.likes}</span>
                          </div>
                        </div>
                        {/* 1C: Star rating */}
                        {rating && rating.count > 0 && (
                          <div className="flex items-center gap-1">
                            <div className="flex items-center gap-px">
                              {renderStars(rating.avg)}
                            </div>
                            <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">
                              {rating.avg.toFixed(1)}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              ({rating.count})
                            </span>
                          </div>
                        )}
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {recipe.category}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Empty */}
            {!loadingCommunity && filteredCommunity.length === 0 && communityRecipes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 py-12 text-center"
              >
                <div className="text-5xl">🔍</div>
                <div>
                  <h3 className="text-sm font-semibold">Tidak ada hasil</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Coba ubah filter pencarian
                  </p>
                </div>
              </motion.div>
            )}

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
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('creator.recipeName')} *</label>
              <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Nasi Goreng Spesial" className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('creator.description')}</label>
              <Textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Deskripsi singkat resep..." rows={2} className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('creator.category')}</label>
                <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
                  <SelectTrigger className="w-full rounded-xl border-emerald-200/50 bg-white/60 text-sm dark:border-emerald-800/50 dark:bg-card/60"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('creator.difficulty')}</label>
                <Select value={form.difficulty} onValueChange={(v) => updateForm('difficulty', v)}>
                  <SelectTrigger className="w-full rounded-xl border-emerald-200/50 bg-white/60 text-sm dark:border-emerald-800/50 dark:bg-card/60"><SelectValue /></SelectTrigger>
                  <SelectContent>{DIFFICULTIES.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('creator.prepTime')} (mnt)</label>
                <Input type="number" value={form.prepTime} onChange={(e) => updateForm('prepTime', e.target.value)} className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('creator.cookTime')} (mnt)</label>
                <Input type="number" value={form.cookTime} onChange={(e) => updateForm('cookTime', e.target.value)} className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('creator.servings')}</label>
                <Input type="number" value={form.servings} onChange={(e) => updateForm('servings', e.target.value)} className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('creator.ingredients')} *</label>
              <Textarea value={form.ingredients} onChange={(e) => updateForm('ingredients', e.target.value)} placeholder={"Bawang merah 3 butir\nBawang putih 4 siung\nCabai merah 5 buah"} rows={4} className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('creator.steps')} *</label>
              <Textarea value={form.steps} onChange={(e) => updateForm('steps', e.target.value)} placeholder={"Potong semua bahan\nTumis bumbu halus\nMasukkan nasi dan aduk rata"} rows={4} className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t('creator.tags')}</label>
                <Input value={form.tags} onChange={(e) => updateForm('tags', e.target.value)} placeholder="nasi, goreng, cepat" className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Image (emoji / URL)</label>
                <Input value={form.image} onChange={(e) => updateForm('image', e.target.value)} placeholder="🍛" className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t('creator.youtubeUrl')}</label>
              <Input value={form.youtubeUrl} onChange={(e) => updateForm('youtubeUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60" />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-emerald-200/50 bg-emerald-50/50 p-3 dark:border-emerald-800/50 dark:bg-emerald-900/10">
              <div>
                <p className="text-sm font-medium">{t('creator.publish')}</p>
                <p className="text-[11px] text-muted-foreground">{t('creator.communityDesc')}</p>
              </div>
              <Switch checked={form.isPublished} onCheckedChange={(v) => updateForm('isPublished', v)} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl nm-btn-primary">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
            <p className="text-sm text-muted-foreground">{t('creator.deleteConfirm', 'Apakah Anda yakin ingin menghapus resep ini?')}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl border-emerald-200/50 text-sm hover:bg-emerald-50 dark:border-emerald-800/50 dark:hover:bg-emerald-900/20" onClick={() => setDeleteOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="destructive" className="flex-1 rounded-xl nm-raised-sm bg-rose-600 text-sm text-white hover:bg-rose-700" onClick={handleDelete}>
                {t('creator.delete')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 1A: Edit Profile Dialog ─────────────────────── */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-md border-emerald-200/50 bg-white dark:bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <Pencil className="h-5 w-5" />
              Edit Profil Creator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Avatar preview */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/30">
                <span className="text-4xl">{profileForm.avatar || '👨‍🍳'}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Avatar (emoji / URL)</label>
              <Input
                value={profileForm.avatar}
                onChange={(e) => setProfileForm(prev => ({ ...prev, avatar: e.target.value }))}
                placeholder="👨‍🍳"
                className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nama Tampilan</label>
              <Input
                value={profileForm.displayName}
                onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Chef DapurMind"
                className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Bio</label>
              <Textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Ceritakan tentang diri Anda dan passion memasak Anda..."
                rows={3}
                className="rounded-xl border-emerald-200/50 bg-white/60 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={profileSaving} className="w-full rounded-xl nm-btn-primary">
              {profileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Profil
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── 1D: Recipe Detail Dialog ────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-lg border-emerald-200/50 bg-white dark:bg-card">
          <DialogHeader>
            <DialogTitle className="sr-only">Detail Resep</DialogTitle>
          </DialogHeader>
          {detailRecipe && (
            <div>
              {/* Hero */}
              <div className="relative -mx-6 -mt-6 mb-4 flex h-44 items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20">
                <span className="text-7xl">{detailRecipe.image || '🍛'}</span>
                <span className={`absolute bottom-3 left-3 rounded-lg px-2 py-1 text-[10px] font-semibold ${DIFFICULTY_COLORS[detailRecipe.difficulty] || ''}`}>
                  {detailRecipe.difficulty}
                </span>
              </div>

              {/* Info */}
              <h2 className="text-lg font-bold">{detailRecipe.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{detailRecipe.description}</p>

              {/* Stats */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {detailRecipe.cookTime} mnt
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-base">🍽️</span>
                  {detailRecipe.servings} porsi
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {detailRecipe.category}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleLike(detailRecipe)}
                  className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-medium text-rose-600 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-400"
                >
                  <Heart className="h-3 w-3" />
                  {detailRecipe.likes}
                </motion.button>
              </div>

              {/* Rating (1D) */}
              {ratings[detailRecipe.id] && ratings[detailRecipe.id].count > 0 && (
                <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
                  <div className="flex items-center gap-0.5">
                    {renderStars(ratings[detailRecipe.id].avg)}
                  </div>
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {ratings[detailRecipe.id].avg.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({ratings[detailRecipe.id].count} rating)
                  </span>
                </div>
              )}

              {/* Ingredients */}
              <div className="mt-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold mb-2">
                  🥕 Bahan-bahan
                </h3>
                <ul className="space-y-1">
                  {detailRecipe.ingredients.split('\n').filter(Boolean).map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      {ing.trim()}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps */}
              <div className="mt-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold mb-2">
                  👨‍🍳 Langkah-langkah
                </h3>
                <ol className="space-y-2">
                  {detailRecipe.steps.split('\n').filter(Boolean).map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step.trim()}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tags */}
              {detailRecipe.tags && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {detailRecipe.tags.split(',').filter(Boolean).map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default CreatorPage;
