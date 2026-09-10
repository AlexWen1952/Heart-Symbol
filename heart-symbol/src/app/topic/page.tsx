'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/hooks/useTranslation';
import { TOPIC_LABELS, TOPICS } from '@/types/session';

export default function TopicPage() {
  const router = useRouter();
  const { session, updateSession } = useSession();
  const { t, locale } = useTranslation();

  useEffect(() => {
    if (!session) {
      const tLocale = typeof window !== 'undefined' ? localStorage.getItem('heart-symbol-locale') : null;
      updateSession({
        locale: tLocale === 'zh' ? 'zh' : 'en',
        dateString: new Date().toISOString().slice(0, 10),
        step: 'topic',
      });
      return;
    }
  }, [session, updateSession]);

  if (!session) return null;

  const selectTopic = (topic: (typeof TOPICS)[number]) => {
    updateSession({ topic, step: 'concern' });
    router.push('/concern');
  };

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
          >
            {t.nav.back}
          </button>
          <span className="text-sm text-ink-soft">{t.nav.language}</span>
        </div>

        <div className="rounded-[32px] border border-divider bg-surface p-6 shadow-sm sm:p-8">
          <p className="mb-2 text-xs uppercase tracking-[0.28em] text-ink-faint">{t.progress.stepOf.replace('{step}', '1').replace('{total}', '5')}</p>
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{t.topic.heading}</h1>
          <p className="mt-3 max-w-xl text-base text-ink-soft">{t.topic.subheading}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOPICS.map((topic) => {
              const active = session.topic === topic;
              const labels = TOPIC_LABELS[topic];
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => selectTopic(topic)}
                  className={[
                    'rounded-3xl border p-5 text-left transition-all duration-200',
                    active ? 'border-accent bg-accent-soft shadow-sm' : 'border-divider bg-warm-bg hover:border-accent',
                  ].join(' ')}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.18em] text-ink-faint">{topic}</span>
                    <span className="text-lg" aria-hidden="true">✦</span>
                  </div>
                  <div className="font-serif text-2xl">{labels[locale]}</div>
                  <div className="mt-1 text-sm text-ink-soft">{labels.zh}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
