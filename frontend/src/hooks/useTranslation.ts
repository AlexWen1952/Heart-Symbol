import { useLocale } from './useLocale';
import { translations } from '@/i18n';
import type { Translations } from '@/i18n/types';
import type { Locale } from '@/types/locale';

export function useTranslation(): {
  t: Translations;
  locale: Locale;
  setLocale: (locale: Locale) => void;
} {
  const { locale, setLocale } = useLocale();
  return { t: translations[locale], locale, setLocale };
}
