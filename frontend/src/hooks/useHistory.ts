import { useCallback, useSyncExternalStore } from 'react';
import {
  appendReading,
  mergeReadings,
  updateReading,
  removeReading,
  findReadingById as findById,
  subscribeToHistory,
  getHistorySnapshot,
} from '@/lib/storage';
import type { SavedReading } from '@/types/reading';

const SERVER_HISTORY: SavedReading[] = [];

/**
 * Reactive hook for reading history.
 * `history` updates automatically whenever localStorage changes.
 */
export function useHistory() {
  const history = useSyncExternalStore(
    subscribeToHistory,
    getHistorySnapshot,
    () => SERVER_HISTORY,
  );

  const saveReading = useCallback(
    (reading: SavedReading): { ok: boolean; error?: string } =>
      appendReading(reading),
    [],
  );

  const importReadings = useCallback((readings: SavedReading[]) => mergeReadings(readings), []);

  const editReading = useCallback(
    (
      id: string,
      patch: Partial<Omit<SavedReading, 'id' | 'version' | 'input' | 'result'>>,
    ) => updateReading(id, patch),
    [],
  );

  const deleteReading = useCallback((id: string) => {
    removeReading(id);
  }, []);

  const findReadingById = useCallback((id: string) => findById(id), []);

  return {
    history,
    saveReading,
    importReadings,
    editReading,
    deleteReading,
    findReadingById,
  };
}
