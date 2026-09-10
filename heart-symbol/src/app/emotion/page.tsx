'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/hooks/useTranslation';
import { EMOTION_LABELS, EMOTIONS } from '@/types/session';

export default function EmotionPage() {
  const router = useRouter();
  const { session, updateSession } = useSession();
  const { t } = useTranslation();

  useEffect(() => {
    if (!session) {
      router.replace('/');
      return;
    }
    if (!session.topic || !session.concern) {
      router.replace('/topic');
      return;
    }
  }, [router, session]);

  if (!session || !session.topic || !session.concern) return null;

  const selectEmotion = (emotion: (typeof EMOTIONS)[number]) => {
    updateSession({ emotion, step: 'ritual' });
    router.push('/ritual');
  };

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/concern')}
            className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
          >
            {t.nav.back}
          </button>
          <span className="text-sm text-ink-soft">{t.progress.stepOf.replace('{step}', '3').replace('{total}', '5')}</span>
        </div>

        <div className="rounded-[32px] border border-divider bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{t.emotion.heading}</h1>
          <p className="mt-3 text-base text-ink-soft">{t.emotion.subheading}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EMOTIONS.map((emotion) => {
              const labels = EMOTION_LABELS[emotion];
              const active = session.emotion === emotion;
              return (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => selectEmotion(emotion)}
                  className={[
                    'rounded-3xl border p-5 text-left transition-all duration-200',
                    active ? 'border-accent bg-accent-soft shadow-sm' : 'border-divider bg-warm-bg hover:border-accent',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-ink">{labels[session.locale]}</span>
                    <span className="text-xl" aria-hidden="true">✦</span>
                  </div>
                  <div className="mt-2 text-sm text-ink-soft">{labels.zh}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
