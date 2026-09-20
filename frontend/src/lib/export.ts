import { parseHistory } from '@/lib/storage';
import type { Locale } from '@/types/locale';
import type { SavedReading } from '@/types/reading';

export function downloadReadings(readings: SavedReading[]): void {
  const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), readings }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `heart-symbol-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function parseImportedReadings(raw: string): SavedReading[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const readings = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>).readings
      : parsed;
    return parseHistory(JSON.stringify(readings));
  } catch {
    return [];
  }
}

export function createShareText(reading: SavedReading, locale: Locale): string {
  const content = reading.aiNarrative ?? reading.result;
  const name = reading.result.symbolMeta.names[locale];
  return [
    `Heart Symbol · ${name}`,
    '',
    content.emotionalMirror,
    '',
    content.symbolMeaning,
    '',
    content.closingLine,
  ].join('\n');
}

export async function shareReading(reading: SavedReading, locale: Locale): Promise<boolean> {
  const text = createShareText(reading, locale);
  try {
    if (navigator.share) {
      await navigator.share({ title: `Heart Symbol · ${reading.result.symbolMeta.names[locale]}`, text });
    } else {
      await navigator.clipboard.writeText(text);
    }
    return true;
  } catch {
    return false;
  }
}

function escapeHTML(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}

export function printReading(reading: SavedReading, locale: Locale): boolean {
  const content = reading.aiNarrative ?? reading.result;
  const printable = window.open('', '_blank');
  if (!printable) return false;
  printable.opener = null;
  const sections = [
    content.emotionalMirror,
    content.symbolMeaning,
    content.possibleBlindSpot,
    ...content.reflectionQuestions,
    content.oneActionForToday,
    content.closingLine,
  ];
  printable.document.write(`<!doctype html><html><head><title>Heart Symbol</title><style>body{font-family:Georgia,serif;max-width:720px;margin:48px auto;padding:24px;color:#1c1917;line-height:1.7}h1{font-size:36px}section{border-top:1px solid #e8e4df;padding:16px 0}@media print{body{margin:0}}</style></head><body><p>Heart Symbol</p><h1>${escapeHTML(reading.result.symbolMeta.names[locale])}</h1>${sections.map((section) => `<section>${escapeHTML(section)}</section>`).join('')}</body></html>`);
  printable.document.close();
  printable.focus();
  printable.print();
  return true;
}
