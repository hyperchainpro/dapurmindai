'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, ArrowUpRight, ArrowDownRight, Wallet, Trash2, Edit3,
  Utensils, Car, ShoppingBag, Receipt, Heart, Gamepad2, GraduationCap,
  MoreHorizontal, PiggyBank, CalendarDays, TrendingUp, Target, CircleDollarSign,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { useTranslation } from '@/hooks/useTranslation';
import type { FinanceRecord, FinanceBudget, FinanceGoal } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/* ── Helpers & Constants ────────────────────────────────────────── */

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
const GOAL_ICONS = ['🏠', '🚗', '🎓', '✈️', '📱', '💍', '💻', '🎮'];

const getCatMeta = (v: string) => ALL_CATS.find((c) => c.v === v) ?? EXPENSE_CATS[7];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ── Main Component ──────────────────────────────────────────────── */

export function FinancialPlannerPage() {
  const { t } = useTranslation();
  const authUser = useAppStore((s) => s.authUser);
  const goBack = useAppStore((s) => s.goBack);
  const records = useAppStore((s) => s.financeRecords);
  const budgets = useAppStore((s) => s.financeBudgets);
  const goals = useAppStore((s) => s.financeGoals);
  const loading = useAppStore((s) => s.isFinanceLoading);
  const setRecords = useAppStore((s) => s.setFinanceRecords);
  const setBudgets = useAppStore((s) => s.setFinanceBudgets);
  const setGoals = useAppStore((s) => s.setFinanceGoals);
  const addRecord = useAppStore((s) => s.addFinanceRecord);
  const updateRecord = useAppStore((s) => s.updateFinanceRecord);
  const removeRecord = useAppStore((s) => s.removeFinanceRecord);
  const addBudget = useAppStore((s) => s.addFinanceBudget);
  const updateBudget = useAppStore((s) => s.updateFinanceBudget);
  const removeBudget = useAppStore((s) => s.removeFinanceBudget);
  const addGoal = useAppStore((s) => s.addFinanceGoal);
  const updateGoal = useAppStore((s) => s.updateFinanceGoal);
  const removeGoal = useAppStore((s) => s.removeFinanceGoal);
  const setLoading = useAppStore((s) => s.setFinanceLoading);
  const userId = authUser?.id;

  const [activeTab, setActiveTab] = useState<'records' | 'budgets' | 'goals'>('records');

  // Dialog open states
  const [dlgRecord, setDlgRecord] = useState(false);
  const [dlgBudget, setDlgBudget] = useState(false);
  const [dlgGoal, setDlgGoal] = useState(false);
  const [dlgSavings, setDlgSavings] = useState<FinanceGoal | null>(null);
  const [dlgDelete, setDlgDelete] = useState<{ type: string; id: string } | null>(null);

  // Record form
  const [recType, setRecType] = useState<'income' | 'expense'>('expense');
  const [recAmt, setRecAmt] = useState('');
  const [recCat, setRecCat] = useState('');
  const [recDesc, setRecDesc] = useState('');
  const [recDate, setRecDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [editRecId, setEditRecId] = useState<string | null>(null);

  // Budget form
  const [budCat, setBudCat] = useState('');
  const [budLimit, setBudLimit] = useState('');
  const [budPeriod, setBudPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [editBudId, setEditBudId] = useState<string | null>(null);

  // Goal form
  const [goTitle, setGoTitle] = useState('');
  const [goTarget, setGoTarget] = useState('');
  const [goSaved, setGoSaved] = useState('');
  const [goDeadline, setGoDeadline] = useState('');
  const [goIcon, setGoIcon] = useState('🏠');
  const [editGoId, setEditGoId] = useState<string | null>(null);

  // Savings input
  const [savAmt, setSavAmt] = useState('');

  /* ── Fetch data ──────────────────────────────────── */
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      try {
        const [r, b, g] = await Promise.all([
          fetch(`/api/finance/records?userId=${userId}`),
          fetch(`/api/finance/budgets?userId=${userId}`),
          fetch(`/api/finance/goals?userId=${userId}`),
        ]);
        if (r.ok) setRecords(await r.json());
        if (b.ok) setBudgets(await b.json());
        if (g.ok) setGoals(await g.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [userId, setRecords, setBudgets, setGoals, setLoading]);

  /* ── Monthly stats ───────────────────────────────── */
  const now = new Date();
  const mon = now.getMonth(), yr = now.getFullYear();
  const monthlyIn = useMemo(() => records.filter((r) => { const d = new Date(r.date); return r.type === 'income' && d.getMonth() === mon && d.getFullYear() === yr; }).reduce((s, r) => s + r.amount, 0), [records, mon, yr]);
  const monthlyOut = useMemo(() => records.filter((r) => { const d = new Date(r.date); return r.type === 'expense' && d.getMonth() === mon && d.getFullYear() === yr; }).reduce((s, r) => s + r.amount, 0), [records, mon, yr]);
  const balance = monthlyIn - monthlyOut;

  /* ── Grouped records ──────────────────────────────── */
  const grouped = useMemo(() => {
    const m = new Map<string, FinanceRecord[]>();
    records.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach((r) => {
      const k = r.date; if (!m.has(k)) m.set(k, []); m.get(k)!.push(r);
    });
    return Array.from(m.entries());
  }, [records]);

  /* ── Budgets with computed spent ─────────────────── */
  const budgetsWithSpent = useMemo(() => budgets.map((b) => ({
    ...b,
    spent: records.filter((r) => r.type === 'expense' && r.category === b.category).reduce((s, r) => s + r.amount, 0),
  })), [budgets, records]);

  /* ── Form helpers ────────────────────────────────── */
  const resetRec = () => { setEditRecId(null); setRecType('expense'); setRecAmt(''); setRecCat(''); setRecDesc(''); setRecDate(new Date().toISOString().split('T')[0]); };
  const resetBud = () => { setEditBudId(null); setBudCat(''); setBudLimit(''); setBudPeriod('monthly'); };
  const resetGo = () => { setEditGoId(null); setGoTitle(''); setGoTarget(''); setGoSaved(''); setGoDeadline(''); setGoIcon('🏠'); };

  const openEditRec = (r: FinanceRecord) => { setEditRecId(r.id); setRecType(r.type); setRecAmt(String(r.amount)); setRecCat(r.category); setRecDesc(r.description); setRecDate(r.date); setDlgRecord(true); };
  const openEditBud = (b: FinanceBudget) => { setEditBudId(b.id); setBudCat(b.category); setBudLimit(String(b.limitAmount)); setBudPeriod(b.period); setDlgBudget(true); };
  const openEditGo = (g: FinanceGoal) => { setEditGoId(g.id); setGoTitle(g.title); setGoTarget(String(g.targetAmount)); setGoSaved(String(g.savedAmount)); setGoDeadline(g.deadline); setGoIcon(g.icon); setDlgGoal(true); };

  /* ── Save handlers ───────────────────────────────── */
  const saveRec = async () => {
    if (!userId || !recAmt || !recCat) return;
    try {
      const body = { userId, type: recType, category: recCat, amount: Number(recAmt), description: recDesc, date: recDate };
      const res = await fetch('/api/finance/records', { method: editRecId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editRecId ? { id: editRecId, ...body } : body) });
      if (res.ok) { const d = await res.json(); editRecId ? updateRecord(editRecId, d) : addRecord(d); }
      setDlgRecord(false); resetRec();
    } catch (e) { console.error(e); }
  };

  const saveBud = async () => {
    if (!userId || !budCat || !budLimit) return;
    try {
      const body = { userId, category: budCat, limitAmount: Number(budLimit), period: budPeriod };
      const res = await fetch('/api/finance/budgets', { method: editBudId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editBudId ? { id: editBudId, ...body } : body) });
      if (res.ok) { const d = await res.json(); editBudId ? updateBudget(editBudId, d) : addBudget(d); }
      setDlgBudget(false); resetBud();
    } catch (e) { console.error(e); }
  };

  const saveGoal = async () => {
    if (!userId || !goTitle || !goTarget) return;
    try {
      const body = { userId, title: goTitle, targetAmount: Number(goTarget), savedAmount: Number(goSaved) || 0, deadline: goDeadline, icon: goIcon };
      const res = await fetch('/api/finance/goals', { method: editGoId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editGoId ? { id: editGoId, ...body } : body) });
      if (res.ok) { const d = await res.json(); editGoId ? updateGoal(editGoId, d) : addGoal(d); }
      setDlgGoal(false); resetGo();
    } catch (e) { console.error(e); }
  };

  const addSavings = async () => {
    if (!dlgSavings || !userId || !savAmt) return;
    const newSaved = dlgSavings.savedAmount + Number(savAmt);
    try {
      const res = await fetch('/api/finance/goals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: dlgSavings.id, userId, savedAmount: newSaved }) });
      if (res.ok) updateGoal(dlgSavings.id, { savedAmount: newSaved });
      setDlgSavings(null); setSavAmt('');
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!dlgDelete) return;
    const ep = dlgDelete.type === 'record' ? 'records' : dlgDelete.type === 'budget' ? 'budgets' : 'goals';
    try {
      const res = await fetch(`/api/finance/${ep}?id=${dlgDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        if (dlgDelete.type === 'record') removeRecord(dlgDelete.id);
        else if (dlgDelete.type === 'budget') removeBudget(dlgDelete.id);
        else removeGoal(dlgDelete.id);
      }
    } catch (e) { console.error(e); }
    setDlgDelete(null);
  };

  /* ── Render ───────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50/30 dark:from-emerald-950/40 dark:via-background dark:to-emerald-950/20">
      <header className="sticky top-0 z-20 glass">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={goBack} className="flex h-9 w-9 items-center justify-center rounded-full nm-raised hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </motion.button>
          <div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-500" /><h1 className="text-lg font-bold tracking-tight">{t('finance.title')}</h1></div>
        </div>
      </header>

      <div className="flex flex-col pb-24">
        {/* ── Overview ──────────────────────────────── */}
        {loading ? (
          <div className="mx-4 mt-4 space-y-3"><Skeleton className="h-24 w-full rounded-xl" /><div className="flex gap-3"><Skeleton className="h-16 flex-1 rounded-xl" /><Skeleton className="h-16 flex-1 rounded-xl" /></div></div>
        ) : (
          <motion.section variants={stagger} initial="hidden" animate="visible" className="px-4 mt-4">
            <motion.div variants={fadeUp} className="rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80 p-4">
              <p className="text-xs text-muted-foreground mb-1">{t('finance.overview')}</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatRupiah(balance)}</p>
            </motion.div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {[
                { label: t('finance.income'), val: monthlyIn, icon: ArrowUpRight, bg: 'bg-emerald-50 dark:bg-emerald-500/10', cls: 'text-emerald-600 dark:text-emerald-400' },
                { label: t('finance.expense'), val: monthlyOut, icon: ArrowDownRight, bg: 'bg-rose-50 dark:bg-rose-500/10', cls: 'text-rose-600 dark:text-rose-400' },
              ].map((s) => (
                <motion.div key={s.label} variants={fadeUp} className="rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80 p-3 flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.bg}`}><s.icon className={`h-4 w-4 ${s.cls}`} /></div>
                  <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p><p className={`text-sm font-bold ${s.cls}`}>{formatRupiah(s.val)}</p></div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Tab Bar ────────────────────────────────── */}
        <div className="mx-4 mt-4">
          <div className="flex rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80 p-1">
            {(['records', 'budgets', 'goals'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${activeTab === tab ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {tab === 'records' ? t('finance.records') : tab === 'budgets' ? t('finance.budgets') : t('finance.goals')}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ───────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="px-4 mt-4">
            {activeTab === 'records' && <RecordsSection grouped={grouped} loading={loading} onAdd={() => { resetRec(); setDlgRecord(true); }} onEdit={openEditRec} onDelete={(id) => setDlgDelete({ type: 'record', id })} />}
            {activeTab === 'budgets' && <BudgetsSection budgets={budgetsWithSpent} loading={loading} onAdd={() => { resetBud(); setDlgBudget(true); }} onEdit={openEditBud} onDelete={(id) => setDlgDelete({ type: 'budget', id })} />}
            {activeTab === 'goals' && <GoalsSection goals={goals} loading={loading} onAdd={() => { resetGo(); setDlgGoal(true); }} onEdit={openEditGo} onDelete={(id) => setDlgDelete({ type: 'goal', id })} onAddSavings={(g) => { setDlgSavings(g); setSavAmt(''); }} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Dialogs ──────────────────────────────────── */}
      <RecordFormDialog open={dlgRecord} onClose={() => { setDlgRecord(false); resetRec(); }} recType={recType} setRecType={setRecType} recAmt={recAmt} setRecAmt={setRecAmt} recCat={recCat} setRecCat={setRecCat} recDesc={recDesc} setRecDesc={setRecDesc} recDate={recDate} setRecDate={setRecDate} isEdit={!!editRecId} onSave={saveRec} />
      <BudgetFormDialog open={dlgBudget} onClose={() => { setDlgBudget(false); resetBud(); }} cat={budCat} setCat={setBudCat} limit={budLimit} setLimit={setBudLimit} period={budPeriod} setPeriod={setBudPeriod} isEdit={!!editBudId} onSave={saveBud} />
      <GoalFormDialog open={dlgGoal} onClose={() => { setDlgGoal(false); resetGo(); }} title={goTitle} setTitle={setGoTitle} target={goTarget} setTarget={setGoTarget} saved={goSaved} setSaved={setGoSaved} deadline={goDeadline} setDeadline={setGoDeadline} icon={goIcon} setIcon={setGoIcon} isEdit={!!editGoId} onSave={saveGoal} />

      <Dialog open={!!dlgSavings} onOpenChange={() => { setDlgSavings(null); setSavAmt(''); }}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><PiggyBank className="h-5 w-5 text-emerald-500" />{t('finance.addSavings')}</DialogTitle>
            <DialogDescription>{dlgSavings?.title}</DialogDescription>
          </DialogHeader>
          <div><label className="text-xs font-medium text-muted-foreground">{t('finance.amount')}</label><Input type="number" value={savAmt} onChange={(e) => setSavAmt(e.target.value)} placeholder="50000" className="mt-1" /></div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDlgSavings(null); setSavAmt(''); }} className="flex-1 rounded-full">Batal</Button>
            <Button onClick={addSavings} className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700" disabled={!savAmt || Number(savAmt) <= 0}>{t('finance.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!dlgDelete} onOpenChange={() => setDlgDelete(null)}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-rose-500" />{t('finance.delete')}</DialogTitle>
            <DialogDescription>{t('finance.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDlgDelete(null)} className="flex-1 rounded-full">Batal</Button>
            <Button variant="destructive" onClick={handleDelete} className="flex-1 rounded-full">{t('finance.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default FinancialPlannerPage;

/* ═══════════════════════════════════════════════════════════════════
   Records Section
   ═══════════════════════════════════════════════════════════════════ */

function RecordsSection({ grouped, loading, onAdd, onEdit, onDelete }: {
  grouped: [string, FinanceRecord[]][]; loading: boolean; onAdd: () => void; onEdit: (r: FinanceRecord) => void; onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  if (loading) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>;
  return (
    <div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onAdd} className="nm-raised rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold">
        <Plus className="h-4 w-4" />{t('finance.addRecord')}
      </motion.button>
      {grouped.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 pt-12 text-center">
          <div className="text-5xl">📝</div><p className="text-sm text-muted-foreground">{t('finance.empty')}</p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="mt-3 space-y-3">
          {grouped.map(([date, items]) => (
            <motion.div key={date} variants={fadeUp}>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" />{new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="space-y-1">{items.map((r) => {
                const m = getCatMeta(r.category); const Ic = m.icon; const inc = r.type === 'income';
                return (
                  <motion.div key={r.id} layout className="group flex items-center gap-3 rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80 px-3 py-2.5 hover:bg-muted/30">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60"><Ic className={`h-4 w-4 ${m.c}`} /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{r.description || r.category}</p><Badge variant="secondary" className="mt-0.5 text-[10px]">{r.category}</Badge></div>
                    <div className="text-right shrink-0"><p className={`text-sm font-bold ${inc ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{inc ? '+' : '-'}{formatRupiah(r.amount)}</p></div>
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
                      <motion.button whileTap={{ scale: 0.8 }} onClick={() => onEdit(r)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"><Edit3 className="h-3 w-3 text-muted-foreground" /></motion.button>
                      <motion.button whileTap={{ scale: 0.8 }} onClick={() => onDelete(r.id)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"><Trash2 className="h-3 w-3 text-muted-foreground" /></motion.button>
                    </div>
                  </motion.div>
                );
              })}</div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Budgets Section
   ═══════════════════════════════════════════════════════════════════ */

function BudgetsSection({ budgets, loading, onAdd, onEdit, onDelete }: {
  budgets: (FinanceBudget & { spent: number })[]; loading: boolean; onAdd: () => void; onEdit: (b: FinanceBudget) => void; onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  if (loading) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>;
  return (
    <div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onAdd} className="nm-raised rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold">
        <Plus className="h-4 w-4" />{t('finance.addBudget')}
      </motion.button>
      {budgets.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 pt-12 text-center">
          <div className="text-5xl">📊</div><p className="text-sm text-muted-foreground">{t('finance.empty')}</p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="mt-3 space-y-3">
          {budgets.map((b) => {
            const pct = b.limitAmount > 0 ? Math.min((b.spent / b.limitAmount) * 100, 100) : 0;
            const rem = b.limitAmount - b.spent;
            const barCls = pct < 50 ? 'bg-emerald-500' : pct < 80 ? 'bg-amber-500' : 'bg-rose-500';
            const txtCls = pct < 50 ? 'text-emerald-600 dark:text-emerald-400' : pct < 80 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';
            const m = getCatMeta(b.category); const Ic = m.icon;
            return (
              <motion.div key={b.id} variants={fadeUp} className="group rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60"><Ic className={`h-5 w-5 ${m.c}`} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><p className="text-sm font-semibold">{b.category}</p><Badge variant="secondary" className="text-[10px]">{b.period === 'weekly' ? t('finance.weekly') : b.period === 'monthly' ? t('finance.monthly') : t('finance.yearly')}</Badge></div>
                    <p className="text-xs text-muted-foreground"><span className={txtCls}>{formatRupiah(b.spent)}</span> / {formatRupiah(b.limitAmount)}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => onEdit(b)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted"><Edit3 className="h-3 w-3 text-muted-foreground" /></motion.button>
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => onDelete(b.id)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"><Trash2 className="h-3 w-3 text-muted-foreground" /></motion.button>
                  </div>
                </div>
                <div className="mt-3"><Progress value={pct} className={`h-2 [&>[data-slot=progress-indicator]]:${barCls}`} /></div>
                <p className="mt-1.5 text-xs"><span className={txtCls}>{t('finance.remaining')}: {formatRupiah(rem)}</span><span className="ml-2 text-muted-foreground">({pct.toFixed(0)}%)</span></p>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Goals Section
   ═══════════════════════════════════════════════════════════════════ */

function GoalsSection({ goals, loading, onAdd, onEdit, onDelete, onAddSavings }: {
  goals: FinanceGoal[]; loading: boolean; onAdd: () => void; onEdit: (g: FinanceGoal) => void; onDelete: (id: string) => void; onAddSavings: (g: FinanceGoal) => void;
}) {
  const { t } = useTranslation();
  if (loading) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>;
  return (
    <div>
      <motion.button whileTap={{ scale: 0.97 }} onClick={onAdd} className="nm-raised rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold">
        <Plus className="h-4 w-4" />{t('finance.addGoal')}
      </motion.button>
      {goals.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 pt-12 text-center">
          <div className="text-5xl">🎯</div><p className="text-sm text-muted-foreground">{t('finance.empty')}</p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="mt-3 space-y-3">
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min((g.savedAmount / g.targetAmount) * 100, 100) : 0;
            return (
              <motion.div key={g.id} variants={fadeUp} className="group rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-2xl">{g.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><p className="text-sm font-semibold truncate">{g.title}</p>
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
                        <motion.button whileTap={{ scale: 0.8 }} onClick={() => onEdit(g)} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted"><Edit3 className="h-3 w-3 text-muted-foreground" /></motion.button>
                        <motion.button whileTap={{ scale: 0.8 }} onClick={() => onDelete(g.id)} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"><Trash2 className="h-3 w-3 text-muted-foreground" /></motion.button>
                      </div>
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{formatRupiah(g.savedAmount)} / {formatRupiah(g.targetAmount)}</p>
                    {g.deadline && <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><CalendarDays className="h-3 w-3" />{new Date(g.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">{pct.toFixed(0)}%</Badge>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => onAddSavings(g)} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20">
                      <PiggyBank className="h-3 w-3" />{t('finance.addSavings')}
                    </motion.button>
                  </div>
                </div>
                <div className="mt-3"><Progress value={pct} className="h-2 [&>[data-slot=progress-indicator]]:bg-emerald-500" /></div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Form Dialogs
   ═══════════════════════════════════════════════════════════════════ */

function RecordFormDialog({ open, onClose, recType, setRecType, recAmt, setRecAmt, recCat, setRecCat, recDesc, setRecDesc, recDate, setRecDate, isEdit, onSave }: {
  open: boolean; onClose: () => void; recType: 'income' | 'expense'; setRecType: (v: 'income' | 'expense') => void;
  recAmt: string; setRecAmt: (v: string) => void; recCat: string; setRecCat: (v: string) => void;
  recDesc: string; setRecDesc: (v: string) => void; recDate: string; setRecDate: (v: string) => void;
  isEdit: boolean; onSave: () => void;
}) {
  const { t } = useTranslation();
  const cats = recType === 'income' ? INCOME_CATS : EXPENSE_CATS;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-emerald-500" />{isEdit ? t('finance.editRecord') : t('finance.addRecord')}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
            <span className="text-sm font-medium">{t('finance.type')}</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${recType === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>{t('finance.income')}</span>
              <Switch checked={recType === 'expense'} onCheckedChange={(c) => setRecType(c ? 'expense' : 'income')} />
              <span className={`text-xs font-medium ${recType === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'}`}>{t('finance.expense')}</span>
            </div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground">{t('finance.amount')}</label><Input type="number" value={recAmt} onChange={(e) => setRecAmt(e.target.value)} placeholder="50000" className="mt-1" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">{t('finance.category')}</label><Select value={recCat} onValueChange={setRecCat}><SelectTrigger className="mt-1"><SelectValue placeholder={t('finance.category')} /></SelectTrigger><SelectContent>{cats.map((c) => <SelectItem key={c.v} value={c.v}>{c.v}</SelectItem>)}</SelectContent></Select></div>
          <div><label className="text-xs font-medium text-muted-foreground">{t('finance.description')}</label><Input value={recDesc} onChange={(e) => setRecDesc(e.target.value)} placeholder={t('finance.description')} className="mt-1" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">{t('finance.date')}</label><Input type="date" value={recDate} onChange={(e) => setRecDate(e.target.value)} className="mt-1" /></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-full">Batal</Button>
          <Button onClick={onSave} className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700" disabled={!recAmt || !recCat}>{t('finance.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BudgetFormDialog({ open, onClose, cat, setCat, limit, setLimit, period, setPeriod, isEdit, onSave }: {
  open: boolean; onClose: () => void; cat: string; setCat: (v: string) => void; limit: string; setLimit: (v: string) => void;
  period: 'weekly' | 'monthly' | 'yearly'; setPeriod: (v: 'weekly' | 'monthly' | 'yearly') => void; isEdit: boolean; onSave: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-emerald-500" />{isEdit ? t('finance.editRecord') : t('finance.addBudget')}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-xs font-medium text-muted-foreground">{t('finance.category')}</label><Select value={cat} onValueChange={setCat}><SelectTrigger className="mt-1"><SelectValue placeholder={t('finance.category')} /></SelectTrigger><SelectContent>{EXPENSE_CATS.map((c) => <SelectItem key={c.v} value={c.v}>{c.v}</SelectItem>)}</SelectContent></Select></div>
          <div><label className="text-xs font-medium text-muted-foreground">{t('finance.limitAmount')}</label><Input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="500000" className="mt-1" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">{t('finance.period')}</label><Select value={period} onValueChange={(v) => setPeriod(v as 'weekly' | 'monthly' | 'yearly')}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weekly">{t('finance.weekly')}</SelectItem><SelectItem value="monthly">{t('finance.monthly')}</SelectItem><SelectItem value="yearly">{t('finance.yearly')}</SelectItem></SelectContent></Select></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-full">Batal</Button>
          <Button onClick={onSave} className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700" disabled={!cat || !limit}>{t('finance.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GoalFormDialog({ open, onClose, title, setTitle, target, setTarget, saved, setSaved, deadline, setDeadline, icon, setIcon, isEdit, onSave }: {
  open: boolean; onClose: () => void; title: string; setTitle: (v: string) => void; target: string; setTarget: (v: string) => void;
  saved: string; setSaved: (v: string) => void; deadline: string; setDeadline: (v: string) => void;
  icon: string; setIcon: (v: string) => void; isEdit: boolean; onSave: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-emerald-500" />{isEdit ? t('finance.editRecord') : t('finance.addGoal')}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-xs font-medium text-muted-foreground">{t('finance.progress')}</label><div className="flex gap-2 mt-1 flex-wrap">{GOAL_ICONS.map((e) => (
            <motion.button key={e} whileTap={{ scale: 0.9 }} onClick={() => setIcon(e)} className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-all ${icon === e ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'bg-muted/50 hover:bg-muted'}`}>{e}</motion.button>
          ))}</div></div>
          <div><label className="text-xs font-medium text-muted-foreground">{t('finance.goalTitle')}</label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Liburan Bali" className="mt-1" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">{t('finance.targetAmount')}</label><Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="5000000" className="mt-1" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">{t('finance.savedAmount')}</label><Input type="number" value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0" className="mt-1" /></div>
          <div><label className="text-xs font-medium text-muted-foreground">{t('finance.deadline')}</label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1" /></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-full">Batal</Button>
          <Button onClick={onSave} className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700" disabled={!title || !target}>{t('finance.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
