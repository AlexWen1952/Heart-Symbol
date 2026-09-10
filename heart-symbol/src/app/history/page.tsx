'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useHistory } from '@/hooks/useHistory';
import { useTranslation } from '@/hooks/useTranslation';

export default function HistoryPage() {
  const router = useRouter();
  const { history } = useHistory();
  const { t, locale } = useTranslation();

  const sorted = [...history].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
          >
            {t.nav.back}
          </button>
          <span className="text-sm text-ink-soft">{t.history.heading}</span>
        </div>

        <div className="rounded-[32px] border border-divider bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="font-serif text-3xl sm:text-4xl">{t.history.heading}</h1>

          {sorted.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-divider bg-warm-bg p-8 text-center text-ink-soft">
              <p>{t.history.empty}</p>
              <Link href="/topic" className="mt-4 inline-block rounded-full bg-ink px-5 py-3 text-sm font-medium text-white">
                {t.history.startFirst}
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {sorted.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/history/${entry.id}`}
                  className="block rounded-3xl border border-divider bg-warm-bg p-5 transition hover:border-accent hover:bg-accent-soft"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-ink-faint">{entry.input.topic}</p>
                      <p className="mt-2 font-serif text-2xl">{entry.result.symbolMeta.names[locale]}</p>
                    </div>
                    <span className="text-sm text-ink-soft">
                      {new Date(entry.savedAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm text-ink-soft">{entry.input.concern}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
