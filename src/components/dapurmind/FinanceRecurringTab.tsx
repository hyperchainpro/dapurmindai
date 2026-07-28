'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Edit3, ArrowUpRight, ArrowDownRight, Wallet, MoreHorizontal,
  Utensils, Car, ShoppingBag, Receipt, Heart, Gamepad2, GraduationCap,
  CircleDollarSign, TrendingUp, PiggyBank, CalendarDays, Repeat, RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/* ── Helpers & Constants ─────────────────────────────── */

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const EXPENSE_CATS = [
  { v: 'Makanan', icon: Utensils, c: 'text-orange-500' },
  { v: 'Transportasi', icon: Car, c: 'text-blue-500' },
  { v: 'Belanja', icon: ShoppingBag, c: 'text-purple-500' },
  { v: 'Tagihan', icon: Receipt, c: 'text-rose-500' },
  { v: 'Kesehatan', icon: Heart, c: 'text-pink-500' },
  { v: 'Hiburan', icon: Gamepad2, c: 'text-indigo-500' },
  { v: 'Pendidikan', icon: GraduationCap, c: 'text-teal-500' },
  { v: 'Lainnya', icon: MoreHorizontal, c: 'text-gray-500' },
] as const;

const INCOME_CATS = [
  { v: 'Gaji', icon: CircleDollarSign, c: 'text-emerald-500' },
  { v: 'Freelance', icon: TrendingUp, c: 'text-blue-500' },
  { v: 'Investasi', icon: PiggyBank, c: 'text-purple-500' },
  { v: 'Lainnya', icon: MoreHorizontal, c: 'text-gray-500' },
] as const;

const ALL_CATS = [...EXPENSE_CATS, ...INCOME_CATS];
const getCatMeta = (v: string) => ALL_CATS.find((c) => c.v === v) ?? EXPENSE_CATS[7];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

interface RecurringTransaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  frequency: 'Mingguan' | 'Bulanan' | 'Tahunan';
  nextDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
}

const FREQ_LABELS: Record<string, { label: string; badgeCls: string }> = {
  Mingguan: { label: 'Mingguan', badgeCls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  Bulanan: { label: 'Bulanan', badgeCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
  Tahunan: { label: 'Tahunan', badgeCls: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' },
};

/* ── Component ──────────────────────────────────────── */

export function FinanceRecurringTab({ userId }: { userId: string }) {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [dlgDelete, setDlgDelete] = useState<string | null>(null);

  // Form state
  const [fType, setFType] = useState<'income' | 'expense'>('expense');
  const [fCat, setFCat] = useState('');
  const [fAmt, setFAmt] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fFreq, setFFreq] = useState<'Mingguan' | 'Bulanan' | 'Tahunan'>('Bulanan');
  const [fNextDate, setFNextDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fEndDate, setFEndDate] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  /* ── Fetch ─────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/recurring?userId=${userId}`);
      if (res.ok) {
        const json = await res.json();
        setItems(json.data ?? json ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let isMounted = true;
    fetchData();
    return () => { isMounted = false; };
  }, [fetchData]);

  /* ── Grouped by frequency ──────────────────────── */
  const grouped = useMemo(() => {
    const order: Array<'Mingguan' | 'Bulanan' | 'Tahunan'> = ['Mingguan', 'Bulanan', 'Tahunan'];
    return order
      .map((freq) => ({
        freq,
        items: items.filter((i) => i.frequency === freq),
      }))
      .filter((g) => g.items.length > 0);
  }, [items]);

  /* ── Reset form ────────────────────────────────── */
  const resetForm = () => {
    setEditId(null);
    setFType('expense');
    setFCat('');
    setFAmt('');
    setFDesc('');
    setFFreq('Bulanan');
    setFNextDate(new Date().toISOString().split('T')[0]);
    setFEndDate('');
  };

  const openEdit = (r: RecurringTransaction) => {
    setEditId(r.id);
    setFType(r.type);
    setFCat(r.category);
    setFAmt(String(r.amount));
    setFDesc(r.description);
    setFFreq(r.frequency);
    setFNextDate(r.nextDate);
    setFEndDate(r.endDate ?? '');
    setDlgOpen(true);
  };

  /* ── Save ──────────────────────────────────────── */
  const handleSave = async () => {
    if (!userId || !fAmt || !fCat || !fNextDate) return;
    try {
      const body = {
        userId,
        type: fType,
        category: fCat,
        amount: Number(fAmt),
        description: fDesc,
        frequency: fFreq,
        nextDate: fNextDate,
        endDate: fEndDate || undefined,
      };
      const res = await fetch('/api/finance/recurring', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { id: editId, ...body } : body),
      });
      if (res.ok) {
        await fetchData();
        setDlgOpen(false);
        resetForm();
      }
    } catch (e) {
      console.error(e);
    }
  };

  /* ── Delete ────────────────────────────────────── */
  const handleDelete = async () => {
    if (!dlgDelete || !userId) return;
    try {
      const res = await fetch('/api/finance/recurring', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: dlgDelete, userId }),
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== dlgDelete));
      }
    } catch (e) {
      console.error(e);
    }
    setDlgDelete(null);
  };

  /* ── Toggle active ─────────────────────────────── */
  const handleToggle = async (item: RecurringTransaction) => {
    if (!userId) return;
    try {
      const res = await fetch('/api/finance/recurring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, userId, isActive: !item.isActive }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)),
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const cats = fType === 'income' ? INCOME_CATS : EXPENSE_CATS;

  /* ── Render ────────────────────────────────────── */
  if (loading) {
    return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>;
  }

  return (
    <>
      <div>
        {/* Add button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { resetForm(); setDlgOpen(true); }}
          className="nm-raised rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />Tambah Transaksi Berulang
        </motion.button>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 pt-12 text-center"
          >
            <div className="text-5xl">🔄</div>
            <p className="text-sm text-muted-foreground">Belum ada transaksi berulang</p>
            <p className="text-xs text-muted-foreground">Tambahkan untuk otomatis mencatat pengeluaran rutin</p>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="mt-4 space-y-5">
            {grouped.map((g) => (
              <motion.div key={g.freq} variants={fadeUp}>
                <div className="flex items-center gap-2 mb-2">
                  <Repeat className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold">{g.freq}</h3>
                  <Badge variant="secondary" className="text-[10px]">{g.items.length} item</Badge>
                </div>
                <div className="space-y-2">
                  {g.items.map((item) => {
                    const m = getCatMeta(item.category);
                    const Ic = m.icon;
                    const inc = item.type === 'income';
                    const freqMeta = FREQ_LABELS[item.frequency];
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        className={`group flex items-center gap-3 rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80 px-3 py-3 hover:bg-muted/30 transition-opacity ${
                          !item.isActive ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                          <Ic className={`h-4 w-4 ${m.c}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">{item.description || item.category}</p>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${inc ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <Badge className={`text-[9px] px-1.5 py-0 ${freqMeta.badgeCls}`} variant="secondary">
                              {freqMeta.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <CalendarDays className="h-2.5 w-2.5" />
                              {new Date(item.nextDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <p className={`text-sm font-bold ${inc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {inc ? '+' : '-'}{formatRupiah(item.amount)}
                          </p>
                          <Switch
                            checked={item.isActive}
                            onCheckedChange={() => handleToggle(item)}
                            className="scale-75"
                          />
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => openEdit(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"
                          >
                            <Edit3 className="h-3 w-3 text-muted-foreground" />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => setDlgDelete(item.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── Add/Edit Dialog ───────────────────────── */}
      <Dialog open={dlgOpen} onOpenChange={(o) => { if (!o) { setDlgOpen(false); resetForm(); } }}>
        <DialogContent className="rounded-2xl sm:max-w-sm max-h-[85vh] overflow-y-auto scroll-compact">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-emerald-500" />
              {editId ? 'Edit Transaksi Berulang' : 'Tambah Transaksi Berulang'}
            </DialogTitle>
            <DialogDescription>
              Transaksi ini akan tercatat secara otomatis sesuai jadwal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Type toggle */}
            <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
              <span className="text-sm font-medium">Tipe</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${fType === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>Pemasukan</span>
                <Switch checked={fType === 'expense'} onCheckedChange={(c) => { setFType(c ? 'expense' : 'income'); setFCat(''); }} />
                <span className={`text-xs font-medium ${fType === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'}`}>Pengeluaran</span>
              </div>
            </div>
            {/* Category */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Kategori</label>
              <Select value={fCat} onValueChange={setFCat}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c.v} value={c.v}>{c.v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {/* Amount */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Jumlah</label>
              <Input type="number" value={fAmt} onChange={(e) => setFAmt(e.target.value)} placeholder="50000" className="mt-1" />
            </div>
            {/* Description */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Deskripsi</label>
              <Input value={fDesc} onChange={(e) => setFDesc(e.target.value)} placeholder="Bayar listrik" className="mt-1" />
            </div>
            {/* Frequency */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Frekuensi</label>
              <Select value={fFreq} onValueChange={(v) => setFFreq(v as 'Mingguan' | 'Bulanan' | 'Tahunan')}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mingguan">Mingguan</SelectItem>
                  <SelectItem value="Bulanan">Bulanan</SelectItem>
                  <SelectItem value="Tahunan">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Next date */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tanggal Berikutnya</label>
              <Input type="date" value={fNextDate} onChange={(e) => setFNextDate(e.target.value)} className="mt-1" />
            </div>
            {/* End date (optional) */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tanggal Berakhir (opsional)</label>
              <Input type="date" value={fEndDate} onChange={(e) => setFEndDate(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDlgOpen(false); resetForm(); }} className="flex-1 rounded-full">Batal</Button>
            <Button
              onClick={handleSave}
              className="nm-raised flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700"
              disabled={!fAmt || !fCat || !fNextDate}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ─────────────────────────── */}
      <Dialog open={!!dlgDelete} onOpenChange={() => setDlgDelete(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-500" />Hapus Transaksi Berulang
            </DialogTitle>
            <DialogDescription>Apakah kamu yakin ingin menghapus transaksi berulang ini?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDlgDelete(null)} className="flex-1 rounded-full">Batal</Button>
            <Button variant="destructive" onClick={handleDelete} className="nm-raised flex-1 rounded-full">Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default FinanceRecurringTab;