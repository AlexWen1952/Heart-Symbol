import type { SavedReading } from '@/types/reading';
import type { Emotion, Topic } from '@/types/session';

export interface HistoryFilters {
  query: string;
  topic: Topic | 'all';
  emotion: Emotion | 'all';
  favoritesOnly: boolean;
}

export interface InsightItem {
  key: string;
  count: number;
  percentage: number;
}

export interface ReadingInsights {
  topics: InsightItem[];
  emotions: InsightItem[];
  symbols: InsightItem[];
  actionCompletionRate: number;
  answeredReflections: number;
}

function countBy(readings: SavedReading[], select: (reading: SavedReading) => string): InsightItem[] {
  const counts = new Map<string, number>();
  for (const reading of readings) {
    const key = select(reading);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      count,
      percentage: readings.length ? Math.round((count / readings.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function filterReadings(readings: SavedReading[], filters: HistoryFilters): SavedReading[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return readings.filter((reading) => {
    if (filters.topic !== 'all' && reading.input.topic !== filters.topic) return false;
    if (filters.emotion !== 'all' && reading.input.emotion !== filters.emotion) return false;
    if (filters.favoritesOnly && !reading.favorite) return false;
    if (!query) return true;
    const searchable = [
      reading.input.concern,
      reading.result.symbolMeta.names.en,
      reading.result.symbolMeta.names.zh,
      reading.reflection?.answer,
      reading.action?.text,
      ...(reading.tags ?? []),
    ].filter(Boolean).join(' ').toLocaleLowerCase();
    return searchable.includes(query);
  });
}

export function buildInsights(readings: SavedReading[]): ReadingInsights {
  const actions = readings.filter((reading) => reading.action);
  const completed = actions.filter((reading) => reading.action?.status === 'completed').length;
  return {
    topics: countBy(readings, (reading) => reading.input.topic),
    emotions: countBy(readings, (reading) => reading.input.emotion),
    symbols: countBy(readings, (reading) => reading.result.symbolMeta.id),
    actionCompletionRate: actions.length ? Math.round((completed / actions.length) * 100) : 0,
    answeredReflections: readings.filter((reading) => reading.reflection?.answer.trim()).length,
  };
}
