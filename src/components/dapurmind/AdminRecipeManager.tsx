'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  PanInfo,
} from 'framer-motion';
import {
  ArrowLeft,
  ChefHat,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Heart,
  Eye,
  EyeOff,
  Clock,
  Flame,
  LogOut,
  Users,
  Link2,
  BarChart3,
  Megaphone,
  LayoutDashboard,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { adminFetch } from '@/lib/admin-fetch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bounce } from '@/components/dapurmind/ReactBits';

/* ── Animation variants ───────────────────────────────────────── */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: 'blur(3px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── Types ──────────────────────────────────────────────────── */

interface AdminRecipe {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  cookTime: number;
  prepTime: number;
  likes: number;
  isPublished: boolean;
  userId: string;
  user?: { id: string; name: string | null; email: string } | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ── Difficulty color helper ─────────────────────────────────── */

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'Mudah':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40';
    case 'Sedang':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40';
    case 'Susah':
      return 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40';
    default:
      return '';
  }
}

/* ── Swipe-to-delete Recipe Card ────────────────────────────── */

interface SwipeableRecipeCardProps {
  recipe: AdminRecipe;
  onEdit: (recipe: AdminRecipe) => void;
  onDelete: (recipe: AdminRecipe) => void;
}

function SwipeableRecipeCard({
  recipe,
  onEdit,
  onDelete,
}: SwipeableRecipeCardProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-80, -40], [1, 0]);
  const deleteScale = useTransform(x, [-80, -40], [1, 0.8]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x < -60) {
      onDelete(recipe);
    } else {
      x.set(0);
    }
  };

  const totalTime = recipe.cookTime + recipe.prepTime;

  return (
    <div className="relative overflow-hidden rounded-2xl mb-3">
      {/* Red delete background */}
      <motion.div
        className="absolute inset-0 z-0 flex items-center justify-end pr-5 bg-gradient-to-r from-transparent to-red-500 rounded-2xl"
        style={{ opacity: deleteOpacity }}
      >
        <motion.div
          style={{ scale: deleteScale }}
          className="flex items-center gap-2 text-white font-semibold text-sm"
        >
          <Trash2 className="h-5 w-5" />
          Hapus
        </motion.div>
      </motion.div>

      {/* Card content */}
      <motion.div
        className="relative z-10 cursor-grab active:cursor-grabbing"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={{ left: 0.1, right: 0 }}
        onDragEnd={handleDragEnd}
      >
        <Card className="border-border/50 bg-card/90 backdrop-blur-sm transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
                <ChefHat className="h-5 w-5 text-amber-600" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate">
                    {recipe.name}
                  </h3>
                  {recipe.isPublished ? (
                    <Eye className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  oleh {recipe.user?.name || recipe.user?.email || 'Anonim'}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 border ${getDifficultyColor(
                      recipe.difficulty
                    )}`}
                  >
                    <Flame className="h-3 w-3 mr-0.5" />
                    {recipe.difficulty}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Clock className="h-3 w-3" />
                    {totalTime} menit
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Heart className="h-3 w-3" />
                    {recipe.likes}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] px-1.5">
                    {recipe.category}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(recipe.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Edit button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(recipe);
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/50 transition-colors hover:bg-accent"
                aria-label="Edit resep"
              >
                <Edit3 className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */

export function AdminRecipeManager() {
  const setScreen = useAppStore((s) => s.setScreen);
  const goBack = useAppStore((s) => s.goBack);

  /* ── Local state ───────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<AdminRecipe | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('Mudah');
  const [editCookTime, setEditCookTime] = useState(30);
  const [editPrepTime, setEditPrepTime] = useState(15);
  const [editIsPublished, setEditIsPublished] = useState(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingRecipe, setDeletingRecipe] = useState<AdminRecipe | null>(null);

  /* ── Fetch recipes ──────────────────────────────────────────── */
  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch('/api/admin/recipes');
      if (!res.ok) throw new Error('Gagal memuat data resep');
      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes, refreshKey]);

  /* ── Stats ─────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const nonDeleted = recipes.filter((r) => !r.deletedAt);
    return {
      total: nonDeleted.length,
      published: nonDeleted.filter((r) => r.isPublished).length,
      draft: nonDeleted.filter((r) => !r.isPublished).length,
      deleted: recipes.filter((r) => r.deletedAt).length,
    };
  }, [recipes]);

  /* ── Categories ────────────────────────────────────────────── */
  const categories = useMemo(() => {
    const cats = new Set(recipes.map((r) => r.category));
    return ['all', ...Array.from(cats).sort()];
  }, [recipes]);

  /* ── Filtered recipes ─────────────────────────────────────── */
  const filteredRecipes = useMemo(() => {
    let result = recipes.filter((r) => !r.deletedAt);

    if (categoryFilter !== 'all') {
      result = result.filter((r) => r.category === categoryFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.user?.name || '').toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }

    return result;
  }, [recipes, categoryFilter, search]);

  /* ── Dialog handlers ───────────────────────────────────────── */

  const openEditDialog = useCallback((recipe: AdminRecipe) => {
    setEditingRecipe(recipe);
    setEditName(recipe.name);
    setEditDescription(recipe.description);
    setEditCategory(recipe.category);
    setEditDifficulty(recipe.difficulty);
    setEditCookTime(recipe.cookTime);
    setEditPrepTime(recipe.prepTime);
    setEditIsPublished(recipe.isPublished);
    setShowEditDialog(true);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!editingRecipe) return;
    try {
      setSaving(true);
      setError(null);
      const res = await adminFetch('/api/admin/recipes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingRecipe.id,
          name: editName.trim(),
          description: editDescription.trim(),
          category: editCategory,
          difficulty: editDifficulty,
          cookTime: editCookTime,
          prepTime: editPrepTime,
          isPublished: editIsPublished,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengupdate resep');
      }
      setShowEditDialog(false);
      setEditingRecipe(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengupdate resep');
    } finally {
      setSaving(false);
    }
  }, [
    editingRecipe,
    editName,
    editDescription,
    editCategory,
    editDifficulty,
    editCookTime,
    editPrepTime,
    editIsPublished,
  ]);

  const openDeleteDialog = useCallback((recipe: AdminRecipe) => {
    setDeletingRecipe(recipe);
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingRecipe) return;
    try {
      setDeleting(true);
      setError(null);
      const res = await adminFetch('/api/admin/recipes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deletingRecipe.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus resep');
      }
      setShowDeleteDialog(false);
      setDeletingRecipe(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus resep');
    } finally {
      setDeleting(false);
    }
  }, [deletingRecipe]);

  /* ── Header nav items ─────────────────────────────────────── */
  const headerNav = [
    { icon: LayoutDashboard, screen: 'admin-dashboard' as const, label: 'Dashboard' },
    { icon: Users, screen: 'admin-users' as const, label: 'User' },
    { icon: Trash2, screen: 'admin-trash' as const, label: 'Sampah' },
    { icon: Link2, screen: 'admin-affiliate' as const, label: 'Afiliasi' },
    { icon: Megaphone, screen: 'admin-ads' as const, label: 'Iklan' },
    { icon: BarChart3, screen: 'admin-analytics' as const, label: 'Analitik' },
  ];

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div className="relative min-h-screen pb-28 bg-gradient-to-br from-emerald-50/30 via-white to-amber-50/20 dark:from-emerald-950/20 dark:via-background dark:to-amber-950/10">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-lg px-4 pt-4"
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-5">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400 leading-tight">
                Manajemen Resep
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Kelola semua resep kreator
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {headerNav.map((item) => (
                <motion.button
                  key={item.screen}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setScreen(item.screen)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
                  aria-label={item.label}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              ))}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  useAppStore.getState().setAdminLoggedIn(false);
                  useAppStore.getState().setScreen('dashboard');
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 shadow-sm transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 text-red-500" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* ── Error Banner ────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800/40 dark:bg-red-500/10"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">
                    {error}
                  </p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="shrink-0 text-red-400 hover:text-red-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats Banner ───────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-5">
          <div className="rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm p-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.total}
                </span>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <span className="text-base font-bold">{stats.published}</span>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Terbit</p>
              </div>
              <div className="text-center">
                <span className="text-base font-bold text-amber-600">
                  {stats.draft}
                </span>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Draft</p>
              </div>
              <div className="text-center">
                <span className="text-base font-bold text-red-500">
                  {stats.deleted}
                </span>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Dihapus</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Search Bar ──────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Cari resep berdasarkan nama, penulis, kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-10"
            />
          </div>
        </motion.div>

        {/* ── Category Filter ──────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.96 }}
                onClick={() => setCategoryFilter(cat)}
                className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800/40'
                    : 'border-border/40 bg-card text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {cat === 'all' ? 'Semua' : cat}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Refresh Button ──────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Daftar Resep</h2>
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {filteredRecipes.length}
            </Badge>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Segarkan
          </button>
        </motion.div>

        {/* ── Loading State ──────────────────────────────────── */}
        {loading && (
          <motion.div variants={fadeUp} className="space-y-3 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl nm-raised p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-9 w-9 rounded-xl" />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Recipe List ───────────────────────────────────────── */}
        {!loading && filteredRecipes.length > 0 && (
          <motion.div variants={fadeUp} className="mb-6 space-y-0">
            {filteredRecipes.map((recipe) => (
              <SwipeableRecipeCard
                key={recipe.id}
                recipe={recipe}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
              />
            ))}
          </motion.div>
        )}

        {/* ── Empty State ─────────────────────────────────────── */}
        {!loading && filteredRecipes.length === 0 && (
          <motion.div variants={fadeUp} className="mb-6">
            <Bounce delay={0.2} intensity={2} hover>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 mb-4">
                  <span className="text-3xl">🍳</span>
                </div>
                <h3 className="text-base font-semibold">
                  {search.trim() || categoryFilter !== 'all'
                    ? 'Resep Tidak Ditemukan'
                    : 'Belum Ada Resep'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  {search.trim() || categoryFilter !== 'all'
                    ? 'Coba ubah filter atau kata kunci pencarian'
                    : 'Resep dari kreator akan muncul di sini'}
                </p>
              </div>
            </Bounce>
          </motion.div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── EDIT DIALOG ──────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[85vh] overflow-hidden rounded-2xl sm:max-w-md p-0 gap-0">
          <div className="border-b border-border/40 bg-card px-5 pt-5 pb-4">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-emerald-500 text-white">
                  <Edit3 className="h-4 w-4" />
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  Edit Resep
                </span>
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                {editingRecipe ? editingRecipe.name : ''}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto max-h-[55vh] px-5 py-4 space-y-5">
            {/* Published Status Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                {editIsPublished ? (
                  <Eye className="h-5 w-5 text-emerald-500" />
                ) : (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-semibold">Status Terbit</p>
                  <p className="text-[11px] text-muted-foreground">
                    {editIsPublished
                      ? 'Resep terlihat oleh semua pengguna'
                      : 'Resep hanya terlihat oleh penulis'}
                  </p>
                </div>
              </div>
              <Switch
                checked={editIsPublished}
                onCheckedChange={setEditIsPublished}
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-recipe-name" className="text-xs font-semibold">
                Nama Resep <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-recipe-name"
                placeholder="Nama resep"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-recipe-desc" className="text-xs font-semibold">
                Deskripsi
              </Label>
              <Input
                id="edit-recipe-desc"
                placeholder="Deskripsi singkat resep"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="edit-recipe-category" className="text-xs font-semibold">
                Kategori
              </Label>
              <Input
                id="edit-recipe-category"
                placeholder="Kategori resep"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Tingkat Kesulitan</Label>
              <div className="grid grid-cols-3 gap-2">
                {['Mudah', 'Sedang', 'Susah'].map((diff) => (
                  <motion.button
                    key={diff}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setEditDifficulty(diff)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                      editDifficulty === diff
                        ? diff === 'Mudah'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : diff === 'Sedang'
                            ? 'border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                            : 'border-red-500 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                        : 'border-border/40 bg-card text-muted-foreground hover:border-border'
                    }`}
                  >
                    {diff}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-prep-time" className="text-xs font-semibold">
                  Waktu Persiapan (menit)
                </Label>
                <Input
                  id="edit-prep-time"
                  type="number"
                  min={0}
                  value={editPrepTime}
                  onChange={(e) => setEditPrepTime(Number(e.target.value))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cook-time" className="text-xs font-semibold">
                  Waktu Masak (menit)
                </Label>
                <Input
                  id="edit-cook-time"
                  type="number"
                  min={0}
                  value={editCookTime}
                  onChange={(e) => setEditCookTime(Number(e.target.value))}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="bg-muted/30 px-5 py-4">
            <Button
              onClick={handleEditSubmit}
              disabled={!editName.trim() || saving}
              className="w-full gap-2 rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/25 hover:bg-amber-600 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── DELETE DIALOG ──────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl sm:max-w-sm p-0 gap-0">
          <div className="px-5 pt-5 pb-4">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </div>
                <span className="font-bold text-red-600 dark:text-red-400">
                  Pindahkan ke Tempat Sampah?
                </span>
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                Resep &quot;{deletingRecipe?.name}&quot; akan dipindahkan ke tempat sampah.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="bg-muted/30 px-5 py-4 gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 rounded-xl"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex-1 gap-2 rounded-xl"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminRecipeManager;
