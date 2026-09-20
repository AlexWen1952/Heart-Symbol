export type Locale = 'en' | 'zh';

export interface LocalizedString {
  en: string;
  zh: string;
}

/** Resolve a localized string to the requested locale. */
export function t(localized: LocalizedString, locale: Locale): string {
  return localized[locale];
}
