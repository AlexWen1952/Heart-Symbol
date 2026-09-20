import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/hooks/useTranslation';
import { fetchSymbols, selectSymbol } from '@/lib/api';
import type { SymbolSummary } from '@/types/symbol';

export default function DrawPage() {
  const navigate = useNavigate();
  const { session, updateSession } = useSession();
  const { t } = useTranslation();
  const [symbols, setSymbols] = useState<SymbolSummary[]>([]);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
      return;
    }
    if (!session.topic || !session.concern || !session.emotion) {
      navigate('/topic', { replace: true });
    }
  }, [navigate, session]);

  useEffect(() => {
    if (!session?.topic || !session?.emotion) return;
    let active = true;
    Promise.all([
      fetchSymbols(),
      selectSymbol(session.topic, session.emotion, session.dateString),
    ])
      .then(([symbolsRes, recommended]) => {
        if (!active) return;
        setSymbols(symbolsRes.symbols);
        setRecommendedId(recommended);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadError(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.topic, session?.emotion, session?.dateString]);

  if (!session || !session.topic || !session.concern || !session.emotion) return null;

  const chooseCard = (symbolId: string) => {
    updateSession({ symbolId, step: 'reading' });
    navigate('/reading');
  };

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/ritual')}
            className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
          >
            {t.nav.back}
          </button>
          <span className="text-sm text-ink-soft">{t.progress.stepOf.replace('{step}', '5').replace('{total}', '5')}</span>
        </div>

        <div className="rounded-[32px] border border-divider bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{t.draw.heading}</h1>
          <p className="mt-3 text-base text-ink-soft">{t.draw.instruction}</p>

          {loading ? (
            <p className="mt-8 text-ink-soft" role="status">{t.draw.loading}</p>
          ) : loadError || symbols.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-danger/20 bg-red-50 p-4 text-sm text-danger" role="alert">
              {t.draw.error}
            </p>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {symbols.map((symbol) => {
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
                      {isRecommended && (
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-accent">
                          {t.draw.today}
                        </span>
                      )}
                    </div>
                    <div className="font-serif text-2xl text-ink">{symbol.names[session.locale]}</div>
                    <div className="mt-2 text-sm text-ink-soft">{symbol.shortMeaning[session.locale]}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
