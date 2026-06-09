'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
  ArrowLeft,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Link2,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import type { AffiliateAccount } from '@/types';
import { AFFILIATE_MARKETPLACES } from '@/lib/affiliate';
import type { AffiliateMarketplace } from '@/lib/affiliate';
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
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedList } from '@/components/dapurmind/MagicUI';
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

/* ── Helpers ─────────────────────────────────────────────────── */

function getMarketplace(platform: string): AffiliateMarketplace | undefined {
  return AFFILIATE_MARKETPLACES.find((mp) => mp.name.toLowerCase().includes(platform.toLowerCase()) || mp.id === platform);
}

function maskAffiliateId(id: string): string {
  if (!id || id.length <= 4) return id;
  return id.slice(0, 4) + '****';
}

/* ── Swipe-to-delete Account Card ────────────────────────────── */

interface SwipeableAccountCardProps {
  account: AffiliateAccount;
  onEdit: (account: AffiliateAccount) => void;
  onDelete: (account: AffiliateAccount) => void;
}

function SwipeableAccountCard({ account, onEdit, onDelete }: SwipeableAccountCardProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-80, -40], [1, 0]);
  const deleteScale = useTransform(x, [-80, -40], [1, 0.8]);

  const mp = getMarketplace(account.platform);
  const logo = mp?.logo ?? '🔗';
  const isActive = account.isActive;

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -60) {
      onDelete(account);
    } else {
      x.set(0);
    }
  };

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
            <div className="flex items-center gap-3">
              {/* Platform logo */}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${mp?.bgColor ?? 'bg-muted'}`}
              >
                {logo}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate">
                    {mp?.name ?? account.platform}
                  </h3>
                  {/* Status dot */}
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    {isActive ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-400" />
                    )}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                  ID: {maskAffiliateId(account.affiliateId)}
                </p>
                <div className="mt-1">
                  {isActive ? (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Aktif</span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Nonaktif</span>
                  )}
                </div>
              </div>

              {/* Edit button */}
              <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(account);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/50 transition-colors hover:bg-accent"
                  aria-label="Edit akun"
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

/* ── Quick Setup Card ────────────────────────────────────────── */

interface QuickSetupCardProps {
  marketplace: AffiliateMarketplace;
  isConnected: boolean;
  onAdd: (marketplace: AffiliateMarketplace) => void;
}

function QuickSetupCard({ marketplace, isConnected, onAdd }: QuickSetupCardProps) {
  return (
    <motion.div whileTap={{ scale: 0.97 }} className="w-full">
      {isConnected ? (
        <div className="relative rounded-xl border border-border/40 bg-card/60 p-3">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${marketplace.bgColor}`}>
              {marketplace.logo}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{marketplace.name}</p>
              <p className="text-[10px] text-emerald-500 font-medium">✓ Terhubung</p>
            </div>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          </div>
        </div>
      ) : (
          <button
            onClick={() => onAdd(marketplace)}
            className="w-full rounded-xl border border-dashed border-border/60 bg-muted/30 p-3 transition-colors hover:bg-muted/50 text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${marketplace.bgColor}`}>
                {marketplace.logo}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{marketplace.name}</p>
                <p className="text-[10px] text-muted-foreground">{marketplace.tagline}</p>
              </div>
              <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </button>
      )}
    </motion.div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */

export function AdminAffiliate() {
  /* ── Store hooks ───────────────────────────────────────────── */
  const setScreen = useAppStore((s) => s.setScreen);
  const goBack = useAppStore((s) => s.goBack);
  const affiliateAccounts = useAppStore((s) => s.affiliateAccounts);
  const setAffiliateAccounts = useAppStore((s) => s.setAffiliateAccounts);
  const addAffiliateAccount = useAppStore((s) => s.addAffiliateAccount);
  const removeAffiliateAccount = useAppStore((s) => s.removeAffiliateAccount);

  /* ── Local state ───────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Add dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addPlatform, setAddPlatform] = useState<string>('');
  const [addAffiliateId, setAddAffiliateId] = useState('');
  const [addApiKey, setAddApiKey] = useState('');
  const [addBaseUrlTemplate, setAddBaseUrlTemplate] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AffiliateAccount | null>(null);
  const [editAffiliateId, setEditAffiliateId] = useState('');
  const [editApiKey, setEditApiKey] = useState('');
  const [editBaseUrlTemplate, setEditBaseUrlTemplate] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [showEditApiKey, setShowEditApiKey] = useState(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<AffiliateAccount | null>(null);

  /* ── Derived data ──────────────────────────────────────────── */
  const totalAvailable = AFFILIATE_MARKETPLACES.length;
  const connectedCount = affiliateAccounts.filter((a) => a.isActive).length;
  const connectedPlatforms = useMemo(
    () => new Set(affiliateAccounts.map((a) => a.platform)),
    [affiliateAccounts],
  );

  const hasAccounts = affiliateAccounts.length > 0;
  const hasActiveAccounts = connectedCount > 0;

  /* ── Fetch accounts on mount ───────────────────────────────── */
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/affiliate/accounts');
      if (!res.ok) throw new Error('Gagal memuat akun afiliasi');
      const data = await res.json();
      setAffiliateAccounts(data.accounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, [setAffiliateAccounts]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts, refreshKey]);

  /* ── Dialog handlers ───────────────────────────────────────── */

  const openAddDialog = useCallback((marketplace?: AffiliateMarketplace) => {
    if (marketplace) {
      setAddPlatform(marketplace.id);
      setAddBaseUrlTemplate(
        `https://example.com/aff?product={query}&aff={affiliateId}`,
      );
    } else {
      setAddPlatform('');
      setAddBaseUrlTemplate('');
    }
    setAddAffiliateId('');
    setAddApiKey('');
    setShowApiKey(false);
    setShowAddDialog(true);
  }, []);

  const handleAddSubmit = useCallback(async () => {
    if (!addPlatform || !addAffiliateId.trim()) return;
    const mp = AFFILIATE_MARKETPLACES.find((m) => m.id === addPlatform);

    try {
      setSaving(true);
      const res = await fetch('/api/affiliate/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: mp?.name ?? addPlatform,
          affiliateId: addAffiliateId.trim(),
          apiKey: addApiKey.trim() || undefined,
          baseUrlTemplate: addBaseUrlTemplate.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menambahkan akun');
      }
      const { account } = await res.json();
      addAffiliateAccount(account);
      setShowAddDialog(false);
      resetAddForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan akun');
    } finally {
      setSaving(false);
    }
  }, [addPlatform, addAffiliateId, addApiKey, addBaseUrlTemplate, addAffiliateAccount]);

  const resetAddForm = useCallback(() => {
    setAddPlatform('');
    setAddAffiliateId('');
    setAddApiKey('');
    setAddBaseUrlTemplate('');
    setShowApiKey(false);
  }, []);

  const openEditDialog = useCallback((account: AffiliateAccount) => {
    setEditingAccount(account);
    setEditAffiliateId(account.affiliateId);
    setEditApiKey(account.apiKey ?? '');
    setEditBaseUrlTemplate(account.baseUrlTemplate);
    setEditIsActive(account.isActive);
    setShowEditApiKey(false);
    setShowEditDialog(true);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!editingAccount || !editAffiliateId.trim()) return;
    const mp = getMarketplace(editingAccount.platform);

    try {
      setSaving(true);
      const res = await fetch('/api/affiliate/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAccount.id,
          platform: mp?.name ?? editingAccount.platform,
          affiliateId: editAffiliateId.trim(),
          apiKey: editApiKey.trim() || null,
          baseUrlTemplate: editBaseUrlTemplate.trim(),
          isActive: editIsActive,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengupdate akun');
      }
      const { account } = await res.json();
      // Update local state: replace the account
      setAffiliateAccounts(
        affiliateAccounts.map((a) => (a.id === account.id ? account : a)),
      );
      setShowEditDialog(false);
      setEditingAccount(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengupdate akun');
    } finally {
      setSaving(false);
    }
  }, [editingAccount, editAffiliateId, editApiKey, editBaseUrlTemplate, editIsActive, affiliateAccounts, setAffiliateAccounts]);

  const openDeleteDialog = useCallback((account: AffiliateAccount) => {
    setDeletingAccount(account);
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingAccount) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/affiliate/accounts?id=${encodeURIComponent(deletingAccount.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus akun');
      }
      removeAffiliateAccount(deletingAccount.id);
      setShowDeleteDialog(false);
      setDeletingAccount(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus akun');
    } finally {
      setDeleting(false);
    }
  }, [deletingAccount, removeAffiliateAccount]);

  /* ── AnimatedList items ────────────────────────────────────── */

  const accountListItems = useMemo(
    () =>
      affiliateAccounts.map((account) => ({
        id: account.id,
        content: (
          <SwipeableAccountCard
            account={account}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
          />
        ),
      })),
    [affiliateAccounts, openEditDialog, openDeleteDialog],
  );

  /* ── Selected platform for add dialog ──────────────────────── */

  const selectedMp = useMemo(
    () => AFFILIATE_MARKETPLACES.find((m) => m.id === addPlatform),
    [addPlatform],
  );

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
                Akun Afiliasi Saya
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Kelola koneksi marketplace
              </p>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setScreen('admin-analytics')}
                className="flex h-10 w-10 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
                aria-label="Pengaturan analitik"
              >
                <Settings className="h-5 w-5 text-muted-foreground" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  useAppStore.getState().setAdminLoggedIn(false);
                  useAppStore.getState().setScreen('dashboard');
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 shadow-sm transition-colors hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                aria-label="Logout admin"
              >
                <LogOut className="h-5 w-5 text-red-500" />
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
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">{error}</p>
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

        {/* ── Connection Status Banner ────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-5">
          <div
            className={`rounded-2xl border p-4 ${
              hasActiveAccounts
                ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-800/40 dark:bg-emerald-500/10'
                : 'border-amber-200 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-500/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  hasActiveAccounts ? 'bg-emerald-500/15' : 'bg-amber-500/15'
                }`}
              >
                {hasActiveAccounts ? (
                  <Wifi className="h-5 w-5 text-emerald-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  <span className={`text-base font-bold tracking-tight ${hasActiveAccounts ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {connectedCount}
                  </span>
                  <span className="text-sm text-muted-foreground font-normal">
                    {' '}dari {totalAvailable} marketplace terhubung
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {hasActiveAccounts
                    ? 'Afiliasi aktif dan siap menghasilkan komisi'
                    : 'Hubungkan marketplace untuk mulai monetisasi'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Loading State ───────────────────────────────────── */}
        {loading && (
          <motion.div variants={fadeUp} className="space-y-3 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
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

        {/* ── Connected Accounts List ─────────────────────────── */}
        {!loading && hasAccounts && (
          <motion.div variants={fadeUp} className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-semibold">Akun Terhubung</h2>
                <Badge variant="secondary" className="text-[10px] px-1.5">
                  {affiliateAccounts.length}
                </Badge>
              </div>
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Segarkan
              </button>
            </div>
            <AnimatedList
              items={accountListItems}
              staggerDelay={0.1}
              animationDuration={0.45}
            />
          </motion.div>
        )}

        {/* ── Empty State ─────────────────────────────────────── */}
        {!loading && !hasAccounts && (
          <motion.div variants={fadeUp} className="mb-6">
            <Bounce delay={0.2} intensity={2} hover>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
                  <span className="text-3xl">🔗</span>
                </div>
                <h3 className="text-base font-semibold">Belum Ada Akun Afiliasi</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  Hubungkan marketplace favoritmu untuk mulai mendapatkan komisi dari setiap pembelian bahan masakan.
                </p>
                <Button
                    onClick={() => openAddDialog()}
                    className="mt-5 gap-2 rounded-xl bg-emerald-500 text-white shadow-nm-accent hover:bg-emerald-600"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Akun Pertama
                  </Button>
              </div>
            </Bounce>
          </motion.div>
        )}

        {/* ── Quick Setup Section ─────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold">Tambah Cepat</h2>
            </div>
            <button
              onClick={() => openAddDialog()}
              className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Kustom
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {AFFILIATE_MARKETPLACES.map((mp, i) => (
              <Bounce key={mp.id} delay={i * 0.06} intensity={1}>
                <QuickSetupCard
                  marketplace={mp}
                  isConnected={connectedPlatforms.has(mp.id) || connectedPlatforms.has(mp.name)}
                  onAdd={openAddDialog}
                />
              </Bounce>
            ))}
          </div>
        </motion.div>

        {/* ── Info Section ────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="rounded-xl bg-muted/30 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Tips:</strong> Geser kartu akun ke kiri untuk menghapus dengan cepat. Pastikan Affiliate ID dan API Key kamu benar agar link afiliasi dapat berfungsi dengan baik.
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── ADD DIALOG ───────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[85vh] overflow-hidden rounded-2xl sm:max-w-md gap-0">
          <div className="border-b border-border/40 bg-card px-5 pt-5 pb-4">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-amber-500 text-white">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Tambah Akun Afiliasi
                </span>
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Hubungkan marketplace untuk mulai monetisasi
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto max-h-[55vh] px-5 py-4 space-y-5">
            {/* Platform Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Platform</Label>
              <div className="grid grid-cols-3 gap-2">
                {AFFILIATE_MARKETPLACES.map((mp) => {
                  const isSelected = addPlatform === mp.id;
                  return (
                    <motion.button
                      key={mp.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setAddPlatform(mp.id);
                        if (!addBaseUrlTemplate || addBaseUrlTemplate.includes('example.com')) {
                          setAddBaseUrlTemplate(
                            `https://example.com/aff?product={query}&aff={affiliateId}`,
                          );
                        }
                      }}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm dark:bg-emerald-500/10'
                          : 'border-border/40 bg-card hover:border-border'
                      }`}
                    >
                      <span className="text-2xl">{mp.logo}</span>
                      <span className="text-[10px] font-medium text-center leading-tight">
                        {mp.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              {selectedMp && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  ✨ {selectedMp.tagline}
                </p>
              )}
            </div>

            <Separator />

            {/* Affiliate ID */}
            <div className="space-y-2">
              <Label htmlFor="add-affiliate-id" className="text-xs font-semibold">
                Affiliate ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-affiliate-id"
                placeholder="Contoh: DAPUR-12345"
                value={addAffiliateId}
                onChange={(e) => setAddAffiliateId(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* API Key (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="add-api-key" className="text-xs font-semibold">
                API Key <span className="text-muted-foreground font-normal">(opsional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="add-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Masukkan API key jika ada"
                  value={addApiKey}
                  onChange={(e) => setAddApiKey(e.target.value)}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Base URL Template */}
            <div className="space-y-2">
              <Label htmlFor="add-base-url" className="text-xs font-semibold">
                URL Template <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-base-url"
                placeholder="https://example.com/aff?product={query}&aff={affiliateId}"
                value={addBaseUrlTemplate}
                onChange={(e) => setAddBaseUrlTemplate(e.target.value)}
                className="rounded-xl font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Gunakan {'{query}'} untuk kata kunci produk dan {'{affiliateId}'} untuk ID afiliasi
              </p>
            </div>
          </div>

          <div className=" bg-muted/30 px-5 py-4">
              <Button
                onClick={handleAddSubmit}
                disabled={!addPlatform || !addAffiliateId.trim() || !addBaseUrlTemplate.trim() || saving}
                className="w-full gap-2 rounded-xl bg-emerald-500 text-white shadow-nm-accent hover:bg-emerald-600 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Simpan
              </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── EDIT DIALOG ──────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[85vh] overflow-hidden rounded-2xl sm:max-w-md gap-0">
          <div className="border-b border-border/40 bg-card px-5 pt-5 pb-4">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-emerald-500 text-white">
                  <Edit3 className="h-4 w-4" />
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  Edit Akun Afiliasi
                </span>
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                {editingAccount ? getMarketplace(editingAccount.platform)?.name ?? editingAccount.platform : ''}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto max-h-[55vh] px-5 py-4 space-y-5">
            {/* Active Status Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                {editIsActive ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-semibold">Status Aktif</p>
                  <p className="text-[11px] text-muted-foreground">
                    {editIsActive ? 'Link afiliasi aktif dan menghasilkan komisi' : 'Link afiliasi dinonaktifkan sementara'}
                  </p>
                </div>
              </div>
              <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
            </div>

            {/* Affiliate ID */}
            <div className="space-y-2">
              <Label htmlFor="edit-affiliate-id" className="text-xs font-semibold">
                Affiliate ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-affiliate-id"
                placeholder="Contoh: DAPUR-12345"
                value={editAffiliateId}
                onChange={(e) => setEditAffiliateId(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <Label htmlFor="edit-api-key" className="text-xs font-semibold">
                API Key <span className="text-muted-foreground font-normal">(opsional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="edit-api-key"
                  type={showEditApiKey ? 'text' : 'password'}
                  placeholder="Masukkan API key jika ada"
                  value={editApiKey}
                  onChange={(e) => setEditApiKey(e.target.value)}
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEditApiKey(!showEditApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showEditApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Base URL Template */}
            <div className="space-y-2">
              <Label htmlFor="edit-base-url" className="text-xs font-semibold">
                URL Template <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-base-url"
                placeholder="https://example.com/aff?product={query}&aff={affiliateId}"
                value={editBaseUrlTemplate}
                onChange={(e) => setEditBaseUrlTemplate(e.target.value)}
                className="rounded-xl font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Gunakan {'{query}'} untuk kata kunci dan {'{affiliateId}'} untuk ID afiliasi
              </p>
            </div>
          </div>

          <div className=" bg-muted/30 px-5 py-4">
              <Button
                onClick={handleEditSubmit}
                disabled={!editAffiliateId.trim() || !editBaseUrlTemplate.trim() || saving}
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
      {/* ── DELETE DIALOG ────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl sm:max-w-sm gap-0">
          <div className="px-5 pt-5 pb-4">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                Hapus Akun Afiliasi
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-relaxed">
                Apakah kamu yakin ingin menghapus akun afiliasi{' '}
                <strong>
                  {deletingAccount ? getMarketplace(deletingAccount.platform)?.name ?? deletingAccount.platform : ''}
                </strong>
                ? Semua link produk dan log klik terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className=" px-5 py-4 flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingAccount(null);
              }}
              className="flex-1 rounded-xl"
              disabled={deleting}
            >
              Batal
            </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 gap-2 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Hapus
              </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminAffiliate;
