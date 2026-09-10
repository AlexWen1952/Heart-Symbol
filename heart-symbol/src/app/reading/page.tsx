'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHistory } from '@/hooks/useHistory';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/hooks/useTranslation';
import { generateReading } from '@/lib/readingEngine';
import { generateId } from '@/lib/uuid';
import type { SavedReading } from '@/types/reading';

export default function ReadingPage() {
  const router = useRouter();
  const { session, clearSession } = useSession();
  const { history, saveReading } = useHistory();
  const { t, locale } = useTranslation();
  const [saved, setSaved] = useState(false);

  if (!session || !session.topic || !session.emotion || !session.symbolId || !session.concern) {
    if (typeof window !== 'undefined') router.replace('/draw');
    return null;
  }

  const safeSession = session as typeof session & {
    topic: NonNullable<typeof session.topic>;
    emotion: NonNullable<typeof session.emotion>;
    symbolId: NonNullable<typeof session.symbolId>;
    concern: string;
    dateString: string;
    locale: NonNullable<typeof session.locale>;
  };

  const reading = useMemo(
    () =>
      generateReading({
        topic: safeSession.topic,
        emotion: safeSession.emotion,
        symbolId: safeSession.symbolId,
        concern: safeSession.concern,
        locale: safeSession.locale,
        dateString: safeSession.dateString,
        crisisDetected: !!safeSession.crisisDetected,
      }),
    [safeSession],
  );

  const handleSave = () => {
    const entry: SavedReading = {
      version: 1,
      id: generateId(),
      savedAt: new Date().toISOString(),
      input: {
        topic: safeSession.topic,
        emotion: safeSession.emotion,
        symbolId: safeSession.symbolId,
        concern: safeSession.concern,
        locale: safeSession.locale,
        dateString: safeSession.dateString,
        crisisDetected: !!safeSession.crisisDetected,
      },
      result: reading,
    };

    const result = saveReading(entry);
    if (result.ok) {
      setSaved(true);
    }
  };

  const handleNewReading = () => {
    clearSession();
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/draw')}
            className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
          >
            {t.nav.back}
          </button>
          <button type="button" onClick={handleNewReading} className="text-sm text-ink-soft hover:text-ink">
            {t.nav.startNew}
          </button>
        </div>

        <div className="rounded-[32px] border border-divider bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-ink-faint">{t.reading.symbolDrawn}</p>
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl">{reading.symbolMeta.names[locale]}</h1>
            </div>
            <div className="rounded-full border border-divider bg-warm-bg px-4 py-2 text-sm text-ink-soft">
              {safeSession.topic} · {safeSession.emotion}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-divider bg-warm-bg p-5">
              <h2 className="font-serif text-xl">{t.reading.sectionLabels.emotionalMirror}</h2>
              <p className="mt-3 text-base text-ink-soft">{reading.emotionalMirror}</p>
            </section>

            <section className="rounded-3xl border border-divider bg-warm-bg p-5">
              <h2 className="font-serif text-xl">{t.reading.sectionLabels.symbolMeaning}</h2>
              <p className="mt-3 text-base text-ink-soft">{reading.symbolMeaning}</p>
            </section>

            <section className="rounded-3xl border border-divider bg-warm-bg p-5">
              <h2 className="font-serif text-xl">{t.reading.sectionLabels.possibleBlindSpot}</h2>
              <p className="mt-3 text-base text-ink-soft">{reading.possibleBlindSpot}</p>
            </section>

            <section className="rounded-3xl border border-divider bg-warm-bg p-5">
              <h2 className="font-serif text-xl">{t.reading.sectionLabels.reflectionQuestions}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-ink-soft">
                {reading.reflectionQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-divider bg-warm-bg p-5">
              <h2 className="font-serif text-xl">{t.reading.sectionLabels.oneActionForToday}</h2>
              <p className="mt-3 text-base text-ink-soft">{reading.oneActionForToday}</p>
            </section>

            <section className="rounded-3xl border border-divider bg-warm-bg p-5">
              <h2 className="font-serif text-xl">{t.reading.sectionLabels.closingLine}</h2>
              <p className="mt-3 text-base text-ink-soft">{reading.closingLine}</p>
            </section>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-full bg-ink px-6 py-3 text-base font-medium text-white transition hover:bg-ink/90"
            >
              {t.reading.saveButton}
            </button>
            <div className="text-sm text-ink-soft">{saved ? t.reading.savedConfirmation : `${history.length} saved`}</div>
          </div>

          <div className="mt-8 rounded-3xl border border-divider bg-warm-bg p-4 text-sm text-ink-soft">
            <p>{t.reading.safetyFooter}</p>
            <p className="mt-2">{t.reading.legalFooter}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
