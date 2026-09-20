import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { Locale } from '@/types/locale';

const STORAGE_KEY = 'heart-symbol-locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
});

// ---------------------------------------------------------------------------
// useSyncExternalStore helpers — read localStorage without setState-in-effect.
// ---------------------------------------------------------------------------

function subscribeToLocale(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getLocaleSnapshot(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'zh') return stored;
    return navigator.language.startsWith('zh') ? 'zh' : 'en';
  } catch {
    return 'en';
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const getServerLocale = (): Locale => 'en';
  const locale = useSyncExternalStore(subscribeToLocale, getLocaleSnapshot, getServerLocale);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(
        new StorageEvent('storage', { key: STORAGE_KEY, newValue: next }),
      );
    } catch {
      // localStorage unavailable; locale still updates in-memory via the event.
    }
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocaleContext(): LocaleContextValue {
  return useContext(LocaleContext);
}
