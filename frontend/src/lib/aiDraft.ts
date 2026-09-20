import type { AIReadingResult, ReadingInput } from '@/types/reading';
import type { AITone } from '@/lib/api';

const AI_DRAFT_KEY = 'heart-symbol-ai-draft';

interface AIDraft {
  fingerprint: string;
  narrative: AIReadingResult;
}

export function createAIFingerprint(input: ReadingInput, tone: AITone): string {
  return JSON.stringify([
    input.topic,
    input.emotion,
    input.symbolId,
    input.concern,
    input.locale,
    input.dateString,
    tone,
  ]);
}

function isNarrative(value: unknown): value is AIReadingResult {
  if (!value || typeof value !== 'object') return false;
  const narrative = value as Record<string, unknown>;
  return (
    typeof narrative.emotionalMirror === 'string' &&
    typeof narrative.symbolMeaning === 'string' &&
    typeof narrative.possibleBlindSpot === 'string' &&
    Array.isArray(narrative.reflectionQuestions) &&
    narrative.reflectionQuestions.length === 3 &&
    narrative.reflectionQuestions.every((question) => typeof question === 'string') &&
    typeof narrative.oneActionForToday === 'string' &&
    typeof narrative.closingLine === 'string' &&
    typeof narrative.locale === 'string'
  );
}

export function readAIDraft(fingerprint: string): AIReadingResult | null {
  try {
    const raw = sessionStorage.getItem(AI_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<AIDraft>;
    return draft.fingerprint === fingerprint && isNarrative(draft.narrative)
      ? draft.narrative
      : null;
  } catch {
    return null;
  }
}

export function writeAIDraft(fingerprint: string, narrative: AIReadingResult): void {
  try {
    sessionStorage.setItem(AI_DRAFT_KEY, JSON.stringify({ fingerprint, narrative }));
  } catch {
    return;
  }
}

export function clearAIDraft(): void {
  try {
    sessionStorage.removeItem(AI_DRAFT_KEY);
  } catch {
    return;
  }
}
