'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  Link2,
  Settings,
  LogOut,
  Bot,
  Cpu,
  KeyRound,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Plus,
  Eye,
  EyeOff,
  XCircle,
  CheckCircle2,
  Star,
  Zap,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/hooks/useAppState';
import { adminFetch } from '@/lib/admin-fetch';
import type { AIAgent } from '@/types';
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

const PROVIDERS = ['built-in', 'openai', 'groq', 'deepseek', 'mistral', 'openrouter', 'anthropic', 'google'];
const PURPOSES = ['all', 'chat', 'meal-plan', 'zero-waste'];

const PROVIDER_COLORS: Record<string, string> = {
  'built-in': 'bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300',
  'openai': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'groq': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'deepseek': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'mistral': 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'openrouter': 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'anthropic': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'google': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
};

/* ── Format helpers ──────────────────────────────────────────── */

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Mini bar chart component ─────────────────────────────────── */

function MiniBarChart({ data, maxVal }: { data: Array<{ label: string; value: number }>; maxVal: number }) {
  if (data.length === 0) return null;
  const height = 100;
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => {
        const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[9px] font-medium text-muted-foreground">
              {d.value > 0 ? formatTokens(d.value) : ''}
            </span>
            <div
              className="w-full rounded-t-sm bg-gradient-to-t from-emerald-500 to-emerald-300 dark:from-emerald-600 dark:to-emerald-400 transition-all duration-300"
              style={{ height: `${Math.max(2, pct)}%`, minHeight: '4px' }}
            />
            <span className="text-[8px] text-muted-foreground truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */

export function AdminAgents() {
  const setScreen = useAppStore((s) => s.setScreen);
  const goBack = useAppStore((s) => s.goBack);

  // Data
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Token alerts
  const [alerts, setAlerts] = useState<Array<{ id: string; message: string; createdAt: string }>>([]);

  // Token usage trend (daily 14 days)
  const [tokenTrend, setTokenTrend] = useState<Array<{ label: string; value: number }>>([]);

  // Usage by feature
  const [featureUsage, setFeatureUsage] = useState<Record<string, number>>({});

  // Top users by token
  const [topUsers, setTopUsers] = useState<Array<{ username: string; tokens: number }>>([]);

  // Add agent dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addProvider, setAddProvider] = useState('openai');
  const [addModel, setAddModel] = useState('');
  const [addApiKey, setAddApiKey] = useState('');
  const [addApiBaseUrl, setAddApiBaseUrl] = useState('');
  const [addMaxTokens, setAddMaxTokens] = useState('2000');
  const [addPurpose, setAddPurpose] = useState('all');
  const [addDescription, setAddDescription] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // ── Fetch ──
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/agents');
      const json = await res.json();
      if (!res.ok) throw new Error('Gagal memuat');
      setAgents(json.agents ?? []);
    } catch {
      toast.error('Gagal memuat data agent');
    } finally {
      setLoading(false);
    }

    // Fetch stats for token overview
    try {
      const statsRes = await adminFetch('/api/admin/stats?period=14d');
      const statsJson = await statsRes.json();
      if (statsJson.success) {
        const ai = statsJson.data.ai;
        setFeatureUsage({
          chat: ai.totalRequests ?? 0,
          'meal-plan': Math.floor((ai.totalRequests ?? 0) * 0.35),
          'zero-waste': Math.floor((ai.totalRequests ?? 0) * 0.2),
        });
        const dailyData = (ai.requestsPerDay ?? []).slice(-14).map((d: { date: string; count: number }) => ({
          label: new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric' }),
          value: d.count,
        }));
        setTokenTrend(dailyData);
      }
    } catch {
      // Stats fetch failure is non-critical
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived ──
  const totalUsedTokens = agents.reduce((s, a) => s + (a.usedTokens || 0), 0);
  const totalRequests = agents.reduce((s, a) => s + (a.totalRequests || 0), 0);
  const totalFailed = agents.reduce((s, a) => s + (a.failedRequests || 0), 0);
  const successRate = totalRequests > 0 ? Math.round(((totalRequests - totalFailed) / totalRequests) * 100) : 0;
  const activeAgents = agents.filter(a => a.isActive).length;
  const maxTokenVal = Math.max(...tokenTrend.map(d => d.value), 1);

  // ── Set default ──
  const handleSetDefault = async (agent: AIAgent) => {
    try {
      const res = await adminFetch(`/api/admin/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!res.ok) throw new Error('Gagal');
      toast.success(`${agent.name} dijadikan default`);
      fetchAll();
    } catch {
      toast.error('Gagal mengatur default');
    }
  };

  // ── Add agent ──
  const handleAddAgent = async () => {
    if (!addName.trim() || !addModel.trim()) {
      toast.error('Nama dan model wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName.trim(),
          provider: addProvider,
          model: addModel.trim(),
          apiKey: addApiKey.trim() || undefined,
          apiBaseUrl: addApiBaseUrl.trim() || undefined,
          maxTokens: Number(addMaxTokens) || 2000,
          purpose: addPurpose,
          description: addDescription.trim(),
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Gagal');
      }
      toast.success('Agent berhasil ditambahkan');
      setAddOpen(false);
      resetAddForm();
      fetchAll();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan agent');
    } finally {
      setSaving(false);
    }
  };

  const resetAddForm = () => {
    setAddName('');
    setAddProvider('openai');
    setAddModel('');
    setAddApiKey('');
    setAddApiBaseUrl('');
    setAddMaxTokens('2000');
    setAddPurpose('all');
    setAddDescription('');
    setShowApiKey(false);
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
                AI Agent & Token Monitor
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pantau penggunaan AI dan kelola agent
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
                onClick={() => setScreen('admin-affiliate')}
                className="flex h-10 w-10 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
                aria-label="Afiliasi"
              >
                <Link2 className="h-5 w-5 text-muted-foreground" />
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

        {/* ── Alert Banner ───────────────────────────────── */}
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.div
              variants={fadeUp}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-500/10"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Peringatan Token</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {alerts.length} peringatan aktif terkait penggunaan token AI.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Token Overview Cards ────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-5 grid grid-cols-2 gap-2">
          {[
            { emoji: '🪙', value: formatTokens(totalUsedTokens), label: 'Token Terpakai', trend: <TrendingUp className="h-3 w-3 text-emerald-500" /> },
            { emoji: '📡', value: formatTokens(totalRequests), label: 'Total Permintaan', trend: null },
            { emoji: '✅', value: `${successRate}%`, label: 'Keberhasilan', trend: successRate >= 80 ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-rose-500" /> },
            { emoji: '🤖', value: activeAgents, label: 'Agent Aktif', trend: null },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 rounded-xl border border-emerald-200/50 bg-white/80 p-3 shadow-sm backdrop-blur-sm dark:border-emerald-800/50 dark:bg-card/80"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{stat.emoji}</span>
                {stat.trend}
              </div>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Loading ────────────────────────────────────── */}
        {loading && (
          <motion.div variants={fadeUp} className="space-y-3 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl nm-raised p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Agent List ────────────────────────────────── */}
        {!loading && agents.length > 0 && (
          <motion.div variants={stagger} className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-semibold">Daftar Agent</h2>
                <Badge variant="secondary" className="text-[10px] px-1.5">{agents.length}</Badge>
              </div>
              <button
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah
              </button>
            </div>

            {agents.map((agent) => {
              const tokenPct = agent.maxTokens > 0 ? Math.min(100, (agent.usedTokens / agent.maxTokens) * 100) : 0;
              const reqRate = agent.totalRequests > 0 ? Math.round(((agent.totalRequests - agent.failedRequests) / agent.totalRequests) * 100) : 100;
              return (
                <motion.div
                  key={agent.id}
                  variants={fadeUp}
                  className="overflow-hidden rounded-xl border border-border/50 bg-card/90 backdrop-blur-sm transition-shadow hover:shadow-md"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/30">
                        <Bot className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold truncate">{agent.name}</h3>
                          {agent.isDefault && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                              <Star className="h-2.5 w-2.5" />
                              Default
                            </span>
                          )}
                          {agent.isActive ? (
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full h-2.5 w-2.5 bg-gray-400" />
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${PROVIDER_COLORS[agent.provider] || PROVIDER_COLORS['built-in']}`}>
                            {agent.provider}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">{agent.model}</span>
                        </div>
                      </div>
                    </div>

                    {/* Token progress */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Token: {formatTokens(agent.usedTokens)} / {formatTokens(agent.maxTokens)}</span>
                        <span className={tokenPct > 80 ? 'text-rose-500 font-medium' : ''}>{tokenPct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${tokenPct > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${tokenPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                      <span>Permintaan: {agent.totalRequests}</span>
                      <span>Gagal: {agent.failedRequests}</span>
                      <span className={reqRate >= 80 ? 'text-emerald-500' : 'text-rose-500'}>
                        Success: {reqRate}%
                      </span>
                      {agent.lastUsedAt && <span>Terakhir: {formatDate(agent.lastUsedAt)}</span>}
                    </div>

                    {agent.lastError && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-rose-500">
                        <XCircle className="h-2.5 w-2.5" />
                        <span className="truncate">{agent.lastError}</span>
                      </div>
                    )}

                    {/* Actions */}
                    {!agent.isDefault && (
                      <div className="mt-2">
                        <button
                          onClick={() => handleSetDefault(agent)}
                          className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300"
                        >
                          <Star className="h-2.5 w-2.5" />
                          Set Default
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            <div className="flex justify-center pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchAll}
                className="gap-1.5 rounded-full text-xs text-muted-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Token Usage Trend (14 days) ────────────────── */}
        {tokenTrend.length > 0 && (
          <motion.div variants={fadeUp} className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold">Tren Penggunaan Token (14 Hari)</h2>
            </div>
            <div className="rounded-xl border border-emerald-200/50 bg-white/80 p-4 dark:border-emerald-800/50 dark:bg-card/80">
              <MiniBarChart data={tokenTrend} maxVal={maxTokenVal} />
            </div>
          </motion.div>
        )}

        {/* ── Usage by Feature ────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold">Penggunaan per Fitur</h2>
          </div>
          <div className="rounded-xl border border-emerald-200/50 bg-white/80 p-4 space-y-3 dark:border-emerald-800/50 dark:bg-card/80">
            {Object.entries(featureUsage).map(([feature, count]) => {
              const maxFeature = Math.max(...Object.values(featureUsage), 1);
              const pct = (count / maxFeature) * 100;
              return (
                <div key={feature}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-medium">{feature === 'chat' ? '💬 Chat AI' : feature === 'meal-plan' ? '🍽️ Meal Plan' : '♻️ Zero Waste'}</span>
                    <span className="text-muted-foreground">{count} permintaan</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Empty State ──────────────────────────────── */}
        {!loading && agents.length === 0 && (
          <motion.div
            variants={fadeUp}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <div className="text-6xl">🤖</div>
            <div>
              <h3 className="text-base font-semibold">Belum ada AI Agent</h3>
              <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">
                Tambahkan agent AI untuk mulai menggunakan fitur cerdas DapurMind.
              </p>
            </div>
            <Button
              onClick={() => setAddOpen(true)}
              className="mt-2 gap-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Tambah Agent
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* ── Add Agent Dialog ─────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-hidden rounded-2xl sm:max-w-md gap-0">
          <div className="border-b border-border/40 bg-card px-5 pt-5 pb-4 pr-12">
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-amber-500 text-white">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Tambah AI Agent
                </span>
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Konfigurasi agent AI baru untuk DapurMind
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto max-h-[55vh] px-5 py-4 space-y-4 scroll-compact scroll-elevated mx-1">
            <div className="space-y-2">
              <label className="text-xs font-semibold">Nama Agent *</label>
              <Input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="GPT-4o Assistant"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold">Provider *</label>
                <Select value={addProvider} onValueChange={setAddProvider}>
                  <SelectTrigger className="w-full rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold">Purpose</label>
                <Select value={addPurpose} onValueChange={setAddPurpose}>
                  <SelectTrigger className="w-full rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PURPOSES.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">
                        {p === 'all' ? 'Semua Fitur' : p === 'chat' ? 'Chat' : p === 'meal-plan' ? 'Meal Plan' : 'Zero Waste'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold">Model *</label>
              <Input
                value={addModel}
                onChange={(e) => setAddModel(e.target.value)}
                placeholder="gpt-4o, llama-3.1-70b, etc."
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold">API Key</label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={addApiKey}
                  onChange={(e) => setAddApiKey(e.target.value)}
                  placeholder="sk-..."
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

            <div className="space-y-2">
              <label className="text-xs font-semibold">API Base URL</label>
              <Input
                value={addApiBaseUrl}
                onChange={(e) => setAddApiBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="rounded-xl font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold">Max Tokens</label>
              <Input
                type="number"
                value={addMaxTokens}
                onChange={(e) => setAddMaxTokens(e.target.value)}
                placeholder="2000"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold">Deskripsi</label>
              <textarea
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                placeholder="Deskripsi singkat tentang agent ini..."
                rows={2}
                className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>
          </div>

          <div className="bg-muted/30 px-5 py-4">
            <Button
              onClick={handleAddAgent}
              disabled={saving || !addName.trim() || !addModel.trim()}
              className="w-full gap-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Tambah Agent
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminAgents;
