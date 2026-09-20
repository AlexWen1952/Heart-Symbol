import type { ActionStatus } from '@/types/reading';
import type { SessionState } from '@/types/session';

const REFLECTION_DRAFT_KEY = 'heart-symbol-reflection-draft';

export interface ReflectionDraft {
  fingerprint: string;
  selectedQuestion: 0 | 1 | 2 | null;
  reflectionAnswer: string;
  actionText: string;
  actionStatus: ActionStatus;
  actionEdited: boolean;
}

export function createReflectionFingerprint(session: SessionState): string {
  return JSON.stringify([
    session.topic,
    session.emotion,
    session.symbolId,
    session.concern,
    session.locale,
    session.dateString,
  ]);
}

export function readReflectionDraft(fingerprint: string): ReflectionDraft | null {
  try {
    const raw = sessionStorage.getItem(REFLECTION_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<ReflectionDraft>;
    if (draft.fingerprint !== fingerprint) return null;
    if (![null, 0, 1, 2].includes(draft.selectedQuestion ?? null)) return null;
    if (typeof draft.reflectionAnswer !== 'string') return null;
    if (typeof draft.actionText !== 'string') return null;
    if (!['pending', 'completed', 'skipped'].includes(draft.actionStatus ?? '')) return null;
    return draft as ReflectionDraft;
  } catch {
    return null;
  }
}

export function writeReflectionDraft(draft: ReflectionDraft): void {
  try {
    sessionStorage.setItem(REFLECTION_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    return;
  }
}

export function clearReflectionDraft(): void {
  try {
    sessionStorage.removeItem(REFLECTION_DRAFT_KEY);
  } catch {
    return;
  }
}
