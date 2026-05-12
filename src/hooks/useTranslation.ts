import { useAppStore } from './useAppState';
import { translations, type Language } from '@/lib/i18n';

export function useTranslation() {
  const language = useAppStore((s) => s.language);

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language]?.[key] || translations['id']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return { t, language };
}
