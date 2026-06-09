'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Trash2,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Loader2,
  LogOut,
  Users,
  ChefHat,
  Link2,
  BarChart3,
  Megaphone,
  LayoutDashboard,
  ShoppingBag,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
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

type TrashItemType = 'users' | 'recipes' | 'affiliate_accounts' | 'product_links';

interface TrashItem {
  id: string;
  label: string;
  type: TrashItemType;
  deletedAt: string;
  [key: string]: unknown;
}

/* ── Type badge helper ───────────────────────────────────────── */

function getTypeBadge(type: TrashItemType) {
  switch (type) {
    case 'users':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', icon: Users, label: 'User' };
    case 'recipes':
      return { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', icon: ChefHat, label: 'Resep' };
    case 'affiliate_accounts':
      return { bg: 'bg-blue-500/15', text: 'text-blue-500 dark:text-blue-400', icon: Link2, label: 'Afiliasi' };
    case 'product_links':
      return { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', icon: Package, label: 'Produk' };
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground', icon: Package, label: type };
  }
}

/* ── Main Component ──────────────────────────────────────────── */

export function AdminTrash() {
  const setScreen = useAppStore((s) => s.setScreen);
  const goBack = useAppStore((s) => s.goBack);

  /* ── Local state ───────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<TrashItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | TrashItemType>('all');
  const [restoring, setRestoring] = useState<string | null>(null);
  const [permaDeleting, setPermaDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Permanent delete dialog
  const [showPermaDeleteDialog, setShowPermaDeleteDialog] = useState(false);
  const [permaDeleteItem, setPermaDeleteItem] = useState<TrashItem | null>(null);

  /* ── Fetch trash items ──────────────────────────────────────── */
  const fetchTrash = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/trash', {
        headers: { 'X-Admin-Key': 'dapurmind2025' },
      });
      if (!res.ok) throw new Error('Gagal memuat tempat sampah');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash, refreshKey]);

  /* ── Stats by type ─────────────────────────────────────────── */
  const typeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return counts;
  }, [items]);

  /* ── Filtered items ───────────────────────────────────────── */
  const filteredItems = useMemo(() => {
    if (typeFilter === 'all') return items;
    return items.filter((item) => item.type === typeFilter);
  }, [items, typeFilter]);

  /* ── Restore handler ───────────────────────────────────────── */
  const handleRestore = useCallback(
    async (item: TrashItem) => {
      try {
        setRestoring(item.id);
        setError(null);

        let endpoint = '';
        switch (item.type) {
          case 'users':
            endpoint = '/api/admin/users';
            break;
          case 'recipes':
            endpoint = '/api/admin/recipes';
            break;
          case 'affiliate_accounts':
            endpoint = '/api/admin/affiliates';
            break;
          case 'product_links':
            endpoint = '/api/admin/products';
            break;
        }

        const res = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': 'dapurmind2025',
          },
          body: JSON.stringify({ id: item.id }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Gagal memulihkan item');
        }
        setRefreshKey((k) => k + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memulihkan item');
      } finally {
        setRestoring(null);
      }
    },
    []
  );

  /* ── Permanent delete handlers ──────────────────────────────── */
  const openPermaDeleteDialog = useCallback((item: TrashItem) => {
    setPermaDeleteItem(item);
    setShowPermaDeleteDialog(true);
  }, []);

  const handlePermaDeleteConfirm = useCallback(async () => {
    if (!permaDeleteItem) return;
    try {
      setPermaDeleting(true);
      setError(null);
      const res = await fetch(
        `/api/admin/trash?type=${permaDeleteItem.type}&id=${encodeURIComponent(permaDeleteItem.id)}`,
        {
          method: 'DELETE',
          headers: { 'X-Admin-Key': 'dapurmind2025' },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus permanen');
      }
      setShowPermaDeleteDialog(false);
      setPermaDeleteItem(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus permanen');
    } finally {
      setPermaDeleting(false);
    }
  }, [permaDeleteItem]);

  /* ── Tabs ───────────────────────────────────────────────────── */
  const tabs: { key: 'all' | TrashItemType; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: 'Semua', icon: ShoppingBag },
    { key: 'users', label: 'User', icon: Users },
    { key: 'recipes', label: 'Resep', icon: ChefHat },
    { key: 'affiliate_accounts', label: 'Afiliasi', icon: Link2 },
    { key: 'product_links', label: 'Produk', icon: Package },
  ];

  /* ── Header nav items ─────────────────────────────────────── */
  const headerNav = [
    { icon: LayoutDashboard, screen: 'admin-dashboard' as const, label: 'Dashboard' },
    { icon: Users, screen: 'admin-users' as const, label: 'User' },
    { icon: ChefHat, screen: 'admin-recipes' as const, label: 'Resep' },
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
              <h1 className="text-lg font-bold tracking-tight text-red-500 dark:text-red-400 leading-tight">
                Tempat Sampah
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pulihkan atau hapus data secara permanen
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
          <div className="rounded-2xl border border-red-200/50 bg-red-50/50 backdrop-blur-sm p-4 dark:border-red-800/30 dark:bg-red-500/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  <span className="text-base font-bold text-red-600 dark:text-red-400">
                    {items.length}
                  </span>{' '}
                  item di tempat sampah
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Data dihapus dapat dipulihkan
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['users', 'recipes', 'affiliate_accounts', 'product_links'] as TrashItemType[]).map(
                (type) => {
                  const badge = getTypeBadge(type);
                  return (
                    <div
                      key={type}
                      className={`text-center rounded-lg ${badge.bg} p-2`}
                    >
                      <span className={`text-sm font-bold ${badge.text}`}>
                        {typeStats[type] || 0}
                      </span>
                      <p className="text-[10px] text-muted-foreground">{badge.label}</p>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Tab Filter ──────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map((tab) => (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.96 }}
                onClick={() => setTypeFilter(tab.key)}
                className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                  typeFilter === tab.key
                    ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:border-red-800/40'
                    : 'border-border/40 bg-card text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {(tab.key === 'all'
                  ? items.length
                  : typeStats[tab.key] || 0) > 0 && (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1 ${
                      typeFilter === tab.key
                        ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                        : ''
                    }`}
                  >
                    {tab.key === 'all'
                      ? items.length
                      : typeStats[tab.key] || 0}
                  </Badge>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Refresh Button ──────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-semibold">Item Dihapus</h2>
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {filteredItems.length}
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
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-xl" />
                    <Skeleton className="h-8 w-8 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Trash Item List ─────────────────────────────────── */}
        {!loading && filteredItems.length > 0 && (
          <motion.div variants={fadeUp} className="mb-6 space-y-3">
            {filteredItems.map((item) => {
              const badge = getTypeBadge(item.type);
              const TypeIcon = badge.icon;
              return (
                <Card
                  key={item.id}
                  className="border-border/50 bg-card/90 backdrop-blur-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Type icon */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${badge.bg}`}
                      >
                        <TypeIcon className={`h-5 w-5 ${badge.text}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">
                          {item.label}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 border ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            Dihapus{' '}
                            {new Date(item.deletedAt).toLocaleDateString(
                              'id-ID',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Restore */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRestore(item)}
                          disabled={restoring === item.id}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 transition-colors hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 disabled:opacity-50"
                          aria-label="Pulihkan"
                        >
                          {restoring === item.id ? (
                            <Loader2 className="h-4 w-4 text-emerald-500 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </motion.button>
                        {/* Permanent delete */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openPermaDeleteDialog(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-200 bg-red-50 transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                          aria-label="Hapus permanen"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </motion.button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* ── Empty State ─────────────────────────────────────── */}
        {!loading && filteredItems.length === 0 && (
          <motion.div variants={fadeUp} className="mb-6">
            <Bounce delay={0.2} intensity={2} hover>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
                  <span className="text-3xl">♻️</span>
                </div>
                <h3 className="text-base font-semibold">
                  {items.length === 0
                    ? 'Tempat Sampah Kosong'
                    : 'Tidak Ada Item'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  {items.length === 0
                    ? 'Tidak ada data yang telah dihapus. Semua data masih aman!'
                    : 'Tidak ada item dengan filter yang dipilih'}
                </p>
                {items.length === 0 && (
                  <CheckCircle2 className="mt-4 h-8 w-8 text-emerald-500" />
                )}
              </div>
            </Bounce>
          </motion.div>
        )}

        {/* ── Warning Section ──────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="rounded-xl bg-muted/30 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Perhatian:</strong> Data
                yang dihapus secara permanen tidak dapat dikembalikan lagi.
                Pastikan untuk memulihkan data penting sebelum menghapus
                permanen.
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── PERMANENT DELETE DIALOG ───────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Dialog open={showPermaDeleteDialog} onOpenChange={setShowPermaDeleteDialog}>
        <DialogContent className="rounded-2xl sm:max-w-sm p-0 gap-0">
          <div className="px-5 pt-5 pb-4">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </div>
                <span className="font-bold text-red-600 dark:text-red-400">
                  Hapus Permanen?
                </span>
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                Data yang dihapus permanen tidak dapat dikembalikan. Yakin ingin
                menghapus &quot;{permaDeleteItem?.label}&quot; secara permanen?
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="bg-muted/30 px-5 py-4 gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowPermaDeleteDialog(false)}
              disabled={permaDeleting}
              className="flex-1 rounded-xl"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handlePermaDeleteConfirm}
              disabled={permaDeleting}
              className="flex-1 gap-2 rounded-xl"
            >
              {permaDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminTrash;
