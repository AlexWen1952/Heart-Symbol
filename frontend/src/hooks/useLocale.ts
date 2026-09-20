import { useLocaleContext } from '@/context/LocaleContext';

export function useLocale() {
  const { locale, setLocale } = useLocaleContext();
  return { locale, setLocale };
}
