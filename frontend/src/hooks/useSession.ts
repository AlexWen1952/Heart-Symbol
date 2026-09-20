import { useCallback, useSyncExternalStore } from 'react';
import {
  readSession,
  writeSession,
  clearSession,
  getSessionSnapshot,
  subscribeToSession,
} from '@/lib/session';
import type { SessionState } from '@/types/session';

const SERVER_SESSION: null = null;

export function useSession(): {
  session: SessionState | null;
  updateSession: (patch: Partial<Omit<SessionState, 'version'>>) => void;
  clearSession: () => void;
} {
  const session = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    () => SERVER_SESSION,
  );

  const updateSession = useCallback(
    (patch: Partial<Omit<SessionState, 'version'>>) => {
      writeSession(patch);
    },
    [],
  );

  const clear = useCallback(() => {
    clearSession();
  }, []);

  return { session, updateSession, clearSession: clear };
}

export function getSessionOnce(): SessionState | null {
  return readSession();
}
