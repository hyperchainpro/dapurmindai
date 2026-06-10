'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AdSlotProps {
  position: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * AdSlot - Fetches and renders an active ad script for a given position.
 * Scripts are injected safely and re-executed on mount/update.
 * Positions are non-intrusive: between content sections, never in headers/nav.
 */
export function AdSlot({ position, className = '', fallback = null }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ad, setAd] = useState<{ scriptContent: string; maxWidth: string; platform: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchAd() {
      try {
        const res = await fetch(`/api/ads?position=${encodeURIComponent(position)}`);
        const json = await res.json();
        if (!cancelled && json.success && json.data) {
          setAd(json.data);
        }
      } catch {
        // Silently fail - ads should never break the app
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    fetchAd();
    return () => { cancelled = true; };
  }, [position]);

  // Inject and execute scripts when ad data changes
  useEffect(() => {
    if (!ad || !containerRef.current) return;

    const container = containerRef.current;

    // Clear previous content
    container.innerHTML = '';

    // Parse script tags from the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = ad.scriptContent;

    // Move non-script elements first
    const nonScripts = Array.from(tempDiv.querySelectorAll('*')).filter(
      (el) => el.tagName !== 'SCRIPT'
    );
    nonScripts.forEach((el) => {
      tempDiv.removeChild(el);
      container.appendChild(el);
    });

    // Execute scripts sequentially
    const scripts = Array.from(tempDiv.querySelectorAll('script'));
    let i = 0;

    function executeNext() {
      if (i >= scripts.length) return;
      const script = scripts[i++];
      const newScript = document.createElement('script');

      // Copy all attributes
      Array.from(script.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      if (script.src) {
        newScript.src = script.src;
        newScript.async = false;
        newScript.onload = executeNext;
        newScript.onerror = executeNext;
      } else {
        newScript.textContent = script.textContent || '';
      }

      container.appendChild(newScript);

      // If inline script, execute next immediately
      if (!script.src) {
        executeNext();
      }
    }

    if (scripts.length > 0) {
      executeNext();
    }

    return () => {
      container.innerHTML = '';
    };
  }, [ad]);

  if (!loaded) return null;
  if (!ad) return <>{fallback}</>;

  return (
    <div
      ref={containerRef}
      className={`ad-slot mx-auto my-3 ${className}`}
      style={{ maxWidth: ad.maxWidth }}
      data-ad-position={position}
      data-ad-platform={ad.platform}
    />
  );
}

/* ── Available Positions (for reference) ── */
export const AD_POSITIONS = [
  { value: 'dashboard-after-recipes', label: 'Dashboard: Setelah Resep Populer' },
  { value: 'dashboard-after-actions', label: 'Dashboard: Setelah Quick Actions' },
  { value: 'dashboard-before-stats', label: 'Dashboard: Sebelum Statistik' },
  { value: 'recipes-after-search', label: 'Resep: Setelah Pencarian' },
  { value: 'recipes-after-grid', label: 'Resep: Setelah Grid Resep' },
  { value: 'explore-before-grid', label: 'Explore: Sebelum Grid' },
  { value: 'explore-after-grid', label: 'Explore: Setelah Grid' },
] as const;

export type AdPosition = (typeof AD_POSITIONS)[number]['value'];