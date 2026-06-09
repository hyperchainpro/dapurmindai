'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Settings,
  LogOut,
  Save,
  RefreshCw,
  Loader2,
  Globe,
  Shield,
  Bot,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/hooks/useAppState';
import type { SystemSetting } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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

/* ── Group icons ─────────────────────────────────────────────── */

const GROUP_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  general: { label: 'Umum', icon: <Globe className="h-4 w-4" />, color: 'from-emerald-500 to-teal-500' },
  security: { label: 'Keamanan', icon: <Shield className="h-4 w-4" />, color: 'from-red-500 to-orange-500' },
  ai: { label: 'AI', icon: <Bot className="h-4 w-4" />, color: 'from-violet-500 to-purple-500' },
  notification: { label: 'Notifikasi', icon: <Bell className="h-4 w-4" />, color: 'from-amber-500 to-yellow-500' },
};

/* ── Setting row labels ───────────────────────────────────────── */

const SETTING_LABELS: Record<string, string> = {
  app_name: 'Nama Aplikasi',
  app_url: 'URL Aplikasi',
  maintenance_mode: 'Mode Pemeliharaan',
  max_login_attempts: 'Maks Percobaan Login',
  session_timeout: 'Sesi Timeout (menit)',
  password_min_length: 'Panjang Min. Password',
  default_ai_provider: 'Provider AI Default',
  default_ai_model: 'Model AI Default',
  ai_max_tokens: 'Maks Token AI',
  ai_temperature: 'Temperatur AI',
  push_enabled: 'Notifikasi Push Aktif',
  email_enabled: 'Notifikasi Email Aktif',
  email_smtp_host: 'SMTP Host',
  email_smtp_port: 'SMTP Port',
  email_from_address: 'Email Pengirim',
};

/* ── Main Component ──────────────────────────────────────────── */

export function AdminSettings() {
  const setScreen = useAppStore((s) => s.setScreen);
  const goBack = useAppStore((s) => s.goBack);

  // Data
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local edits
  const [edits, setEdits] = useState<Record<string, string>>({});

  // ── Fetch settings ──
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const json = await res.json();
      if (!res.ok) throw new Error('Gagal memuat');
      setSettings(json.data ?? []);
      // Initialize edits
      const initial: Record<string, string> = {};
      for (const s of (json.data ?? [])) {
        initial[s.key] = s.value;
      }
      setEdits(initial);
    } catch {
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ── Update edit ──
  const updateEdit = (key: string, value: string) => {
    setEdits(prev => ({ ...prev, [key]: value }));
  };

  // ── Save group ──
  const saveGroup = async (group: string) => {
    setSaving(true);
    try {
      const groupSettings = settings.filter(s => s.group === group);
      const updatePayload: Record<string, string> = {};
      for (const s of groupSettings) {
        if (edits[s.key] !== undefined) {
          updatePayload[s.key] = edits[s.key];
        }
      }
      if (Object.keys(updatePayload).length === 0) {
        toast.info('Tidak ada perubahan');
        setSaving(false);
        return;
      }
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatePayload }),
      });
      if (!res.ok) throw new Error('Gagal menyimpan');
      toast.success('Pengaturan disimpan');
      fetchSettings();
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  // ── Group settings ──
  const groups = ['general', 'security', 'ai', 'notification'];
  const getGroupSettings = (group: string) => settings.filter(s => s.group === group);

  // ── Render input based on type ──
  const renderInput = (setting: SystemSetting) => {
    const value = edits[setting.key] ?? setting.value;

    // Boolean → switch
    if (setting.type === 'boolean') {
      return (
        <Switch
          checked={value === 'true'}
          onCheckedChange={(v) => updateEdit(setting.key, String(v))}
        />
      );
    }

    // Select for specific keys
    const selectOptions: Record<string, string[]> = {
      default_ai_provider: ['built-in', 'openai', 'groq', 'deepseek', 'anthropic', 'google'],
      default_ai_model: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'claude-3-sonnet', 'claude-3-haiku', 'llama-3.1-70b', 'gemini-pro'],
    };

    if (selectOptions[setting.key]) {
      return (
        <Select value={value} onValueChange={(v) => updateEdit(setting.key, v)}>
          <SelectTrigger className="w-40 rounded-lg text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {selectOptions[setting.key].map((opt) => (
              <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Number
    if (setting.type === 'number') {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => updateEdit(setting.key, e.target.value)}
          className="w-40 rounded-lg text-xs text-right"
        />
      );
    }

    // Default: string input
    return (
      <Input
        value={value}
        onChange={(e) => updateEdit(setting.key, e.target.value)}
        className="w-52 rounded-lg text-xs"
      />
    );
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
                Pengaturan Sistem
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Konfigurasi global DapurMind
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setScreen('admin-analytics')}
                className="flex h-10 w-10 items-center justify-center rounded-xl nm-raised transition-colors hover:bg-accent"
                aria-label="Analitik"
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

        {/* ── Loading ────────────────────────────────────── */}
        {loading && (
          <motion.div variants={fadeUp} className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl nm-raised p-4 space-y-3">
                <Skeleton className="h-5 w-32" />
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-40 rounded-lg" />
                  </div>
                ))}
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Settings Groups ─────────────────────────────── */}
        {!loading && groups.map((group) => {
          const config = GROUP_CONFIG[group] ?? { label: group, icon: <Settings className="h-4 w-4" />, color: 'from-gray-500 to-gray-400' };
          const groupSettings = getGroupSettings(group);
          if (groupSettings.length === 0) return null;

          return (
            <motion.div key={group} variants={fadeUp} className="mb-5">
              {/* Group Header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${config.color} text-white`}>
                    {config.icon}
                  </div>
                  <h2 className="text-sm font-semibold">{config.label}</h2>
                  <span className="text-[10px] text-muted-foreground">
                    ({groupSettings.length})
                  </span>
                </div>
                <Button
                  size="sm"
                  disabled={saving}
                  onClick={() => saveGroup(group)}
                  className="gap-1 rounded-xl bg-emerald-500 px-3 text-xs text-white hover:bg-emerald-600"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Simpan
                </Button>
              </div>

              {/* Settings Rows */}
              <div className="rounded-xl border border-emerald-200/50 bg-white/80 shadow-sm backdrop-blur-sm overflow-hidden dark:border-emerald-800/50 dark:bg-card/80">
                {groupSettings.map((setting, idx) => (
                  <div
                    key={setting.id}
                    className={`flex items-center justify-between gap-3 p-3 ${idx > 0 ? 'border-t border-border/30' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        {SETTING_LABELS[setting.key] || setting.key}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        {setting.key}
                      </p>
                    </div>
                    {renderInput(setting)}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* ── Empty State ──────────────────────────────── */}
        {!loading && settings.length === 0 && (
          <motion.div
            variants={fadeUp}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <div className="text-6xl">⚙️</div>
            <div>
              <h3 className="text-base font-semibold">Belum ada pengaturan</h3>
              <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">
                Pengaturan sistem akan muncul setelah konfigurasi awal.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Refresh ────────────────────────────────────── */}
        {!loading && settings.length > 0 && (
          <motion.div variants={fadeUp} className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSettings}
              className="gap-1.5 rounded-full text-xs text-muted-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default AdminSettings;
