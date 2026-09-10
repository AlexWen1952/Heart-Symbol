'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHistory } from '@/hooks/useHistory';
import { useTranslation } from '@/hooks/useTranslation';
import type { SavedReading } from '@/types/reading';

export default function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const router = useRouter();
  const { history, deleteReading } = useHistory();
  const { t, locale } = useTranslation();
  const [entry, setEntry] = useState<SavedReading | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      setId(resolved.id);
    });
  }, [params]);

  useEffect(() => {
    if (!id) return;
    const current = history.find((item) => item.id === id) ?? null;
    setEntry(current);
  }, [history, id]);

  const handleDelete = () => {
    if (!entry) return;
    deleteReading(entry.id);
    router.push('/history');
  };

  if (!entry) {
    return (
      <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-divider bg-surface p-6 shadow-sm">
          <p className="text-lg text-ink-soft">{t.errors.readingNotFound}</p>
          <button type="button" onClick={() => router.push('/history')} className="mt-6 rounded-full bg-ink px-5 py-3 text-white">
            {t.history.backToHome}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button type="button" onClick={() => router.push('/history')} className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink">
            {t.nav.back}
          </button>
          <button type="button" onClick={handleDelete} className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 transition hover:bg-red-100">
            {t.historyDetail.deleteButton}
          </button>
        </div>

        <div className="rounded-[32px] border border-divider bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-ink-faint">{t.historyDetail.savedBanner.replace('{date}', new Date(entry.savedAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US'))}</p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl">{entry.result.symbolMeta.names[locale]}</h1>

          <div className="mt-8 rounded-3xl border border-divider bg-warm-bg p-5">
            <h2 className="font-serif text-xl">{t.historyDetail.originalConcern}</h2>
            <p className="mt-3 text-base text-ink-soft">{entry.input.concern}</p>
          </div>

          <div className="mt-8 space-y-6">
            {[
              { label: t.reading.sectionLabels.emotionalMirror, value: entry.result.emotionalMirror },
              { label: t.reading.sectionLabels.symbolMeaning, value: entry.result.symbolMeaning },
              { label: t.reading.sectionLabels.possibleBlindSpot, value: entry.result.possibleBlindSpot },
              { label: t.reading.sectionLabels.reflectionQuestions, value: entry.result.reflectionQuestions.join(' ') },
              { label: t.reading.sectionLabels.oneActionForToday, value: entry.result.oneActionForToday },
              { label: t.reading.sectionLabels.closingLine, value: entry.result.closingLine },
            ].map((section) => (
              <section key={section.label} className="rounded-3xl border border-divider bg-warm-bg p-5">
                <h2 className="font-serif text-xl">{section.label}</h2>
                <p className="mt-3 text-base text-ink-soft">{section.value}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
