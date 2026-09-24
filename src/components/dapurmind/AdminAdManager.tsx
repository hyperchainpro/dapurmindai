'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  ToggleLeft,
  ToggleRight,
  Megaphone,
  Code2,
  Eye,
  EyeOff,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Globe,
} from 'lucide-react';
import { useAppStore } from '@/hooks/useAppState';
import { AD_SLOTS } from '@/components/dapurmind/AdSlot';
import type { AdPlacement } from '@/types';

/* == Animation ========================================== */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/* == Helper ============================================ */

function formatDate(iso: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/* == Main Component ====================================== */

export function AdminAdManager() {
  const goBack = useAppStore((s) => s.goBack);
  const adPlacements = useAppStore((s) => s.adPlacements);
  const setAdPlacements = useAppStore((s) => s.setAdPlacements);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  /* == Initialize default placements == */
  const ensurePlacements = useCallback(() => {
    if (adPlacements.length === 0) {
      const defaults: AdPlacement[] = AD_SLOTS.map((slot) => ({
        id: slot.id,
        position: slot.id,
        name: slot.name,
        description: slot.description,
        script: '',
        enabled: false,
        updatedAt: new Date().toISOString(),
      }));
      setAdPlacements(defaults);
    }
  }, [adPlacements.length, setAdPlacements]);

  /* == Handlers == */
  const handleToggle = useCallback((id: string) => {
    const current = adPlacements.find((a) => a.id === id);
    if (current) {
      setAdPlacements(
        adPlacements.map((a) =>
          a.id === id
            ? { ...a, enabled: !a.enabled, updatedAt: new Date().toISOString() }
            : a
        )
      );
    }
  }, [adPlacements, setAdPlacements]);

  const handleSaveScript = useCallback((id: string, script: string) => {
    setAdPlacements(
      adPlacements.map((a) =>
        a.id === id
          ? { ...a, script, updatedAt: new Date().toISOString() }
          : a
      )
    );
    setEditingId(null);
    showToast('success', `Script iklan berhasil disimpan`);
  }, [adPlacements, setAdPlacements]);

  const handleClearScript = useCallback((id: string) => {
    setAdPlacements(
      adPlacements.map((a) =>
        a.id === id
          ? { ...a, script: '', enabled: false, updatedAt: new Date().toISOString() }
          : a
      )
    );
    showToast('success', 'Script iklan dihapus');
  }, [adPlacements, setAdPlacements]);

  const handleApplyGlobalScript = useCallback((script: string) => {
    setAdPlacements(
      adPlacements.map((a) => ({
        ...a,
        script,
        enabled: script.trim().length > 0,
        updatedAt: new Date().toISOString(),
      }))
    );
    showToast('success', `Script diterapkan ke semua ${adPlacements.length} slot`);
  }, [adPlacements, setAdPlacements]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  /* == Initialize on first render == */
  if (adPlacements.length === 0) {
    ensurePlacements();
  }

  const activeCount = adPlacements.filter((a) => a.enabled).length;

  return (
    <div className="min-h-screen bg-[var(--nm-bg)]">
      <div className="flex flex-col pb-12">
        {/* == Header =================================== */}
        <header className="sticky top-0 z-20 glass">
          <div className="flex items-center gap-3 px-4 py-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goBack}
              className="flex h-9 w-9 items-center justify-center rounded-full nm-raised transition-colors hover:bg-accent"
              aria-label="Kembali"
            >
              <ArrowLeft className="h-4 w-4" />
            </motion.button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-500" />
                <h1 className="text-lg font-bold tracking-tight">
                  Manajemen Iklan
                </h1>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {activeCount}/{adPlacements.length} slot aktif
              </p>
            </div>
          </div>
        </header>

        {/* == Global Script Input ======================= */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4"
        >
          <div className="rounded-xl nm-raised p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-500" />
              <h2 className="text-sm font-bold">Script Global (Semua Slot)</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Masukkan script iklan untuk diterapkan ke seluruh slot sekaligus. Mendukung Google AdSense, Google Ad Manager, PropellerAds, dll.
            </p>
            <textarea
              placeholder={`<!-- Contoh Google AdSense -->\n<ins class="adsbygoogle"\n  style="display:block"\n  data-ad-client="ca-pub-XXXXXXXX"\n  data-ad-slot="XXXXXXXXXX"\n  data-ad-format="auto"\n  data-full-width-responsive="true"></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});<\/script>`}
              className="w-full rounded-lg nm-input text-xs font-mono p-3 min-h-[100px] resize-y text-foreground placeholder:text-muted-foreground/50"
              id="global-ad-script"
            />
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const el = document.getElementById('global-ad-script') as HTMLTextAreaElement;
                  if (el) handleApplyGlobalScript(el.value);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg nm-btn-primary py-2 text-xs font-semibold text-white"
              >
                <Save className="h-3.5 w-3.5" />
                Terapkan ke Semua Slot
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const el = document.getElementById('global-ad-script') as HTMLTextAreaElement;
                  if (el) el.value = '';
                }}
                className="flex items-center justify-center gap-1 rounded-lg nm-btn-outline px-3 py-2 text-xs font-medium text-muted-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* == Slot List ================================ */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="px-4 mt-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Posisi Iklan</h2>
            <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
              {adPlacements.length} slot
            </span>
          </div>

          {adPlacements.map((placement) => {
            const slotMeta = AD_SLOTS.find((s) => s.id === placement.id);
            const isEditing = editingId === placement.id;
            const isPreviewing = previewId === placement.id;

            return (
              <motion.div key={placement.id} variants={fadeUp} layout>
                <div className="rounded-xl nm-raised overflow-hidden">
                  {/* Slot Header */}
                  <div className="flex items-start gap-3 p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-lg mt-0.5">
                      {slotMeta?.emoji || '📢'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {placement.name}
                        </h3>
                        <span className={`shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[9px] font-bold ${
                          placement.enabled
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {placement.enabled ? 'AKTIF' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {placement.description}
                      </p>
                      {placement.updatedAt && placement.script && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          Terakhir update: {formatDate(placement.updatedAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Script Preview (collapsed) */}
                  {placement.script && !isEditing && (
                    <div className="mx-3 mb-2 rounded-lg bg-muted/30 px-3 py-2">
                      <code className="text-[10px] font-mono text-muted-foreground break-all line-clamp-2">
                        {placement.script.substring(0, 150)}
                        {placement.script.length > 150 && '...'}
                      </code>
                    </div>
                  )}

                  {/* Script Editor (expanded) */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mx-3 mb-2">
                          <textarea
                            defaultValue={placement.script}
                            placeholder={`<!-- Masukkan script iklan di sini -->\n<!-- Mendukung: Google AdSense, Google Ad Manager, PropellerAds, PopAds, dll -->`}
                            className="w-full rounded-lg nm-input text-xs font-mono p-3 min-h-[120px] resize-y text-foreground placeholder:text-muted-foreground/50"
                            id={`ad-editor-${placement.id}`}
                          />
                          <div className="flex gap-2 mt-2">
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                const el = document.getElementById(`ad-editor-${placement.id}`) as HTMLTextAreaElement;
                                if (el) handleSaveScript(placement.id, el.value);
                              }}
                              className="flex-1 flex items-center justify-center gap-1 rounded-lg nm-btn-primary py-2 text-xs font-semibold text-white"
                            >
                              <Save className="h-3.5 w-3.5" />
                              Simpan
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setEditingId(null)}
                              className="flex items-center justify-center rounded-lg nm-btn-outline px-3 py-2 text-xs font-medium text-muted-foreground"
                            >
                              Batal
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Live Preview */}
                  <AnimatePresence>
                    {isPreviewing && placement.script && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mx-3 mb-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 p-3 dark:border-emerald-700 dark:bg-emerald-500/5">
                          <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mb-2">Preview:</p>
                          <div
                            className="rounded-lg overflow-hidden bg-white"
                            dangerouslySetInnerHTML={{ __html: placement.script }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="flex items-center gap-2 px-3 pb-3">
                    {/* Toggle */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleToggle(placement.id)}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                      style={{
                        background: placement.enabled ? 'var(--nm-accent-bg, rgba(16,185,129,0.15))' : 'var(--nm-bg)',
                        color: placement.enabled ? 'var(--nm-accent, #10b981)' : 'var(--nm-text, #6b7280)',
                        boxShadow: placement.enabled ? 'inset 2px 2px 4px rgba(0,0,0,0.05), inset -2px -2px 4px rgba(255,255,255,0.7)' : '4px 4px 8px rgba(0,0,0,0.08), -4px -4px 8px rgba(255,255,255,0.8)',
                      }}
                    >
                      {placement.enabled ? (
                        <>
                          <ToggleRight className="h-4 w-4" />
                          Aktif
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4" />
                          Nonaktif
                        </>
                      )}
                    </motion.button>

                    <div className="flex-1" />

                    {/* Edit button */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setEditingId(isEditing ? null : placement.id);
                        setPreviewId(null);
                      }}
                      className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                      style={{
                        boxShadow: isEditing ? 'inset 2px 2px 4px rgba(0,0,0,0.08), inset -2px -2px 4px rgba(255,255,255,0.6)' : '3px 3px 6px rgba(0,0,0,0.06), -3px -3px 6px rgba(255,255,255,0.7)',
                      }}
                    >
                      <Code2 className="h-3 w-3" />
                      {isEditing ? 'Tutup' : 'Edit'}
                    </motion.button>

                    {/* Preview button */}
                    {placement.script && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setPreviewId(isPreviewing ? null : placement.id);
                          setEditingId(null);
                        }}
                        className="flex h-7 items-center gap-1 rounded-full px-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                        style={{
                          boxShadow: isPreviewing ? 'inset 2px 2px 4px rgba(0,0,0,0.08), inset -2px -2px 4px rgba(255,255,255,0.6)' : '3px 3px 6px rgba(0,0,0,0.06), -3px -3px 6px rgba(255,255,255,0.7)',
                        }}
                      >
                        {isPreviewing ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {isPreviewing ? 'Tutup' : 'Preview'}
                      </motion.button>
                    )}

                    {/* Clear button */}
                    {placement.script && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleClearScript(placement.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* == Info Box ================================= */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mx-4 mt-6 mb-8"
        >
          <div className="rounded-xl nm-inset p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-bold text-foreground">Panduan Script Iklan</h3>
            </div>
            <ul className="space-y-1.5 text-[11px] text-muted-foreground leading-relaxed">
              <li>• <strong>Google AdSense:</strong> Paste kode ad unit (ins + script) langsung</li>
              <li>• <strong>Google Ad Manager (GAM):</strong> Paste tag GPT (googletag.defineSlot)</li>
              <li>• <strong>PropellerAds:</strong> Paste script widget/zone mereka</li>
              <li>• <strong>PopAds/Adsterra:</strong> Paste JavaScript tag mereka</li>
              <li>• <strong>Custom HTML:</strong> Bisa juga untuk banner gambar custom dengan link</li>
              <li>• Script dijalankan dalam sandbox iframe yang aman</li>
              <li>• Nonaktifkan slot yang tidak digunakan untuk performa</li>
            </ul>
          </div>
        </motion.div>
      </div>

      {/* == Toast Notification ========================== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-24 left-4 right-4 z-50 flex justify-center"
          >
            <div className={`flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500 text-white'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminAdManager;
