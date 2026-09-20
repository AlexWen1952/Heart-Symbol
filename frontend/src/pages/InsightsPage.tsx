import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHistory } from '@/hooks/useHistory';
import { useTranslation } from '@/hooks/useTranslation';
import { buildInsights, type InsightItem } from '@/lib/insights';
import { generateWeeklyReview, getAIAvailability } from '@/lib/api';
import { readWeeklyReview, writeWeeklyReview } from '@/lib/weeklyReview';
import { EMOTION_LABELS, TOPIC_LABELS } from '@/types/session';

export default function InsightsPage() {
  const navigate = useNavigate();
  const { history } = useHistory();
  const { t, locale } = useTranslation();
  const insights = useMemo(() => buildInsights(history), [history]);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [weeklyReview, setWeeklyReview] = useState(() => {
    const saved = readWeeklyReview();
    return saved?.locale === locale ? saved : null;
  });
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState(false);

  useEffect(() => {
    getAIAvailability().then(setAiAvailable).catch(() => setAiAvailable(false));
  }, []);

  const symbolLabel = (id: string) => (
    history.find((reading) => reading.result.symbolMeta.id === id)?.result.symbolMeta.names[locale] ?? id
  );
  const renderBars = (items: InsightItem[], label: (key: string) => string) => (
    <div className="mt-4 space-y-3">
      {items.map((item) => (
        <div key={item.key}>
          <div className="mb-1 flex justify-between text-sm text-ink-soft">
            <span>{label(item.key)}</span>
            <span>{item.count} · {item.percentage}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-divider">
            <div className="h-full rounded-full bg-accent" style={{ width: `${item.percentage}%` }} />
          </div>
        </div>
      ))}
    </div>
  );

  const handleWeeklyReview = async () => {
    const records = [...history]
      .filter((reading) => !reading.input.crisisDetected)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .slice(0, 7)
      .map((reading) => ({
        topic: reading.input.topic,
        emotion: reading.input.emotion,
        symbolName: reading.result.symbolMeta.names[locale],
        concern: reading.input.concern,
        reflectionAnswer: reading.reflection?.answer ?? '',
        action: reading.action?.text ?? '',
        actionStatus: reading.action?.status,
        followUpNote: reading.action?.followUpNote ?? '',
        crisisDetected: false,
      }));
    if (!records.length) return;
    setWeeklyLoading(true);
    setWeeklyError(false);
    try {
      const response = await generateWeeklyReview(locale, records);
      if (response.ok && response.summary && response.patterns && response.encouragement && response.nextQuestion) {
        const review = {
          locale,
          summary: response.summary,
          patterns: response.patterns,
          encouragement: response.encouragement,
          nextQuestion: response.nextQuestion,
          createdAt: new Date().toISOString(),
        };
        writeWeeklyReview(review);
        setWeeklyReview(review);
      } else {
        setWeeklyError(true);
      }
    } catch {
      setWeeklyError(true);
    } finally {
      setWeeklyLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-5xl">
        <button type="button" onClick={() => navigate('/history')} className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft">
          {t.nav.back}
        </button>
        <div className="mt-6 rounded-[32px] border border-divider bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="font-serif text-3xl sm:text-4xl">{t.insights.heading}</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">{t.insights.subheading}</p>

          {!history.length ? (
            <p className="mt-8 rounded-3xl bg-warm-bg p-8 text-center text-ink-soft">{t.insights.empty}</p>
          ) : (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-accent-soft p-5 font-serif text-xl">{t.insights.total.replace('{n}', String(history.length))}</div>
                <div className="rounded-3xl bg-warm-bg p-5 font-serif text-xl">{t.insights.answered.replace('{n}', String(insights.answeredReflections))}</div>
                <div className="rounded-3xl bg-warm-bg p-5 font-serif text-xl">{t.insights.completion.replace('{n}', String(insights.actionCompletionRate))}</div>
              </div>
              {aiAvailable && (
                <section className="mt-8 rounded-3xl border border-accent/30 bg-accent-soft/30 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-xl">{t.ai.weeklyReview}</h2>
                      <p className="mt-1 text-xs text-ink-faint">{t.ai.dataNotice}</p>
                    </div>
                    <button type="button" onClick={() => void handleWeeklyReview()} disabled={weeklyLoading} className="rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-50">
                      {weeklyLoading ? t.ai.toolLoading : t.ai.generateWeeklyReview}
                    </button>
                  </div>
                  {weeklyError && <p className="mt-4 text-sm text-danger" role="alert">{t.ai.toolError}</p>}
                  {weeklyReview && (
                    <div className="mt-5 space-y-4 text-sm text-ink-soft">
                      <p>{weeklyReview.summary}</p>
                      <ul className="list-disc space-y-2 pl-5">{weeklyReview.patterns.map((pattern) => <li key={pattern}>{pattern}</li>)}</ul>
                      <p>{weeklyReview.encouragement}</p>
                      <p className="rounded-2xl bg-surface p-4 font-medium text-ink">{weeklyReview.nextQuestion}</p>
                    </div>
                  )}
                </section>
              )}
              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <section className="rounded-3xl border border-divider p-5">
                  <h2 className="font-serif text-xl">{t.insights.topics}</h2>
                  {renderBars(insights.topics, (key) => TOPIC_LABELS[key as keyof typeof TOPIC_LABELS][locale])}
                </section>
                <section className="rounded-3xl border border-divider p-5">
                  <h2 className="font-serif text-xl">{t.insights.emotions}</h2>
                  {renderBars(insights.emotions, (key) => EMOTION_LABELS[key as keyof typeof EMOTION_LABELS][locale])}
                </section>
                <section className="rounded-3xl border border-divider p-5">
                  <h2 className="font-serif text-xl">{t.insights.symbols}</h2>
                  {renderBars(insights.symbols, symbolLabel)}
                </section>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
