'use client';

import { useEffect, useLayoutEffect } from 'react';
import { useAppStore } from '@/hooks/useAppState';

/* Detect SSR — useLayoutEffect causes warnings on server */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/* Key used by zustand persist to save state in localStorage */
const STORAGE_KEY = 'dapurmind-store';

function getInitialDark(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return !!parsed?.state?.isDark;
    }
  } catch {
    // ignore
  }
  return false;
}

/* ── Inline script to prevent flash of wrong theme ── */
export function ThemeInitScript() {
  const src = `
    (function(){
      try {
        var raw = localStorage.getItem('${STORAGE_KEY}');
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && parsed.state && parsed.state.isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } catch(e){}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: src }} />;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useAppStore((s) => s.isDark);

  /* Apply dark class synchronously before browser paints */
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  return <>{children}</>;
}
