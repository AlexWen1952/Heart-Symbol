import type { AIWeeklyReview } from '@/types/reading';

const WEEKLY_REVIEW_KEY = 'heart-symbol-weekly-review';

export function readWeeklyReview(): AIWeeklyReview | null {
  try {
    const raw = localStorage.getItem(WEEKLY_REVIEW_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<AIWeeklyReview>;
    if (value.locale !== 'en' && value.locale !== 'zh') return null;
    if (typeof value.summary !== 'string') return null;
    if (!Array.isArray(value.patterns)) return null;
    if (typeof value.encouragement !== 'string') return null;
    if (typeof value.nextQuestion !== 'string') return null;
    if (typeof value.createdAt !== 'string') return null;
    return value as AIWeeklyReview;
  } catch {
    return null;
  }
}

export function writeWeeklyReview(review: AIWeeklyReview): void {
  try {
    localStorage.setItem(WEEKLY_REVIEW_KEY, JSON.stringify(review));
  } catch {
    return;
  }
}
