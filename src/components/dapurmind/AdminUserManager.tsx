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
  Users,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Shield,
  ShieldCheck,
  LogOut,
  UserCheck,
  UserX,
  ChefHat,
  Link2,
  BarChart3,
  Megaphone,
  LayoutDashboard,
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

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
}

/* ── Swipe-to-delete User Card ──────────────────────────────── */

interface SwipeableUserCardProps {
  user: AdminUser;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

function SwipeableUserCard({ user, onEdit, onDelete }: SwipeableUserCardProps) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-80, -40], [1, 0]);
  const deleteScale = useTransform(x, [-80, -40], [1, 0.8]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x < -60) {
      onDelete(user);
    } else {
      x.set(0);
    }
  };

  const initials = (user.name || user.email)
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
              {/* Avatar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-bold">
                {initials}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate">
                    {user.name || 'Tanpa Nama'}
                  </h3>
                  {/* Status dot */}
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    {user.isActive ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-400" />
                    )}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 ${
                      user.role === 'admin'
                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {user.role === 'admin' ? (
                      <span className="flex items-center gap-0.5">
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                      </span>
                    ) : (
                      'User'
                    )}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('id-ID', {
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
                  onEdit(user);
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/50 transition-colors hover:bg-accent"
                aria-label="Edit user"
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

export function AdminUserManager() {
  const setScreen = useAppStore((s) => s.setScreen);
  const goBack = useAppStore((s) => s.goBack);

  /* ── Local state ───────────────────────────────────────────── */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editIsActive, setEditIsActive] = useState(true);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  /* ── Fetch users ────────────────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/users', {
        headers: { 'X-Admin-Key': 'dapurmind2025' },
      });
      if (!res.ok) throw new Error('Gagal memuat data user');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshKey]);

  /* ── Stats ─────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const nonDeleted = users.filter((u) => !u.deletedAt);
    return {
      total: nonDeleted.length,
      active: nonDeleted.filter((u) => u.isActive).length,
      deleted: users.filter((u) => u.deletedAt).length,
    };
  }, [users]);

  /* ── Filtered users ────────────────────────────────────────── */
  const filteredUsers = useMemo(() => {
    let result = users.filter((u) => !u.deletedAt);

    if (tabFilter === 'active') result = result.filter((u) => u.isActive);
    if (tabFilter === 'inactive') result = result.filter((u) => !u.isActive);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name || '').toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, tabFilter, search]);

  /* ── Dialog handlers ───────────────────────────────────────── */

  const openEditDialog = useCallback((user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditIsActive(user.isActive);
    setShowEditDialog(true);
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!editingUser) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'dapurmind2025',
        },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName.trim(),
          email: editEmail.trim(),
          role: editRole,
          isActive: editIsActive,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal mengupdate user');
      }
      setShowEditDialog(false);
      setEditingUser(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengupdate user');
    } finally {
      setSaving(false);
    }
  }, [editingUser, editName, editEmail, editRole, editIsActive]);

  const openDeleteDialog = useCallback((user: AdminUser) => {
    setDeletingUser(user);
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingUser) return;
    try {
      setDeleting(true);
      setError(null);
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'dapurmind2025',
        },
        body: JSON.stringify({ id: deletingUser.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus user');
      }
      setShowDeleteDialog(false);
      setDeletingUser(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus user');
    } finally {
      setDeleting(false);
    }
  }, [deletingUser]);

  /* ── Tabs ───────────────────────────────────────────────────── */
  const tabs = [
    { key: 'all' as const, label: 'Semua', count: stats.total },
    { key: 'active' as const, label: 'Aktif', count: stats.active },
    { key: 'inactive' as const, label: 'Nonaktif', count: stats.total - stats.active },
  ];

  /* ── Header nav items ─────────────────────────────────────── */
  const headerNav = [
    { icon: LayoutDashboard, screen: 'admin-dashboard' as const, label: 'Dashboard' },
    { icon: ChefHat, screen: 'admin-recipes' as const, label: 'Resep' },
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
                Manajemen User
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Kelola semua pengguna
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
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-4 w-4 text-emerald-500" />
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.total}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Total User</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <UserCheck className="h-4 w-4 text-blue-500" />
                  <span className="text-lg font-bold">{stats.active}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Aktif</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <UserX className="h-4 w-4 text-red-500" />
                  <span className="text-lg font-bold">{stats.deleted}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Dihapus</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Search Bar ──────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Cari user berdasarkan nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-10"
            />
          </div>
        </motion.div>

        {/* ── Tab Filter ──────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-4">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.96 }}
                onClick={() => setTabFilter(tab.key)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                  tabFilter === tab.key
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800/40'
                    : 'border-border/40 bg-card text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {tab.label}
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-1 ${
                    tabFilter === tab.key
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : ''
                  }`}
                >
                  {tab.count}
                </Badge>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ── Refresh Button ──────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold">Daftar User</h2>
            <Badge variant="secondary" className="text-[10px] px-1.5">
              {filteredUsers.length}
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

        {/* ── User List ────────────────────────────────────────── */}
        {!loading && filteredUsers.length > 0 && (
          <motion.div variants={fadeUp} className="mb-6 space-y-0">
            {filteredUsers.map((user) => (
              <SwipeableUserCard
                key={user.id}
                user={user}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
              />
            ))}
          </motion.div>
        )}

        {/* ── Empty State ─────────────────────────────────────── */}
        {!loading && filteredUsers.length === 0 && (
          <motion.div variants={fadeUp} className="mb-6">
            <Bounce delay={0.2} intensity={2} hover>
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
                  <span className="text-3xl">👥</span>
                </div>
                <h3 className="text-base font-semibold">
                  {search.trim() ? 'User Tidak Ditemukan' : 'Belum Ada User'}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  {search.trim()
                    ? 'Coba kata kunci lain untuk mencari user'
                    : 'User yang terdaftar akan muncul di sini'}
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
                  Edit User
                </span>
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                {editingUser ? editingUser.email : ''}
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
                    {editIsActive
                      ? 'User dapat mengakses aplikasi'
                      : 'User dinonaktifkan sementara'}
                  </p>
                </div>
              </div>
              <Switch
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-xs font-semibold">
                Nama
              </Label>
              <Input
                id="edit-name"
                placeholder="Nama lengkap"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-xs font-semibold">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="email@contoh.com"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Role</Label>
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setEditRole('user')}
                  className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                    editRole === 'user'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                      : 'border-border/40 bg-card hover:border-border'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">User</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setEditRole('admin')}
                  className={`flex items-center gap-2 rounded-xl border p-3 transition-all ${
                    editRole === 'admin'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                      : 'border-border/40 bg-card hover:border-border'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-medium">Admin</span>
                </motion.button>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 px-5 py-4">
            <Button
              onClick={handleEditSubmit}
              disabled={!editEmail.trim() || saving}
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
                User &quot;{deletingUser?.name || deletingUser?.email}&quot; akan dipindahkan ke
                tempat sampah dan dinonaktifkan.
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

export default AdminUserManager;
