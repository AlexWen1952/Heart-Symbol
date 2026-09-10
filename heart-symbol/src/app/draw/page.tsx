'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/hooks/useTranslation';
import { SYMBOLS } from '@/data/symbols';
import { selectSymbol } from '@/lib/symbolSelector';
import type { SymbolId } from '@/types/symbol';

export default function DrawPage() {
  const router = useRouter();
  const { session, updateSession } = useSession();
  const { t } = useTranslation();

  useEffect(() => {
    if (!session) {
      router.replace('/');
      return;
    }
    if (!session.topic || !session.concern || !session.emotion) {
      router.replace('/topic');
      return;
    }
  }, [router, session]);

  if (!session || !session.topic || !session.concern || !session.emotion) return null;

  const safeSession = session as typeof session & {
    topic: NonNullable<typeof session.topic>;
    emotion: NonNullable<typeof session.emotion>;
    concern: string;
    dateString: string;
  };

  const recommendedId = useMemo(
    () => selectSymbol(safeSession.topic, safeSession.emotion, safeSession.dateString),
    [safeSession.topic, safeSession.emotion, safeSession.dateString],
  );

  const chooseCard = (symbolId: SymbolId) => {
    updateSession({ symbolId, step: 'reading' });
    router.push('/reading');
  };

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/ritual')}
            className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
          >
            {t.nav.back}
          </button>
          <span className="text-sm text-ink-soft">{t.progress.stepOf.replace('{step}', '5').replace('{total}', '5')}</span>
        </div>

        <div className="rounded-[32px] border border-divider bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{t.draw.heading}</h1>
          <p className="mt-3 text-base text-ink-soft">{t.draw.instruction}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SYMBOLS.map((symbol) => {
              const isRecommended = symbol.id === recommendedId;
              return (
                <button
                  key={symbol.id}
                  type="button"
                  onClick={() => chooseCard(symbol.id)}
                  className={[
                    'card-flip rounded-[28px] border p-4 text-left transition-all duration-200',
                    isRecommended ? 'border-accent bg-accent-soft' : 'border-divider bg-warm-bg hover:border-accent',
                  ].join(' ')}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.18em] text-ink-faint">{symbol.family}</span>
                    {isRecommended && <span className="rounded-full bg-white px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-accent">today</span>}
                  </div>
                  <div className="font-serif text-2xl text-ink">{symbol.names[session.locale]}</div>
                  <div className="mt-2 text-sm text-ink-soft">{symbol.shortMeaning[session.locale]}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
