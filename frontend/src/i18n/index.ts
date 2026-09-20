import type { Locale } from '@/types/locale';
import type { Translations } from './types';
import { en } from './en';
import { zh } from './zh';

export const translations: Record<Locale, Translations> = { en, zh };

export type { Translations };
