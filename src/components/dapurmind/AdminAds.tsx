'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, ToggleLeft, ToggleRight, Save, Loader2, X, Code, Globe,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { AdSlot, AD_POSITIONS } from '@/components/dapurmind/AdSlot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface AdItem {
  id: string;
  name: string;
  position: string;
  scriptContent: string;
  platform: string;
  isActive: boolean;
  maxWidth: string;
  createdAt: string;
  updatedAt: string;
}

const PLATFORM_PRESETS = [
  { value: 'google-adsense', label: 'Google AdSense', icon: '🔍', template: '<ins class="adsbygoogle"\n     style="display:block"\n     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"\n     data-ad-slot="XXXXXXXXXX"\n     data-ad-format="auto"\n     data-full-width-responsive="true"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>' },
  { value: 'google-admanager', label: 'Google Ad Manager', icon: '📊', template: '<div id="div-gpt-ad-XXXXXXXXXX-0" style="min-width: 300px; min-height: 250px;"></div>\n<script>\n  googletag.cmd.push(function() {\n    googletag.display("div-gpt-ad-XXXXXXXXXX-0");\n  });\n</script>' },
  { value: 'propellerads', label: 'PropellerAds', icon: '🚀', template: '<!-- PropellerAds -->\n<script>(function(d,z,s){s.src="https://a.magsrv.com/ad-provider.js";s.async=true;s.setAttribute("data-zone",z);d.appendChild(s);})(document,XXXXXX,document.createElement("script"));</script>' },
  { value: 'taboola', label: 'Taboola', icon: '📰', template: '<div id="taboola-below-article-thumbnails"></div>\n<script type="text/javascript">\n  window._taboola = window._taboola || [];\n  _taboola.push({ mode: "thumbnails-a", container: "taboola-below-article-thumbnails", placement: "Below Article Thumbnails", target_type: "mix" });\n</script>' },
  { value: 'adsterra', label: 'Adsterra', icon: '💡', template: '<script type="text/javascript">\n  var ad_idzone = "XXXXXXX",\n      ad_width = "300",\n      ad_height = "250";\n</script>\n<script type="text/javascript" src="https://ads.adsterra.com/adserve/adserve.js"></script>' },
  { value: 'custom', label: 'Custom Script', icon: '⚙️', template: '' },
];

export default function AdminAds() {
  const { setScreen } = useAppStore();
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAd, setEditingAd] = useState<AdItem | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState(AD_POSITIONS[0].value);
  const [formScript, setFormScript] = useState('');
  const [formPlatform, setFormPlatform] = useState('custom');
  const [formMaxWidth, setFormMaxWidth] = useState('100%');

  const fetchAds = useCallback(async () => {
    try {
      const res = await fetch('/api/ads');
      const json = await res.json();
      if (json.success) setAds(json.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const openCreate = () => {
    setEditingAd(null);
    setFormName('');
    setFormPosition(AD_POSITIONS[0].value);
    setFormScript('');
    setFormPlatform('custom');
    setFormMaxWidth('100%');
    setShowDialog(true);
  };

  const openEdit = (ad: AdItem) => {
    setEditingAd(ad);
    setFormName(ad.name);
    setFormPosition(ad.position);
    setFormScript(ad.scriptContent);
    setFormPlatform(ad.platform);
    setFormMaxWidth(ad.maxWidth);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formScript.trim()) return;
    setSaving(true);
    try {
      if (editingAd) {
        await fetch('/api/ads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingAd.id, name: formName, position: formPosition, scriptContent: formScript, platform: formPlatform, maxWidth: formMaxWidth }),
        });
      } else {
        await fetch('/api/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, position: formPosition, scriptContent: formScript, platform: formPlatform, maxWidth: formMaxWidth }),
        });
      }
      setShowDialog(false);
      fetchAds();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/ads/${id}`, { method: 'DELETE' });
      fetchAds();
    } catch {}
  };

  const handleToggle = async (ad: AdItem) => {
    try {
      await fetch('/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ad.id, isActive: !ad.isActive }),
      });
      fetchAds();
    } catch {}
  };

  const applyPreset = (platform: string) => {
    const preset = PLATFORM_PRESETS.find((p) => p.value === platform);
    if (preset) {
      setFormPlatform(platform);
      if (preset.template && !formScript.trim()) {
        setFormScript(preset.template);
      }
    }
  };

  const getPositionLabel = (pos: string) =>
    AD_POSITIONS.find((p) => p.value === pos)?.label || pos;

  return (
    <div className="min-h-screen bg-[var(--nm-bg)]">
      <div className="flex flex-col pb-24">
        {/* Header */}
        <header className="sticky top-0 z-20 glass">
          <div className="flex items-center gap-3 px-4 pb-3 pt-4">
            <button onClick={() => setScreen('admin-dashboard')} className="nm-raised-sm flex h-8 w-8 items-center justify-center rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Manajemen Iklan</h1>
              <p className="text-xs text-muted-foreground">Ad placements & script management</p>
            </div>
            <button onClick={openCreate} className="nm-btn-primary flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white">
              <Plus className="h-4 w-4" />
              Tambah
            </button>
          </div>
        </header>

        {/* Info Banner */}
        <div className="mx-4 mt-3 rounded-xl nm-raised bg-blue-50/80 p-3 dark:bg-blue-900/20">
          <div className="flex items-start gap-2">
            <Globe className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Panduan Pemasangan Iklan</p>
              <p className="mt-0.5 text-[10px] text-blue-600/70 dark:text-blue-400/70">
                Tempel script iklan dari platform mana saja (Google AdSense, Ad Manager, Taboola, dll). Iklan tampil di posisi yang dipilih tanpa mengganggu UX aplikasi.
              </p>
            </div>
          </div>
        </div>

        {/* Available Positions */}
        <div className="px-4 mt-4 mb-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Posisi Tersedia</h2>
        </div>
        <div className="scroll-strip-sm mx-4">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {AD_POSITIONS.map((pos) => {
              const hasAd = ads.some((a) => a.position === pos.value && a.isActive);
              return (
                <div key={pos.value} className="flex shrink-0 items-center gap-1.5 rounded-lg nm-raised-sm px-3 py-1.5">
                  <span className={`h-2 w-2 rounded-full ${hasAd ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                  <span className="text-[10px] font-medium text-foreground whitespace-nowrap">{pos.label.split(': ')[1]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ad List */}
        <div className="px-4 mt-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : ads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Code className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Belum ada iklan</p>
              <button onClick={openCreate} className="nm-btn-primary mt-1 rounded-full px-4 py-2 text-xs font-medium text-white">
                Tambah Iklan Pertama
              </button>
            </div>
          ) : (
            ads.map((ad) => (
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl nm-raised p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold truncate">{ad.name}</h3>
                      <Badge variant={ad.isActive ? 'default' : 'secondary'} className="text-[9px] h-4 shrink-0">
                        {ad.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{getPositionLabel(ad.position)}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      {ad.platform} · max {ad.maxWidth} · {new Date(ad.updatedAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handleToggle(ad)} className="nm-raised-sm flex h-8 w-8 items-center justify-center rounded-full">
                      {ad.isActive ? (
                        <ToggleRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    <button onClick={() => openEdit(ad)} className="nm-raised-sm flex h-8 w-8 items-center justify-center rounded-full">
                      <Save className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(ad.id)} className="nm-raised-sm flex h-8 w-8 items-center justify-center rounded-full text-rose-500 hover:text-rose-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {/* Script preview */}
                {ad.scriptContent && (
                  <div className="mt-2 max-h-16 overflow-hidden rounded-lg bg-muted/40 p-2">
                    <pre className="text-[9px] text-muted-foreground/60 whitespace-pre-wrap break-all line-clamp-3">{ad.scriptContent}</pre>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAd ? 'Edit Iklan' : 'Tambah Iklan Baru'}</DialogTitle>
            <DialogDescription>Tempel script iklan dari platform pilihan Anda</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Nama Iklan</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Contoh: AdSense Dashboard Atas" className="nm-input" />
            </div>

            {/* Platform Preset */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Platform</label>
              <div className="grid grid-cols-3 gap-1.5">
                {PLATFORM_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => applyPreset(p.value)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                      formPlatform === p.value
                        ? 'nm-raised-sm bg-emerald-500 text-white'
                        : 'nm-btn text-muted-foreground'
                    }`}
                  >
                    <span>{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Posisi Tampil</label>
              <select
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                className="w-full rounded-lg border border-border/50 bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              >
                {AD_POSITIONS.map((pos) => (
                  <option key={pos.value} value={pos.value}>{pos.label}</option>
                ))}
              </select>
            </div>

            {/* Max Width */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Lebar Maksimal</label>
              <Input value={formMaxWidth} onChange={(e) => setFormMaxWidth(e.target.value)} placeholder="100%" className="nm-input" />
            </div>

            {/* Script Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Script Iklan</label>
              <textarea
                value={formScript}
                onChange={(e) => setFormScript(e.target.value)}
                rows={10}
                placeholder="Tempel script iklan di sini..."
                className="w-full rounded-lg border border-border/50 bg-muted/40 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400/40 resize-y"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="rounded-full">Batal</Button>
            <Button
              onClick={handleSave}
              disabled={!formName.trim() || !formScript.trim() || saving}
              className="nm-btn-primary rounded-full text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
              {editingAd ? 'Simpan' : 'Buat Iklan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}