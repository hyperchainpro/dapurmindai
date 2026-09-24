'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Users,
  ChefHat,
  Trash2,
  Megaphone,
  LogOut,
  Bot,
  Plus,
  Pencil,
  Trash,
  Power,
  Star,
  Activity,
  Eye,
  EyeOff,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Zap,
  Globe,
  BrainCircuit,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { adminFetch } from '@/lib/admin-fetch';

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
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const slideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, y: 40, transition: { duration: 0.25 } },
};

/* ── Types ──────────────────────────────────────────────────── */

interface AiAgent {
  id: string;
  name: string;
  provider: string;
  model: string;
  apiKey?: string;
  apiBaseUrl?: string;
  maxTokens: number;
  usedTokens: number;
  purpose: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  totalRequests: number;
  failedRequests: number;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

type AgentProvider =
  | 'built-in'
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'groq'
  | 'deepseek'
  | 'mistral'
  | 'openrouter';

type AgentPurpose = 'all' | 'chat' | 'meal-plan' | 'zero-waste' | 'affiliate';

/* ── Constants ──────────────────────────────────────────────── */

const PROVIDER_CONFIG: Record<
  AgentProvider,
  { emoji: string; label: string; colorClass: string; bgClass: string }
> = {
  'built-in': {
    emoji: '🤖',
    label: 'Built-in',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/15',
  },
  anthropic: {
    emoji: '🟣',
    label: 'Anthropic / Claude',
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-500/15',
  },
  openai: {
    emoji: '🟢',
    label: 'OpenAI / GPT',
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-500/15',
  },
  google: {
    emoji: '🔵',
    label: 'Google / Gemini',
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/15',
  },
  groq: {
    emoji: '🟠',
    label: 'Groq',
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-500/15',
  },
  deepseek: {
    emoji: '🔴',
    label: 'DeepSeek',
    colorClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-500/15',
  },
  mistral: {
    emoji: '🌐',
    label: 'Mistral',
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    bgClass: 'bg-cyan-500/15',
  },
  openrouter: {
    emoji: '🔄',
    label: 'OpenRouter',
    colorClass: 'text-indigo-600 dark:text-indigo-400',
    bgClass: 'bg-indigo-500/15',
  },
};

const PURPOSE_CONFIG: Record<AgentPurpose, { label: string; colorClass: string; bgClass: string }> = {
  all: { label: 'All', colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-500/15 border-emerald-200 dark:border-emerald-800/40' },
  chat: { label: 'Chat', colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-500/15 border-blue-200 dark:border-blue-800/40' },
  'meal-plan': { label: 'Meal Plan', colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-500/15 border-amber-200 dark:border-amber-800/40' },
  'zero-waste': { label: 'Zero Waste', colorClass: 'text-green-600 dark:text-green-400', bgClass: 'bg-green-500/15 border-green-200 dark:border-green-800/40' },
  affiliate: { label: 'Affiliate', colorClass: 'text-purple-600 dark:text-purple-400', bgClass: 'bg-purple-500/15 border-purple-200 dark:border-purple-800/40' },
};

const PROVIDER_OPTIONS: AgentProvider[] = [
  'built-in',
  'anthropic',
  'openai',
  'google',
  'groq',
  'deepseek',
  'mistral',
  'openrouter',
];

const PURPOSE_OPTIONS: AgentPurpose[] = [
  'all',
  'chat',
  'meal-plan',
  'zero-waste',
  'affiliate',
];

/* ADMIN_KEY removed – use adminFetch() instead */

/* ── Helpers ─────────────────────────────────────────────────── */

function getRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Belum pernah';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 30) return `${diffDay} hari lalu`;
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getSuccessRate(agent: AiAgent): number {
  if (agent.totalRequests === 0) return 100;
  return Math.round(((agent.totalRequests - agent.failedRequests) / agent.totalRequests) * 100);
}

function getTokenPercentage(used: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(100, Math.round((used / max) * 100));
}

function getTokenBarColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-amber-500';
  if (pct >= 40) return 'bg-blue-500';
  return 'bg-emerald-500';
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/* ── Token Progress Bar Component ───────────────────────────── */

interface TokenBarProps {
  used: number;
  max: number;
}

function TokenProgressBar({ used, max }: TokenBarProps) {
  const pct = getTokenPercentage(used, max);
  const barColor = getTokenBarColor(pct);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--nm-text-muted)]">
          Used: {formatTokens(used)} / Max: {formatTokens(max)} tokens
        </span>
        <span className={`text-[10px] font-semibold ${pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-[var(--nm-text)]'}`}>
          {pct}%
        </span>
      </div>
      <div className="nm-pressed h-2.5 w-full rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/* ── Agent Card Component ──────────────────────────────────── */

interface AgentCardProps {
  agent: AiAgent;
  onSetDefault: (agent: AiAgent) => void;
  onToggleActive: (agent: AiAgent) => void;
  onEdit: (agent: AiAgent) => void;
  onDelete: (agent: AiAgent) => void;
}

function AgentCard({ agent, onSetDefault, onToggleActive, onEdit, onDelete }: AgentCardProps) {
  const provider = PROVIDER_CONFIG[agent.provider as AgentProvider] ?? PROVIDER_CONFIG['built-in'];
  const purpose = PURPOSE_CONFIG[agent.purpose as AgentPurpose] ?? PURPOSE_CONFIG.all;
  const successRate = getSuccessRate(agent);
  const pct = getTokenPercentage(agent.usedTokens, agent.maxTokens);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl nm-raised p-4 mb-3"
    >
      {/* Top row: icon + name + status */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${provider.bgClass}`}
        >
          {provider.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold truncate">{agent.name}</h3>
            {agent.isDefault && (
              <span className="inline-flex items-center gap-0.5 rounded-md nm-badge px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40">
                <Star className="h-2.5 w-2.5 fill-amber-500" />
                Default
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--nm-text-muted)] truncate">
            {provider.label} &middot; {agent.model}
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            {agent.isActive ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-400" />
            )}
          </span>
          <span
            className={`text-[10px] font-semibold ${
              agent.isActive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-[var(--nm-text-muted)]'
            }`}
          >
            {agent.isActive ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
      </div>

      {/* Purpose badge + Stats */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span
          className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold ${purpose.colorClass} ${purpose.bgClass}`}
        >
          {purpose.label}
        </span>
        <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--nm-text-muted)]">
          <Zap className="h-2.5 w-2.5" />
          {agent.totalRequests.toLocaleString()} req
        </span>
        {agent.failedRequests > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-red-500">
            <AlertTriangle className="h-2.5 w-2.5" />
            {agent.failedRequests} failed
          </span>
        )}
        <span
          className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
            successRate >= 95
              ? 'text-emerald-500'
              : successRate >= 80
                ? 'text-amber-500'
                : 'text-red-500'
          }`}
        >
          <Activity className="h-2.5 w-2.5" />
          {successRate}%
        </span>
      </div>

      {/* Token progress bar */}
      <TokenProgressBar used={agent.usedTokens} max={agent.maxTokens} />

      {/* Last used */}
      <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--nm-text-muted)]">
        <Globe className="h-2.5 w-2.5" />
        Terakhir: {getRelativeTime(agent.lastUsedAt)}
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex items-center gap-2 border-t border-[var(--nm-shadow-dark)]/20 pt-3">
        {!agent.isDefault && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onSetDefault(agent)}
            className="flex items-center gap-1 rounded-xl nm-btn px-2.5 py-1.5 text-[10px] font-medium text-[var(--nm-text-muted)] hover:text-amber-500"
            title="Set sebagai default"
          >
            <Star className="h-3 w-3" />
            Default
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onToggleActive(agent)}
          className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[10px] font-medium ${
            agent.isActive ? 'nm-btn text-red-400 hover:text-red-500' : 'nm-btn-primary text-white'
          }`}
          title={agent.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        >
          <Power className="h-3 w-3" />
          {agent.isActive ? 'Nonaktif' : 'Aktif'}
        </motion.button>
        <div className="flex-1" />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onEdit(agent)}
          className="flex h-8 w-8 items-center justify-center rounded-xl nm-btn-icon"
          title="Edit agent"
        >
          <Pencil className="h-3.5 w-3.5" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onDelete(agent)}
          className="flex h-8 w-8 items-center justify-center rounded-xl nm-btn-destructive"
          title="Hapus agent"
        >
          <Trash className="h-3.5 w-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */

export function AdminAiAgents() {
  const setScreen = useAppStore((s) => s.setScreen);

  /* ── Local state ───────────────────────────────────────────── */
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Add/Edit dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editingAgent, setEditingAgent] = useState<AiAgent | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<AgentProvider>('built-in');
  const [formModel, setFormModel] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formApiBaseUrl, setFormApiBaseUrl] = useState('');
  const [formMaxTokens, setFormMaxTokens] = useState(100000);
  const [formPurpose, setFormPurpose] = useState<AgentPurpose>('all');
  const [formDescription, setFormDescription] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<AiAgent | null>(null);

  /* ── Derived data ──────────────────────────────────────────── */
  const activeAgents = agents.filter((a) => a.isActive);
  const defaultAgent = agents.find((a) => a.isDefault);
  const totalTokensUsed = agents.reduce((sum, a) => sum + a.usedTokens, 0);

  /* ── Fetch agents ─────────────────────────────────────────── */
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch('/api/admin/ai-agents');
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Gagal memuat data AI agents');
      }
      const data = await res.json();
      setAgents(data.agents ?? data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents, refreshKey]);

  /* ── Form helpers ─────────────────────────────────────────── */
  const resetForm = useCallback(() => {
    setFormName('');
    setFormProvider('built-in');
    setFormModel('');
    setFormApiKey('');
    setFormApiBaseUrl('');
    setFormMaxTokens(100000);
    setFormPurpose('all');
    setFormDescription('');
    setFormIsDefault(false);
    setShowApiKey(false);
    setEditingAgent(null);
  }, []);

  const openAddDialog = useCallback(() => {
    resetForm();
    setDialogMode('add');
    setShowDialog(true);
  }, [resetForm]);

  const openEditDialog = useCallback((agent: AiAgent) => {
    setEditingAgent(agent);
    setFormName(agent.name);
    setFormProvider(agent.provider as AgentProvider);
    setFormModel(agent.model);
    setFormApiKey('');
    setFormApiBaseUrl(agent.apiBaseUrl ?? '');
    setFormMaxTokens(agent.maxTokens);
    setFormPurpose(agent.purpose as AgentPurpose);
    setFormDescription(agent.description ?? '');
    setFormIsDefault(agent.isDefault);
    setShowApiKey(false);
    setDialogMode('edit');
    setShowDialog(true);
  }, []);

  /* ── API actions ──────────────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    if (!formName.trim() || !formModel.trim()) return;

    try {
      setSaving(true);
      setError(null);

      const body: Record<string, unknown> = {
        name: formName.trim(),
        provider: formProvider,
        model: formModel.trim(),
        maxTokens: formMaxTokens,
        purpose: formPurpose,
        description: formDescription.trim() || undefined,
        isDefault: formIsDefault,
      };

      if (formApiKey.trim()) body.apiKey = formApiKey.trim();
      if (formApiBaseUrl.trim()) body.apiBaseUrl = formApiBaseUrl.trim();

      const url = '/api/admin/ai-agents';
      const method = dialogMode === 'edit' && editingAgent ? 'PUT' : 'POST';

      if (dialogMode === 'edit' && editingAgent) {
        body.id = editingAgent.id;
      }

      const res = await adminFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Gagal ${dialogMode === 'edit' ? 'mengupdate' : 'menambahkan'} agent`);
      }

      setShowDialog(false);
      resetForm();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }, [
    formName,
    formProvider,
    formModel,
    formApiKey,
    formApiBaseUrl,
    formMaxTokens,
    formPurpose,
    formDescription,
    formIsDefault,
    dialogMode,
    editingAgent,
    resetForm,
  ]);

  const handleSetDefault = useCallback(async (agent: AiAgent) => {
    try {
      setSaving(true);
      setError(null);
      const res = await adminFetch('/api/admin/ai-agents', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: agent.id, isDefault: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Gagal mengubah default agent');
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }, []);

  const handleToggleActive = useCallback(async (agent: AiAgent) => {
    try {
      setSaving(true);
      setError(null);
      const res = await adminFetch('/api/admin/ai-agents', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: agent.id, isActive: !agent.isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Gagal mengubah status agent');
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }, []);

  const openDeleteDialog = useCallback((agent: AiAgent) => {
    setDeletingAgent(agent);
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingAgent) return;
    try {
      setDeleting(true);
      setError(null);
      const res = await adminFetch(`/api/admin/ai-agents?id=${encodeURIComponent(deletingAgent.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Gagal menghapus agent');
      }
      setShowDeleteDialog(false);
      setDeletingAgent(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setDeleting(false);
    }
  }, [deletingAgent]);

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
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400 leading-tight">
                AI Agents
              </h1>
              <p className="mt-0.5 text-xs text-[var(--nm-text-muted)]">
                Kelola konfigurasi AI agent
              </p>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setScreen('admin-dashboard')}
                className="flex h-10 w-10 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
                aria-label="Dashboard admin"
              >
                <BarChart3 className="h-5 w-5 text-emerald-500" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setScreen('admin-users')}
                className="flex h-10 w-10 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
                aria-label="Manajemen user"
              >
                <Users className="h-5 w-5 text-blue-500" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setScreen('admin-recipes')}
                className="flex h-10 w-10 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
                aria-label="Manajemen resep"
              >
                <ChefHat className="h-5 w-5 text-amber-500" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setScreen('admin-trash')}
                className="flex h-10 w-10 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
                aria-label="Tempat sampah"
              >
                <Trash2 className="h-5 w-5 text-red-400" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setScreen('admin-ads')}
                className="flex h-10 w-10 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
                aria-label="Manajemen iklan"
              >
                <Megaphone className="h-5 w-5 text-amber-500" />
              </motion.button>
              {/* Current page button - highlighted */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setScreen('admin-ai-agents')}
                className="flex h-10 w-10 items-center justify-center rounded-xl nm-accent"
                aria-label="AI Agents"
              >
                <BrainCircuit className="h-5 w-5 text-white" />
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
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Usage Stats Section ────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-5">
          <div className="rounded-2xl nm-raised p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold">Ringkasan Agent</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl nm-pressed p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4 text-[var(--nm-text-muted)]" />
                  <span className="text-[10px] text-[var(--nm-text-muted)]">Total Agent</span>
                </div>
                <p className="text-xl font-bold">{agents.length}</p>
              </div>
              <div className="rounded-xl nm-pressed p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-emerald-500" />
                  <span className="text-[10px] text-[var(--nm-text-muted)]">Agent Aktif</span>
                </div>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {activeAgents.length}
                </p>
              </div>
              <div className="rounded-xl nm-pressed p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span className="text-[10px] text-[var(--nm-text-muted)]">Total Tokens</span>
                </div>
                <p className="text-xl font-bold">{formatTokens(totalTokensUsed)}</p>
              </div>
              <div className="rounded-xl nm-pressed p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] text-[var(--nm-text-muted)]">Default Agent</span>
                </div>
                <p className="text-sm font-bold truncate">
                  {defaultAgent ? defaultAgent.name : '-'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Loading State ──────────────────────────────────── */}
        {loading && (
          <motion.div variants={fadeUp} className="space-y-3 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl nm-raised p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-11 w-11 rounded-xl nm-pressed animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded-lg nm-pressed animate-pulse" />
                    <div className="h-3 w-24 rounded-lg nm-pressed animate-pulse" />
                  </div>
                  <div className="h-6 w-14 rounded-lg nm-pressed animate-pulse" />
                </div>
                <div className="h-2.5 w-full rounded-full nm-pressed animate-pulse" />
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Agent List Header + Add Button ─────────────────── */}
        {!loading && (
          <motion.div variants={fadeUp} className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-semibold">Daftar Agent</h2>
              <span className="inline-flex items-center justify-center rounded-md nm-badge px-1.5 py-0.5 text-[10px] font-bold">
                {agents.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="flex items-center gap-1 text-xs text-[var(--nm-text-muted)] hover:text-[var(--nm-text)] transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Segarkan</span>
              </button>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={openAddDialog}
                className="flex items-center gap-1.5 rounded-xl nm-btn-primary px-3 py-1.5 text-xs font-medium text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── Agent List ─────────────────────────────────────── */}
        {!loading && agents.length > 0 && (
          <motion.div variants={fadeUp} className="mb-6">
            <AnimatePresence mode="popLayout">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onSetDefault={handleSetDefault}
                  onToggleActive={handleToggleActive}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Empty State ─────────────────────────────────────── */}
        {!loading && agents.length === 0 && (
          <motion.div variants={fadeUp} className="mb-6">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--nm-shadow-dark)]/20 nm-raised p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-base font-semibold">Belum Ada AI Agent</h3>
              <p className="mt-1 text-sm text-[var(--nm-text-muted)] max-w-xs">
                Tambahkan AI agent pertamamu untuk mulai memberikan pengalaman AI yang cerdas kepada pengguna.
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={openAddDialog}
                className="mt-5 flex items-center gap-2 rounded-xl nm-btn-primary px-5 py-2.5 text-sm font-medium text-white"
              >
                <Plus className="h-4 w-4" />
                Tambah Agent Pertama
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── Info Section ────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="rounded-xl nm-raised-sm p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="text-[11px] text-[var(--nm-text-muted)] leading-relaxed">
                <strong className="text-[var(--nm-text)]">Tips:</strong> Pastikan API Key dan Base URL
                sudah benar. Token usage direset setiap bulan. Agent default akan digunakan untuk semua
                percakapan jika tidak ada agent khusus yang dipilih.
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── ADD / EDIT DIALOG ─────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Dialog content */}
            <motion.div
              className="relative z-10 w-full max-w-md max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
              style={{ background: 'var(--nm-bg)' }}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Handle bar (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="h-1.5 w-10 rounded-full bg-[var(--nm-shadow-dark)]" />
              </div>

              {/* Dialog header */}
              <div className="px-5 pb-4 pt-2 sm:pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-white ${
                        dialogMode === 'add'
                          ? 'bg-gradient-to-br from-emerald-500 to-amber-500'
                          : 'bg-gradient-to-br from-amber-500 to-emerald-500'
                      }`}
                    >
                      {dialogMode === 'add' ? (
                        <Plus className="h-4 w-4" />
                      ) : (
                        <Pencil className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold">
                        {dialogMode === 'add' ? 'Tambah AI Agent' : 'Edit AI Agent'}
                      </h3>
                      <p className="text-xs text-[var(--nm-text-muted)]">
                        {dialogMode === 'add'
                          ? 'Konfigurasi agent baru'
                          : editingAgent?.name ?? ''}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowDialog(false);
                      resetForm();
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl nm-btn-icon"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              {/* Scrollable form */}
              <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--nm-text)]">
                    Nama Agent <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: ChefAI Pro"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl nm-input px-4 py-2.5 text-sm"
                  />
                </div>

                {/* Provider dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--nm-text)]">
                    Provider <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formProvider}
                      onChange={(e) => setFormProvider(e.target.value as AgentProvider)}
                      className="w-full appearance-none rounded-xl nm-input px-4 py-2.5 text-sm pr-10"
                    >
                      {PROVIDER_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {PROVIDER_CONFIG[p].emoji} {PROVIDER_CONFIG[p].label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--nm-text-muted)] pointer-events-none" />
                  </div>
                </div>

                {/* Model name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--nm-text)]">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: claude-3-5-sonnet-20241022"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full rounded-xl nm-input px-4 py-2.5 text-sm font-mono"
                  />
                </div>

                {/* API Key */}
                {formProvider !== 'built-in' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--nm-text)]">
                      API Key{' '}
                      <span className="font-normal text-[var(--nm-text-muted)]">
                        {dialogMode === 'edit' ? '(kosongkan jika tidak ingin diubah)' : '(opsional)'}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="sk-xxxxxxxxxxxxxxxx"
                        value={formApiKey}
                        onChange={(e) => setFormApiKey(e.target.value)}
                        className="w-full rounded-xl nm-input px-4 py-2.5 text-sm font-mono pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--nm-text-muted)] hover:text-[var(--nm-text)]"
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* API Base URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--nm-text)]">
                    API Base URL{' '}
                    <span className="font-normal text-[var(--nm-text-muted)]">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://api.openai.com/v1"
                    value={formApiBaseUrl}
                    onChange={(e) => setFormApiBaseUrl(e.target.value)}
                    className="w-full rounded-xl nm-input px-4 py-2.5 text-sm font-mono"
                  />
                </div>

                {/* Max Tokens */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--nm-text)]">
                    Max Tokens <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={formMaxTokens}
                    onChange={(e) => setFormMaxTokens(Number(e.target.value))}
                    className="w-full rounded-xl nm-input px-4 py-2.5 text-sm"
                  />
                  <p className="text-[10px] text-[var(--nm-text-muted)]">
                    Batas maksimal token per bulan (min. 1,000)
                  </p>
                </div>

                {/* Purpose dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--nm-text)]">
                    Purpose <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formPurpose}
                      onChange={(e) => setFormPurpose(e.target.value as AgentPurpose)}
                      className="w-full appearance-none rounded-xl nm-input px-4 py-2.5 text-sm pr-10"
                    >
                      {PURPOSE_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {PURPOSE_CONFIG[p].label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--nm-text-muted)] pointer-events-none" />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--nm-text)]">
                    Deskripsi{' '}
                    <span className="font-normal text-[var(--nm-text-muted)]">(opsional)</span>
                  </label>
                  <textarea
                    placeholder="Deskripsi singkat tentang agent ini..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl nm-input px-4 py-2.5 text-sm resize-none"
                  />
                </div>

                {/* Set as Default toggle */}
                <div className="flex items-center justify-between rounded-xl nm-raised-sm p-4">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-semibold">Set sebagai Default</p>
                      <p className="text-[11px] text-[var(--nm-text-muted)]">
                        Agent ini akan digunakan untuk semua percakapan
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsDefault(!formIsDefault)}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-300 ${
                      formIsDefault ? 'nm-toggle-active' : 'nm-toggle'
                    }`}
                  >
                    <motion.span
                      className="inline-block h-5 w-5 rounded-full bg-white shadow-md"
                      animate={{ x: formIsDefault ? 20 : 4 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

              {/* Dialog footer */}
              <div className="px-5 pb-5 pt-2 sm:pt-3">
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowDialog(false);
                      resetForm();
                    }}
                    className="flex-1 rounded-xl nm-btn px-4 py-2.5 text-sm font-medium"
                  >
                    Batal
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={!formName.trim() || !formModel.trim() || saving}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl nm-btn-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : dialogMode === 'add' ? (
                      <Plus className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {saving
                      ? 'Menyimpan...'
                      : dialogMode === 'add'
                        ? 'Tambah Agent'
                        : 'Simpan Perubahan'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── DELETE CONFIRMATION DIALOG ────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDeleteDialog && deletingAgent && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingAgent(null);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="relative z-10 w-full max-w-sm rounded-2xl p-6"
              style={{ background: 'var(--nm-bg)' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 mb-4">
                  <Trash className="h-7 w-7 text-red-500" />
                </div>
                <h3 className="text-base font-bold mb-1">Hapus Agent?</h3>
                <p className="text-sm text-[var(--nm-text-muted)] mb-1">
                  Apakah kamu yakin ingin menghapus agent:
                </p>
                <p className="text-sm font-bold text-red-500 mb-4">
                  &quot;{deletingAgent.name}&quot;
                </p>
                <p className="text-xs text-[var(--nm-text-muted)] mb-5">
                  Tindakan ini tidak dapat dibatalkan. Semua konfigurasi dan statistik akan dihapus
                  secara permanen.
                </p>
                <div className="flex gap-3 w-full">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeletingAgent(null);
                    }}
                    className="flex-1 rounded-xl nm-btn px-4 py-2.5 text-sm font-medium"
                  >
                    Batal
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl nm-btn-destructive px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {deleting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                    {deleting ? 'Menghapus...' : 'Hapus'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminAiAgents;
