import type { Locale, LocalizedString } from './locale';
import type { Topic, Emotion } from './session';
import type { SymbolId } from './symbol';

export interface ReadingInput {
  topic: Topic;
  emotion: Emotion;
  symbolId: SymbolId;
  /** User's free-text concern — max 300 characters. */
  concern: string;
  locale: Locale;
  /** ISO YYYY-MM-DD of the session. */
  dateString: string;
  /** True when the concern triggered crisis keyword detection. */
  crisisDetected?: boolean;
}

export interface ReadingResult {
  emotionalMirror: string;
  symbolMeaning: string;
  possibleBlindSpot: string;
  reflectionQuestions: [string, string, string];
  oneActionForToday: string;
  closingLine: string;
  /** Symbol metadata the UI needs without importing the full symbol table. */
  symbolMeta: {
    id: SymbolId;
    names: LocalizedString;
  };
}

/**
 * AI-personalized rewrite of a ReadingResult. Same six content sections,
 * rewritten to feel connected to the user's specific concern.
 */
export type AIReadingResult = Omit<ReadingResult, 'symbolMeta'> & {
  /** The locale the AI responded in. */
  locale: string;
};

export type ActionStatus = 'pending' | 'completed' | 'skipped';

export interface ReflectionResponse {
  questionIndex: 0 | 1 | 2;
  question: string;
  answer: string;
  updatedAt: string;
  followUpQuestion?: string;
  followUpAnswer?: string;
}

export interface ActionProgress {
  text: string;
  status: ActionStatus;
  updatedAt: string;
  followUpNote?: string;
  followedUpAt?: string;
}

export interface AIPerspective {
  perspective: 'friend' | 'pragmatic' | 'selfCompassion';
  text: string;
}

export interface AIActionPlan {
  steps: [string, string, string];
  fallback: string;
}

export interface AIFutureLetter {
  text: string;
  unlockDate: string;
  createdAt: string;
}

export interface AIWeeklyReview {
  locale: Locale;
  summary: string;
  patterns: string[];
  encouragement: string;
  nextQuestion: string;
  createdAt: string;
}

export interface SavedReading {
  /** Schema version — increment if the shape changes incompatibly. */
  version: 2;
  id: string;
  /** ISO 8601 timestamp of when the reading was saved. */
  savedAt: string;
  input: ReadingInput;
  /** Deterministic reading — always present; source of truth. */
  result: ReadingResult;
  /** Optional AI-personalized narrative. */
  aiNarrative?: AIReadingResult | null;
  favorite?: boolean;
  tags?: string[];
  reflection?: ReflectionResponse;
  action?: ActionProgress;
  aiPerspective?: AIPerspective;
  aiActionPlan?: AIActionPlan;
  futureLetter?: AIFutureLetter;
}
