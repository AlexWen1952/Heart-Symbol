import type {
  AIActionPlan,
  AIPerspective,
  AIReadingResult,
  ReadingInput,
  ReadingResult,
} from '@/types/reading';
import type { Emotion, Topic } from '@/types/session';
import type { Locale } from '@/types/locale';
import type { SymbolSummary } from '@/types/symbol';

// When VITE_API_BASE_URL is empty, requests go to /api and are handled by the
// Vite dev proxy (dev) or same-origin reverse proxy (prod).
const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function url(path: string): string {
  return `${BASE}${path}`;
}

async function postJSON<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(url(path));
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

// --- Symbols ---------------------------------------------------------------

export interface SymbolsResponse {
  symbolIds: string[];
  symbols: SymbolSummary[];
}

export function fetchSymbols(): Promise<SymbolsResponse> {
  return getJSON<SymbolsResponse>('/api/symbols');
}

export async function selectSymbol(
  topic: Topic,
  emotion: Emotion,
  dateString: string,
): Promise<string> {
  const data = await postJSON<{ symbolId: string }>('/api/select-symbol', {
    topic,
    emotion,
    dateString,
  });
  return data.symbolId;
}

// --- Reading ---------------------------------------------------------------

export function generateReading(params: {
  topic: Topic;
  emotion: Emotion;
  symbolId: string;
  locale: Locale;
  concern?: string;
  crisisDetected?: boolean;
}): Promise<ReadingResult> {
  return postJSON<ReadingResult>('/api/reading', params);
}

// --- Concern ---------------------------------------------------------------

export interface ConcernValidation {
  isValid: boolean;
  trimmedLength: number;
  rawLength: number;
  remaining: number;
  atMax: boolean;
}

export interface ConcernValidateResponse {
  validation: ConcernValidation;
  crisisDetected: boolean;
}

export function validateConcern(text: string): Promise<ConcernValidateResponse> {
  return postJSON<ConcernValidateResponse>('/api/concern/validate', { text });
}

// --- AI narrative ----------------------------------------------------------

export async function getAIAvailability(): Promise<boolean> {
  try {
    const data = await getJSON<{ available: boolean }>('/api/ai-narrative');
    return data.available;
  } catch {
    return false;
  }
}

export interface AINarrativeResponse {
  ok: boolean;
  narrative?: AIReadingResult;
  reason?: string;
}

export type AITone = 'gentle' | 'direct' | 'poetic';

export function generateAINarrative(
  input: ReadingInput,
  result: ReadingResult,
  tone?: AITone,
  signal?: AbortSignal,
): Promise<AINarrativeResponse> {
  return postJSON<AINarrativeResponse>('/api/ai-narrative', { input, result, tone }, signal);
}

export interface AIToolResponse {
  ok: boolean;
  reason?: string;
}

export function generateDeepDive(
  input: ReadingInput,
  result: ReadingResult,
  question: string,
  answer: string,
): Promise<AIToolResponse & { followUpQuestion?: string }> {
  return postJSON('/api/ai/deep-dive', { input, result, question, answer });
}

export function generatePerspective(
  input: ReadingInput,
  result: ReadingResult,
  perspective: AIPerspective['perspective'],
): Promise<AIToolResponse & { perspective?: AIPerspective['perspective']; text?: string }> {
  return postJSON('/api/ai/perspective', { input, result, perspective });
}

export function generateActionPlan(
  input: ReadingInput,
  result: ReadingResult,
  action: string,
): Promise<AIToolResponse & { steps?: [string, string, string]; fallback?: string }> {
  return postJSON('/api/ai/action-plan', { input, result, action });
}

export interface WeeklyReviewRecord {
  topic: Topic;
  emotion: Emotion;
  symbolName: string;
  concern: string;
  reflectionAnswer: string;
  action: string;
  actionStatus?: 'pending' | 'completed' | 'skipped';
  followUpNote: string;
  crisisDetected: boolean;
}

export interface WeeklyReviewResult {
  summary: string;
  patterns: string[];
  encouragement: string;
  nextQuestion: string;
}

export function generateWeeklyReview(
  locale: Locale,
  records: WeeklyReviewRecord[],
): Promise<AIToolResponse & Partial<WeeklyReviewResult>> {
  return postJSON('/api/ai/weekly-review', { locale, records });
}

export function generateFutureLetter(
  input: ReadingInput,
  result: ReadingResult,
  reflectionAnswer: string,
  unlockDate: string,
): Promise<AIToolResponse & { text?: string }> {
  return postJSON('/api/ai/future-letter', { input, result, reflectionAnswer, unlockDate });
}

export type { AIActionPlan };
