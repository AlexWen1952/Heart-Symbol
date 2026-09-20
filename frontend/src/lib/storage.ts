import type { SavedReading } from '@/types/reading';

export const HISTORY_KEY = 'heart-symbol-history';
export const MAX_HISTORY = 50;

/**
 * Custom event dispatched within the same tab after any write to localStorage
 * history. Combined with the native 'storage' event (other tabs), this enables
 * cross-component and cross-tab reactive updates via useSyncExternalStore.
 */
export const HISTORY_CHANGE_EVENT = 'heart-symbol-history-change';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function hasReadingFields(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  return (
    typeof value.emotionalMirror === 'string' &&
    typeof value.symbolMeaning === 'string' &&
    typeof value.possibleBlindSpot === 'string' &&
    typeof value.oneActionForToday === 'string' &&
    typeof value.closingLine === 'string' &&
    Array.isArray(value.reflectionQuestions) &&
    value.reflectionQuestions.length === 3 &&
    value.reflectionQuestions.every((question) => typeof question === 'string')
  );
}

function hasValidCore(entry: unknown): entry is Record<string, unknown> {
  if (!isObject(entry)) return false;
  if (typeof entry.id !== 'string' || entry.id.length === 0) return false;
  if (typeof entry.savedAt !== 'string' || entry.savedAt.length === 0) return false;
  if (entry.version !== undefined && entry.version !== 1 && entry.version !== 2) return false;

  if (!isObject(entry.input)) return false;
  const input = entry.input;
  if (typeof input.topic !== 'string') return false;
  if (typeof input.emotion !== 'string') return false;
  if (typeof input.symbolId !== 'string') return false;
  if (typeof input.concern !== 'string') return false;
  if (typeof input.dateString !== 'string') return false;
  if (input.locale !== 'en' && input.locale !== 'zh') return false;

  if (!hasReadingFields(entry.result) || !isObject(entry.result.symbolMeta)) return false;
  const names = entry.result.symbolMeta.names;
  return (
    typeof entry.result.symbolMeta.id === 'string' &&
    isObject(names) &&
    typeof names.en === 'string' &&
    typeof names.zh === 'string'
  );
}

function validReflection(value: unknown): boolean {
  if (!isObject(value)) return false;
  return (
    [0, 1, 2].includes(value.questionIndex as number) &&
    typeof value.question === 'string' &&
    typeof value.answer === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

function validAction(value: unknown): boolean {
  if (!isObject(value)) return false;
  return (
    typeof value.text === 'string' &&
    ['pending', 'completed', 'skipped'].includes(value.status as string) &&
    typeof value.updatedAt === 'string'
  );
}

function validPerspective(value: unknown): boolean {
  if (!isObject(value)) return false;
  return (
    ['friend', 'pragmatic', 'selfCompassion'].includes(value.perspective as string) &&
    typeof value.text === 'string'
  );
}

function validActionPlan(value: unknown): boolean {
  if (!isObject(value)) return false;
  return (
    Array.isArray(value.steps) &&
    value.steps.length === 3 &&
    value.steps.every((step) => typeof step === 'string') &&
    typeof value.fallback === 'string'
  );
}

function validFutureLetter(value: unknown): boolean {
  if (!isObject(value)) return false;
  return (
    typeof value.text === 'string' &&
    typeof value.unlockDate === 'string' &&
    typeof value.createdAt === 'string'
  );
}

export function migrateSavedReading(entry: unknown): SavedReading | null {
  if (!hasValidCore(entry)) return null;
  const r = entry as Record<string, unknown>;
  return {
    version: 2,
    id: r.id as string,
    savedAt: r.savedAt as string,
    input: r.input as SavedReading['input'],
    result: r.result as SavedReading['result'],
    aiNarrative: hasReadingFields(r.aiNarrative)
      ? r.aiNarrative as unknown as SavedReading['aiNarrative']
      : null,
    favorite: typeof r.favorite === 'boolean' ? r.favorite : false,
    tags: Array.isArray(r.tags)
      ? r.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 10)
      : [],
    reflection: validReflection(r.reflection)
      ? r.reflection as unknown as SavedReading['reflection']
      : undefined,
    action: validAction(r.action)
      ? r.action as unknown as SavedReading['action']
      : undefined,
    aiPerspective: validPerspective(r.aiPerspective)
      ? r.aiPerspective as unknown as SavedReading['aiPerspective']
      : undefined,
    aiActionPlan: validActionPlan(r.aiActionPlan)
      ? r.aiActionPlan as unknown as SavedReading['aiActionPlan']
      : undefined,
    futureLetter: validFutureLetter(r.futureLetter)
      ? r.futureLetter as unknown as SavedReading['futureLetter']
      : undefined,
  };
}

export function isValidSavedReading(entry: unknown): entry is SavedReading {
  if (!hasValidCore(entry) || entry.version !== 2) return false;
  if (entry.reflection !== undefined && !validReflection(entry.reflection)) return false;
  if (entry.action !== undefined && !validAction(entry.action)) return false;
  if (entry.aiPerspective !== undefined && !validPerspective(entry.aiPerspective)) return false;
  if (entry.aiActionPlan !== undefined && !validActionPlan(entry.aiActionPlan)) return false;
  if (entry.futureLetter !== undefined && !validFutureLetter(entry.futureLetter)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Pure transformation functions
// ---------------------------------------------------------------------------

export function parseHistory(raw: string | null): SavedReading[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  const migrated: SavedReading[] = [];
  for (const entry of parsed) {
    const reading = migrateSavedReading(entry);
    if (!reading || seen.has(reading.id)) continue;
    seen.add(reading.id);
    migrated.push(reading);
  }
  return migrated;
}

export function sortByDateDesc(readings: SavedReading[]): SavedReading[] {
  return [...readings].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

export function enforceMaxHistory(readings: SavedReading[]): SavedReading[] {
  return readings.length > MAX_HISTORY ? readings.slice(0, MAX_HISTORY) : readings;
}

// ---------------------------------------------------------------------------
// localStorage read/write
// ---------------------------------------------------------------------------

export function readHistory(): SavedReading[] {
  try {
    return parseHistory(localStorage.getItem(HISTORY_KEY));
  } catch {
    return [];
  }
}

function writeHistory(readings: SavedReading[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(readings));
  window.dispatchEvent(new Event(HISTORY_CHANGE_EVENT));
}

export function appendReading(reading: SavedReading): { ok: boolean; error?: string } {
  try {
    const existing = readHistory();
    const withoutDupe = existing.filter((r) => r.id !== reading.id);
    const updated = enforceMaxHistory([reading, ...withoutDupe]);
    writeHistory(updated);
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return { ok: false, error: 'full' };
    }
    return { ok: false, error: 'unavailable' };
  }
}

export function mergeReadings(
  incoming: SavedReading[],
): { ok: boolean; imported: number; duplicates: number; error?: string } {
  try {
    const existing = readHistory();
    const existingIds = new Set(existing.map((reading) => reading.id));
    const additions = incoming.filter((reading) => !existingIds.has(reading.id));
    const merged = enforceMaxHistory(sortByDateDesc([...existing, ...additions]));
    const imported = merged.filter((reading) => !existingIds.has(reading.id)).length;
    writeHistory(merged);
    return {
      ok: true,
      imported,
      duplicates: incoming.length - additions.length,
    };
  } catch (err) {
    const error = err instanceof DOMException && err.name === 'QuotaExceededError'
      ? 'full'
      : 'unavailable';
    return { ok: false, imported: 0, duplicates: 0, error };
  }
}

export function updateReading(
  id: string,
  patch: Partial<Omit<SavedReading, 'id' | 'version' | 'input' | 'result'>>,
): { ok: boolean; error?: string } {
  try {
    const existing = readHistory();
    const index = existing.findIndex((reading) => reading.id === id);
    if (index === -1) return { ok: false, error: 'not-found' };
    const updated = [...existing];
    updated[index] = { ...updated[index], ...patch, id, version: 2 };
    writeHistory(updated);
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return { ok: false, error: 'full' };
    }
    return { ok: false, error: 'unavailable' };
  }
}

export function removeReading(id: string): void {
  try {
    const updated = readHistory().filter((r) => r.id !== id);
    writeHistory(updated);
  } catch {
    // Ignore write errors; the record may already be deleted.
  }
}

export function findReadingById(id: string): SavedReading | undefined {
  return readHistory().find((r) => r.id === id);
}

// ---------------------------------------------------------------------------
// useSyncExternalStore adapters
// ---------------------------------------------------------------------------

export function subscribeToHistory(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(HISTORY_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(HISTORY_CHANGE_EVENT, onChange);
  };
}

let _snapshotRaw: string | null = undefined as unknown as null;
let _snapshotResult: SavedReading[] = [];

export function getHistorySnapshot(): SavedReading[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(HISTORY_KEY);
  } catch {
    return _snapshotResult;
  }
  if (raw === _snapshotRaw) return _snapshotResult;
  _snapshotRaw = raw;
  _snapshotResult = parseHistory(raw);
  return _snapshotResult;
}
