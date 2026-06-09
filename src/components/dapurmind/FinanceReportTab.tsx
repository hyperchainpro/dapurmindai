'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, BarChart3,
  PieChart as PieChartIcon, CalendarDays, Activity,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

/* ── Helpers ─────────────────────────────────────── */

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const formatShort = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}Jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}Rb`;
  return String(n);
};

const PIE_COLORS = ['#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#64748b', '#f59e0b'];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

interface MonthlyComparison {
  month: string;
  income: number;
  expense: number;
}

interface DailyTrend {
  date: string;
  amount: number;
  label: string;
}

interface ReportData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalTransactions: number;
  categoryBreakdown: CategoryBreakdown[];
  monthlyComparison: MonthlyComparison[];
  dailyTrend: DailyTrend[];
}

/* ── Component ───────────────────────────────────── */

export function FinanceReportTab({ userId }: { userId: string }) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/finance/report?userId=${userId}&period=${period}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data ?? json);
        }
      } catch (e) {
        console.error(e);
        // Fallback to empty data
        setData({
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          totalTransactions: 0,
          categoryBreakdown: [],
          monthlyComparison: [],
          dailyTrend: [],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, period]);

  const pieData = useMemo(() =>
    (data?.categoryBreakdown ?? []).map((c) => ({ name: c.category, value: c.amount })),
    [data],
  );

  const maxDaily = useMemo(() =>
    Math.max(...(data?.dailyTrend ?? []).map((d) => d.amount), 1),
    [data],
  );

  const maxCat = useMemo(() =>
    Math.max(...(data?.categoryBreakdown ?? []).map((c) => c.amount), 1),
    [data],
  );

  const maxMonthly = useMemo(() =>
    Math.max(...(data?.monthlyComparison ?? []).flatMap((m) => [m.income, m.expense]), 1),
    [data],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((p) => (
            <Skeleton key={p} className="h-8 flex-1 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 pt-12 text-center">
        <div className="text-5xl">📊</div>
        <p className="text-sm text-muted-foreground">Belum ada data untuk ditampilkan</p>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
      {/* ── Period Selector ─────────────────────── */}
      <motion.div variants={fadeUp} className="flex gap-2">
        {(['7d', '30d', '90d'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
              period === p
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white/80 border border-emerald-200/50 text-muted-foreground hover:text-foreground dark:border-emerald-800/50 dark:bg-card/80'
            }`}
          >
            {p === '7d' ? '7 Hari' : p === '30d' ? '30 Hari' : '90 Hari'}
          </button>
        ))}
      </motion.div>

      {/* ── Summary Cards ───────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Pemasukan', val: data.totalIncome, icon: ArrowUpRight, bg: 'bg-emerald-50 dark:bg-emerald-500/10', cls: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Total Pengeluaran', val: data.totalExpense, icon: ArrowDownRight, bg: 'bg-rose-50 dark:bg-rose-500/10', cls: 'text-rose-600 dark:text-rose-400' },
          { label: 'Saldo', val: data.balance, icon: TrendingUp, bg: 'bg-teal-50 dark:bg-teal-500/10', cls: 'text-teal-600 dark:text-teal-400' },
          { label: 'Jumlah Transaksi', val: data.totalTransactions, icon: BarChart3, bg: 'bg-amber-50 dark:bg-amber-500/10', cls: 'text-amber-600 dark:text-amber-400', isCount: true },
        ].map((s) => (
          <motion.div
            key={s.label}
            variants={fadeUp}
            className="rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80 p-3 flex items-center gap-3"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.cls}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{s.label}</p>
              <p className={`text-sm font-bold ${s.cls} truncate`}>
                {s.isCount ? `${s.val} transaksi` : formatRupiah(s.val as number)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Spending by Category - Pie Chart ─────── */}
      {pieData.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <PieChartIcon className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Distribusi Pengeluaran</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-40 h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatRupiah(value)}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 max-h-40 overflow-y-auto">
              {data.categoryBreakdown.map((c, i) => (
                <div key={c.category} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-[11px] text-muted-foreground truncate flex-1">{c.category}</span>
                  <span className="text-[11px] font-semibold">{c.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Spending by Category - Horizontal Bars ─ */}
      {data.categoryBreakdown.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Pengeluaran per Kategori</h3>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {data.categoryBreakdown.map((c, i) => (
              <div key={c.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{c.category}</span>
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">{formatRupiah(c.amount)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(c.amount / maxCat) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.count} transaksi · {c.percentage.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Income vs Expense Monthly Comparison ─── */}
      {data.monthlyComparison.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Pemasukan vs Pengeluaran</h3>
          </div>
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.monthlyComparison} barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={formatShort} tick={{ fontSize: 10 }} width={55} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatRupiah(value), name === 'income' ? 'Pemasukan' : 'Pengeluaran']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* ── Top Kategori Pengeluaran ─────────────── */}
      {data.categoryBreakdown.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80 p-4"
        >
          <h3 className="text-sm font-semibold mb-3">🏆 Top Kategori Pengeluaran</h3>
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {data.categoryBreakdown.slice(0, 5).map((c, i) => {
              const pct = data.totalExpense > 0 ? (c.amount / data.totalExpense) * 100 : 0;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center shrink-0">{medal}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium truncate">{c.category}</span>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0 ml-2">{formatRupiah(c.amount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Tren Pengeluaran Harian (14 hari) ────── */}
      {data.dailyTrend.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80 p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Tren Pengeluaran Harian</h3>
          </div>
          {/* Mini bar chart */}
          <div className="flex items-end gap-1 h-32">
            {data.dailyTrend.map((d, i) => {
              const h = maxDaily > 0 ? (d.amount / maxDaily) * 100 : 0;
              const isToday = i === data.dailyTrend.length - 1;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.4, delay: i * 0.03 }}
                    className={`w-full rounded-t-sm min-h-[2px] ${
                      isToday
                        ? 'bg-emerald-500'
                        : d.amount > 0
                          ? 'bg-emerald-300 dark:bg-emerald-600'
                          : 'bg-muted'
                    }`}
                    title={`${d.label}: ${formatRupiah(d.amount)}`}
                  />
                  <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {pieData.length === 0 && data.monthlyComparison.length === 0 && data.dailyTrend.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 pt-8 text-center"
        >
          <div className="text-5xl">📈</div>
          <p className="text-sm text-muted-foreground">
            Belum ada data transaksi untuk periode ini. Mulai catat transaksi untuk melihat laporan.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default FinanceReportTab;