import type { LocalizedString } from './locale';

/**
 * Symbol ids are validated server-side; the frontend treats them as opaque
 * strings sourced from the /api/symbols endpoint.
 */
export type SymbolId = string;

/** Lightweight symbol info returned by GET /api/symbols. */
export interface SymbolSummary {
  id: SymbolId;
  family: string;
  names: LocalizedString;
  shortMeaning: LocalizedString;
}
