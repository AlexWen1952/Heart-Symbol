import { beforeEach, describe, expect, it } from 'vitest';
import { calculateStreak } from '@/lib/date';
import { buildInsights, filterReadings } from '@/lib/insights';
import { parseHistory } from '@/lib/storage';
import { createAIFingerprint, readAIDraft, writeAIDraft } from '@/lib/aiDraft';
import type { AIReadingResult, ReadingInput, SavedReading } from '@/types/reading';

const input: ReadingInput = {
  topic: 'self',
  emotion: 'anxious',
  symbolId: 'moon',
  concern: 'I keep second-guessing an important personal decision.',
  locale: 'en',
  dateString: '2026-09-15',
};

const result = {
  emotionalMirror: 'A sufficiently long emotional mirror.',
  symbolMeaning: 'A sufficiently long symbol meaning.',
  possibleBlindSpot: 'A sufficiently long possible blind spot.',
  reflectionQuestions: ['Question one is long?', 'Question two is long?', 'Question three is long?'],
  oneActionForToday: 'Write down one thing within your control.',
  closingLine: 'A sufficiently long closing line.',
  symbolMeta: { id: 'moon', names: { en: 'Moon', zh: '月亮' } },
} as SavedReading['result'];

const reading: SavedReading = {
  version: 2,
  id: 'reading-1',
  savedAt: '2026-09-15T12:00:00.000Z',
  input,
  result,
  favorite: true,
  tags: ['decision'],
  reflection: {
    questionIndex: 0,
    question: result.reflectionQuestions[0],
    answer: 'I can choose when to begin the conversation.',
    updatedAt: '2026-09-15T12:00:00.000Z',
  },
  action: {
    text: 'Write down one thing within your control.',
    status: 'completed',
    updatedAt: '2026-09-15T12:00:00.000Z',
  },
};

describe('local date insights', () => {
  it('counts a streak from today or yesterday without duplicate days', () => {
    expect(calculateStreak(['2026-09-16', '2026-09-15', '2026-09-15'], '2026-09-16')).toBe(2);
    expect(calculateStreak(['2026-09-15', '2026-09-14'], '2026-09-16')).toBe(2);
  });

  it('builds local insights and filters private fields', () => {
    const insights = buildInsights([reading]);
    expect(insights.actionCompletionRate).toBe(100);
    expect(insights.answeredReflections).toBe(1);
    expect(filterReadings([reading], {
      query: 'decision',
      topic: 'all',
      emotion: 'all',
      favoritesOnly: true,
    })).toHaveLength(1);
  });
});

describe('storage migration', () => {
  it('migrates a version 1 record without losing its narrative', () => {
    const legacy = { ...reading, version: 1, favorite: undefined, tags: undefined };
    const migrated = parseHistory(JSON.stringify([legacy]));
    expect(migrated).toHaveLength(1);
    expect(migrated[0].version).toBe(2);
    expect(migrated[0].favorite).toBe(false);
    expect(migrated[0].tags).toEqual([]);
    expect(migrated[0].reflection?.answer).toBe(reading.reflection?.answer);
  });
});

describe('AI session cache', () => {
  beforeEach(() => sessionStorage.clear());

  it('returns a narrative only for the matching input and tone', () => {
    const narrative: AIReadingResult = { ...result, locale: 'en' };
    const fingerprint = createAIFingerprint(input, 'gentle');
    writeAIDraft(fingerprint, narrative);
    expect(readAIDraft(fingerprint)?.closingLine).toBe(result.closingLine);
    expect(readAIDraft(createAIFingerprint(input, 'direct'))).toBeNull();
  });
});
