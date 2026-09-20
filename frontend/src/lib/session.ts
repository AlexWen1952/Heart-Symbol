import type { SessionState, SessionStep, Topic, Emotion } from '@/types/session';
import type { Locale } from '@/types/locale';
import type { SymbolId } from '@/types/symbol';
import { toLocalDateString } from '@/lib/date';

const SESSION_KEY = 'heart-symbol-session';
const SESSION_VERSION = 1 as const;

/**
 * Custom DOM event fired every time the session is written or cleared.
 * Allows useSyncExternalStore subscribers to react without polling.
 */
export const SESSION_CHANGE_EVENT = 'heart-symbol-session-change';

function dispatchChange(): void {
  window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT));
}

function today(): string {
  return toLocalDateString();
}

/** Validate that a parsed object looks like a valid SessionState. */
function isValidSession(obj: unknown): obj is SessionState {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Record<string, unknown>;
  return (
    s.version === SESSION_VERSION &&
    typeof s.dateString === 'string' &&
    typeof s.locale === 'string' &&
    typeof s.step === 'string'
  );
}

// ---------------------------------------------------------------------------
// Pure read/write
// ---------------------------------------------------------------------------

export function readSession(): SessionState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSession(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(patch: Partial<Omit<SessionState, 'version'>>): void {
  try {
    const current = readSession();
    const next: SessionState = {
      version: SESSION_VERSION,
      dateString: today(),
      locale: 'en' as Locale,
      step: 'topic' as SessionStep,
      ...current,
      ...patch,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    dispatchChange();
  } catch {
    // sessionStorage unavailable; continue without persistence.
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    dispatchChange();
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// useSyncExternalStore helpers — stable snapshot via raw-string memoization
// ---------------------------------------------------------------------------

let _cachedRaw: string | null = null;
let _cachedSession: SessionState | null = null;

export function getSessionSnapshot(): SessionState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw === _cachedRaw) return _cachedSession;
    _cachedRaw = raw;
    if (!raw) {
      _cachedSession = null;
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    _cachedSession = isValidSession(parsed) ? parsed : null;
    return _cachedSession;
  } catch {
    return null;
  }
}

export function subscribeToSession(callback: () => void): () => void {
  window.addEventListener(SESSION_CHANGE_EVENT, callback);
  return () => window.removeEventListener(SESSION_CHANGE_EVENT, callback);
}

// Re-export types for convenience
export type { Topic, Emotion, SymbolId, SessionStep };
