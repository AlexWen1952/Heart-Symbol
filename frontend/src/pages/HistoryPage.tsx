import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useHistory } from '@/hooks/useHistory';
import { useTranslation } from '@/hooks/useTranslation';
import { downloadReadings, parseImportedReadings } from '@/lib/export';
import { filterReadings } from '@/lib/insights';
import type { SavedReading } from '@/types/reading';
import {
  EMOTION_LABELS,
  EMOTIONS,
  TOPIC_LABELS,
  TOPICS,
  type Emotion,
  type Topic,
} from '@/types/session';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { history, importReadings, editReading } = useHistory();
  const { t, locale } = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<Topic | 'all'>('all');
  const [emotion, setEmotion] = useState<Emotion | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState(false);
  const [pendingImport, setPendingImport] = useState<SavedReading[]>([]);

  const filtered = useMemo(() => filterReadings(
    [...history].sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    { query, topic, emotion, favoritesOnly },
  ), [emotion, favoritesOnly, history, query, topic]);

  const handleImport = async (file?: File) => {
    if (!file) return;
    const readings = parseImportedReadings(await file.text());
    if (!readings.length) {
      setImportError(true);
      setImportMessage(t.history.importError);
      return;
    }
    setImportMessage('');
    setPendingImport(readings);
  };

  const confirmImport = () => {
    const result = importReadings(pendingImport);
    setImportError(!result.ok);
    setImportMessage(result.ok
      ? t.history.importSuccess.replace('{n}', String(result.imported))
      : t.history.importError);
    setPendingImport([]);
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
          >
            {t.nav.back}
          </button>
          <Link to="/insights" className="text-sm text-ink-soft hover:text-ink">{t.history.insights}</Link>
        </div>

        <div className="rounded-[32px] border border-divider bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-serif text-3xl sm:text-4xl">{t.history.heading}</h1>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => downloadReadings(history)} disabled={!history.length} className="rounded-full border border-divider px-4 py-2 text-xs text-ink-soft disabled:opacity-40">
                {t.history.export}
              </button>
              <button type="button" onClick={() => fileInput.current?.click()} className="rounded-full border border-divider px-4 py-2 text-xs text-ink-soft">
                {t.history.import}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                onChange={(event) => void handleImport(event.target.files?.[0])}
                className="hidden"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-faint">{t.history.backupPrivacy}</p>
          {importMessage && (
            <p className={`mt-3 text-sm ${importError ? 'text-danger' : 'text-ok'}`} role="status">{importMessage}</p>
          )}
          {pendingImport.length > 0 && (
            <div className="mt-4 rounded-2xl border border-accent/30 bg-accent-soft p-4" role="dialog" aria-modal="true">
              <p className="text-sm text-ink">{t.history.importPreview.replace('{n}', String(pendingImport.length))}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={confirmImport} className="rounded-full bg-ink px-4 py-2 text-xs text-white">{t.history.importConfirm}</button>
                <button type="button" onClick={() => setPendingImport([])} className="rounded-full border border-divider bg-surface px-4 py-2 text-xs text-ink-soft">{t.history.importCancel}</button>
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.history.searchPlaceholder}
                className="rounded-2xl border border-divider bg-warm-bg px-4 py-2.5 text-sm outline-none focus:border-accent sm:col-span-2"
              />
              <select value={topic} onChange={(event) => setTopic(event.target.value as Topic | 'all')} className="rounded-2xl border border-divider bg-warm-bg px-3 py-2.5 text-sm">
                <option value="all">{t.history.allTopics}</option>
                {TOPICS.map((value) => <option key={value} value={value}>{TOPIC_LABELS[value][locale]}</option>)}
              </select>
              <select value={emotion} onChange={(event) => setEmotion(event.target.value as Emotion | 'all')} className="rounded-2xl border border-divider bg-warm-bg px-3 py-2.5 text-sm">
                <option value="all">{t.history.allEmotions}</option>
                {EMOTIONS.map((value) => <option key={value} value={value}>{EMOTION_LABELS[value][locale]}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-ink-soft sm:col-span-2">
                <input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} />
                {t.history.favoritesOnly}
              </label>
            </div>
          )}

          {history.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-divider bg-warm-bg p-8 text-center text-ink-soft">
              <p>{t.history.empty}</p>
              <Link to="/topic" className="mt-4 inline-block rounded-full bg-ink px-5 py-3 text-sm font-medium text-white">
                {t.history.startFirst}
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <p className="mt-8 rounded-3xl bg-warm-bg p-8 text-center text-ink-soft">{t.history.noResults}</p>
          ) : (
            <div className="mt-8 space-y-4">
              {filtered.map((entry) => (
                <article key={entry.id} className="flex items-start gap-3 rounded-3xl border border-divider bg-warm-bg p-5 transition hover:border-accent hover:bg-accent-soft">
                  <Link to={`/history/${entry.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-ink-faint">{TOPIC_LABELS[entry.input.topic][locale]} · {EMOTION_LABELS[entry.input.emotion][locale]}</p>
                        <p className="mt-2 font-serif text-2xl">{entry.result.symbolMeta.names[locale]}</p>
                      </div>
                      <span className="text-sm text-ink-soft">
                        {new Date(entry.savedAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}
                      </span>
                    </div>
                    <p className="mt-4 line-clamp-2 text-sm text-ink-soft">{entry.input.concern}</p>
                    {!!entry.tags?.length && <p className="mt-3 text-xs text-accent">{entry.tags.map((tag) => `#${tag}`).join(' ')}</p>}
                  </Link>
                  <button
                    type="button"
                    onClick={() => editReading(entry.id, { favorite: !entry.favorite })}
                    aria-label={entry.favorite ? t.history.unfavorite : t.history.favorite}
                    className={`rounded-full p-2 text-lg ${entry.favorite ? 'text-accent' : 'text-ink-faint'}`}
                  >
                    {entry.favorite ? '★' : '☆'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
