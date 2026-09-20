import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHistory } from '@/hooks/useHistory';
import { useTranslation } from '@/hooks/useTranslation';
import { fetchSymbols } from '@/lib/api';
import type { SymbolSummary } from '@/types/symbol';

export default function CollectionPage() {
  const navigate = useNavigate();
  const { history } = useHistory();
  const { t, locale } = useTranslation();
  const [symbols, setSymbols] = useState<SymbolSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchSymbols()
      .then((response) => {
        if (active) setSymbols(response.symbols);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const entry of history) {
      const id = entry.result.symbolMeta.id;
      result.set(id, (result.get(id) ?? 0) + 1);
    }
    return result;
  }, [history]);

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
        >
          {t.nav.back}
        </button>

        <div className="mt-6 rounded-[32px] border border-divider bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-ink-faint">
            {t.collection.discovered} · {counts.size}/12
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">{t.collection.heading}</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">{t.collection.subheading}</p>

          {loading ? (
            <p className="mt-8 text-ink-soft" role="status">…</p>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {symbols.map((symbol) => {
                const count = counts.get(symbol.id) ?? 0;
                const unlocked = count > 0;
                return (
                  <article
                    key={symbol.id}
                    className={`rounded-3xl border p-5 ${unlocked ? 'border-accent/50 bg-accent-soft/40' : 'border-divider bg-warm-bg'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.18em] text-ink-faint">{symbol.family}</span>
                      <span className={unlocked ? 'text-accent' : 'text-ink-faint'} aria-hidden="true">
                        {unlocked ? '✦' : '◇'}
                      </span>
                    </div>
                    <h2 className="mt-5 font-serif text-2xl">
                      {unlocked ? symbol.names[locale] : t.collection.undiscovered}
                    </h2>
                    <p className="mt-2 text-sm text-ink-soft">
                      {unlocked
                        ? symbol.shortMeaning[locale]
                        : t.collection.empty}
                    </p>
                    {unlocked && (
                      <p className="mt-4 text-xs uppercase tracking-[0.12em] text-accent">
                        {t.collection.appearances.replace('{n}', String(count))}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
