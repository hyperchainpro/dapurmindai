'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Users,
  UserCheck,
  UserPlus,
  Edit3,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  LogOut,
  Settings,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/hooks/useAppState';
import type { AdminUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ── Animation variants ───────────────────────────────────────── */

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: 'blur(2px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── Role helpers ─────────────────────────────────────────────── */

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  user: {
    label: 'User',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300',
    icon: <Users className="h-3 w-3" />,
  },
  admin: {
    label: 'Admin',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    icon: <ShieldCheck className="h-3 w-3" />,
  },
  superadmin: {
    label: 'Superadmin',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    icon: <ShieldAlert className="h-3 w-3" />,
  },
};

/* ── Main Component ──────────────────────────────────────────── */

export function AdminUsers() {
  const setScreen = useAppStore((s) => s.setScreen);
  const goBack = useAppStore((s) => s.goBack);

  // Data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [newThisMonth, setNewThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editIsActive, setEditIsActive] = useState(true);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  // ── Fetch users ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memuat');

      setUsers(json.data ?? []);
      setTotalUsers(json.pagination?.total ?? 0);

      // Fetch summary stats separately (page=1, limit=1 to get totals)
      const [activeRes, newRes] = await Promise.all([
        fetch('/api/admin/users?status=active&limit=1'),
        fetch('/api/admin/users?limit=1'),
      ]);
      const activeJson = await activeRes.json();
      setActiveUsers(activeJson.pagination?.total ?? 0);
    } catch {
      toast.error('Gagal memuat pengguna');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Open edit ──
  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditIsActive(user.isActive);
    setEditOpen(true);
  };

  // ── Save edit ──
  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: editRole,
          isActive: editIsActive,
        }),
      });
      if (!res.ok) throw new Error('Update gagal');
      toast.success('Pengguna diperbarui');
      setEditOpen(false);
      fetchUsers();
    } catch {
      toast.error('Gagal memperbarui pengguna');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ──
  const toggleActive = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) throw new Error('Toggle gagal');
      toast.success(user.isActive ? 'Pengguna dinonaktifkan' : 'Pengguna diaktifkan');
      fetchUsers();
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete gagal');
      toast.success('Pengguna dihapus');
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast.error('Gagal menghapus pengguna');
    } finally {
      setSaving(false);
    }
  };

  // ── Derived ──
  const totalPages = Math.ceil(totalUsers / limit);
  const roleConfig = (role: string) => ROLE_CONFIG[role] ?? ROLE_CONFIG.user;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="relative min-h-screen pb-28 bg-gradient-to-br from-emerald-50/30 via-white to-amber-50/20 dark:from-emerald-950/20 dark:via-background dark:to-amber-950/10">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-lg px-4 pt-4"
      >
        {/* ── Header ─────────────────────────────────────── */}
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
                Manajemen Pengguna
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Kelola semua pengguna DapurMind
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setScreen('admin-dashboard')}
                className="flex h-10 w-10 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
                aria-label="Dashboard"
              >
                <Shield className="h-5 w-5 text-muted-foreground" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setScreen('admin-settings')}
                className="flex h-10 w-10 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
                aria-label="Pengaturan"
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

        {/* ── Stats Row ──────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-5 grid grid-cols-3 gap-2">
          {[
            { emoji: '👥', value: totalUsers, label: 'Total Pengguna' },
            { emoji: '✅', value: activeUsers, label: 'Pengguna Aktif' },
            { emoji: '🆕', value: newThisMonth, label: 'Bulan Ini' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 rounded-xl border border-emerald-200/50 bg-white/80 p-3 text-center shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80"
            >
              <span className="text-lg">{stat.emoji}</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Search & Filters ────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-4 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama, username, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="rounded-xl border-emerald-200/50 bg-white/60 pl-9 pr-4 text-sm focus-visible:ring-emerald-400/50 dark:border-emerald-800/50 dark:bg-card/60"
            />
          </div>
          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v === '_all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="flex-1 rounded-xl border-emerald-200/50 bg-white/60 text-xs dark:border-emerald-800/50 dark:bg-card/60">
                <SelectValue placeholder="Semua Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Semua Role</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Superadmin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === '_all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="flex-1 rounded-xl border-emerald-200/50 bg-white/60 text-xs dark:border-emerald-800/50 dark:bg-card/60">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* ── Loading ────────────────────────────────────── */}
        {loading && (
          <motion.div variants={fadeUp} className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl nm-raised p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── User List ────────────────────────────────────── */}
        {!loading && users.length > 0 && (
          <motion.div variants={stagger} className="space-y-3">
            {users.map((user) => {
              const rc = roleConfig(user.role);
              return (
                <motion.div
                  key={user.id}
                  variants={fadeUp}
                  className="overflow-hidden rounded-xl border border-border/50 bg-card/90 backdrop-blur-sm transition-shadow hover:shadow-md"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/30">
                        <span className="text-lg">{user.avatar || '👤'}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold truncate">{user.name}</h3>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${rc.color}`}>
                            {rc.icon}
                            {rc.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">@{user.username}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            {user.isActive ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-gray-400" />
                            )}
                            {user.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                          <span>Terdaftar: {formatDate(user.createdAt)}</span>
                          {user.lastLoginAt && (
                            <span>Login terakhir: {formatDate(user.lastLoginAt)}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openEdit(user)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg nm-raised-sm"
                          aria-label="Edit"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleActive(user)}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                            user.isActive
                              ? 'border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800/50 dark:bg-red-900/20'
                              : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-900/20'
                          }`}
                          aria-label={user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {user.isActive ? (
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          )}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => { setDeleteTarget(user); setDeleteOpen(true); }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 transition-colors hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-900/20"
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* ── Pagination ──────────────────────────── */}
            {totalPages > 1 && (
              <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-xl border-emerald-200/50 dark:border-emerald-800/50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-xl border-emerald-200/50 dark:border-emerald-800/50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchUsers}
                  className="gap-1 rounded-full text-xs text-muted-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Empty State ──────────────────────────────── */}
        {!loading && users.length === 0 && (
          <motion.div
            variants={fadeUp}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <div className="text-6xl">👥</div>
            <div>
              <h3 className="text-base font-semibold">Tidak ada pengguna ditemukan</h3>
              <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">
                Coba ubah filter pencarian untuk menampilkan pengguna.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── Edit Dialog ─────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-hidden rounded-2xl sm:max-w-md gap-0">
          <div className="border-b border-border/40 bg-card px-5 pt-5 pb-4 pr-12">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-emerald-500 text-white">
                  <Edit3 className="h-4 w-4" />
                </div>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  Edit Pengguna
                </span>
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                {editingUser ? `@${editingUser.username}` : ''}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto max-h-[55vh] px-5 py-4 space-y-5 scroll-compact scroll-elevated mx-1">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Nama</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold">Email</label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold">Role</label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/30 p-4">
              <div>
                <p className="text-sm font-semibold">Status Aktif</p>
                <p className="text-[11px] text-muted-foreground">
                  {editIsActive ? 'Pengguna dapat login dan menggunakan aplikasi' : 'Pengguna dinonaktifkan sementara'}
                </p>
              </div>
              <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
            </div>
          </div>

          <div className="bg-muted/30 px-5 py-4">
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="w-full gap-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl sm:max-w-sm gap-0">
          <div className="px-5 pt-5 pb-4">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </div>
                Hapus Pengguna
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                Apakah Anda yakin ingin menghapus pengguna <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-emerald-200/50 dark:border-emerald-800/50"
              onClick={() => setDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
              disabled={saving}
              onClick={handleDelete}
            >
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminUsers;
