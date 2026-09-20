import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHistory } from '@/hooks/useHistory';
import { useTranslation } from '@/hooks/useTranslation';
import { addLocalDays, isDateBefore, localDateFromTimestamp, toLocalDateString } from '@/lib/date';
import { printReading, shareReading } from '@/lib/export';
import { generateFutureLetter, getAIAvailability } from '@/lib/api';
import type { ActionStatus } from '@/types/reading';

export default function HistoryDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { history, editReading, deleteReading } = useHistory();
  const { t, locale } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [answer, setAnswer] = useState('');
  const [actionText, setActionText] = useState('');
  const [actionStatus, setActionStatus] = useState<ActionStatus>('pending');
  const [followUpNote, setFollowUpNote] = useState('');
  const [tags, setTags] = useState('');
  const [updated, setUpdated] = useState(false);
  const [shared, setShared] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [unlockDate, setUnlockDate] = useState(() => addLocalDays(toLocalDateString(), 7));
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterError, setLetterError] = useState(false);

  const entry = useMemo(
    () => history.find((item) => item.id === id) ?? null,
    [history, id],
  );

  useEffect(() => {
    if (!entry) return;
    setAnswer(entry.reflection?.answer ?? '');
    setActionText(entry.action?.text ?? entry.result.oneActionForToday);
    setActionStatus(entry.action?.status ?? 'pending');
    setFollowUpNote(entry.action?.followUpNote ?? '');
    setTags((entry.tags ?? []).join(', '));
  }, [entry]);

  useEffect(() => {
    getAIAvailability().then(setAiAvailable).catch(() => setAiAvailable(false));
  }, []);

  const handleDelete = () => {
    if (!entry) return;
    deleteReading(entry.id);
    navigate('/history');
  };

  const handleUpdate = () => {
    if (!entry) return;
    const now = new Date().toISOString();
    const result = editReading(entry.id, {
      tags: tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 10),
      reflection: entry.reflection
        ? { ...entry.reflection, answer: answer.trim(), updatedAt: now }
        : undefined,
      action: actionText.trim()
        ? {
            text: actionText.trim(),
            status: actionStatus,
            updatedAt: now,
            followUpNote: followUpNote.trim() || undefined,
            followedUpAt: followUpNote.trim() ? now : undefined,
          }
        : undefined,
    });
    setUpdated(result.ok);
  };

  const handleFutureLetter = async () => {
    if (!entry || entry.input.crisisDetected) return;
    setLetterLoading(true);
    setLetterError(false);
    try {
      const response = await generateFutureLetter(
        entry.input,
        entry.result,
        entry.reflection?.answer ?? '',
        unlockDate,
      );
      if (response.ok && response.text) {
        editReading(entry.id, {
          futureLetter: {
            text: response.text,
            unlockDate,
            createdAt: new Date().toISOString(),
          },
        });
      } else {
        setLetterError(true);
      }
    } catch {
      setLetterError(true);
    } finally {
      setLetterLoading(false);
    }
  };

  if (!entry) {
    return (
      <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-divider bg-surface p-6 shadow-sm">
          <p className="text-lg text-ink-soft">{t.errors.readingNotFound}</p>
          <button type="button" onClick={() => navigate('/history')} className="mt-6 rounded-full bg-ink px-5 py-3 text-white">
            {t.history.backToHome}
          </button>
        </div>
      </main>
    );
  }

  const narrative = entry.aiNarrative ?? null;
  const content = narrative ?? entry.result;
  const canFollowUp = isDateBefore(
    localDateFromTimestamp(entry.savedAt),
    toLocalDateString(),
  );
  const letterUnlocked = entry.futureLetter
    ? !isDateBefore(toLocalDateString(), entry.futureLetter.unlockDate)
    : false;

  const sections = [
    { label: t.reading.sectionLabels.emotionalMirror, value: content.emotionalMirror },
    { label: t.reading.sectionLabels.symbolMeaning, value: content.symbolMeaning },
    { label: t.reading.sectionLabels.possibleBlindSpot, value: content.possibleBlindSpot },
  ];

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/history')}
            className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
          >
            {t.nav.back}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 transition hover:bg-red-100"
          >
            {t.historyDetail.deleteButton}
          </button>
        </div>

        {confirmDelete && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5" role="dialog" aria-modal="true" aria-labelledby="delete-reading-title">
            <p id="delete-reading-title" className="font-medium text-red-900">{t.historyDetail.deleteConfirm}</p>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={handleDelete} className="rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white">
                {t.historyDetail.deleteConfirmAction}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-700">
                {t.historyDetail.deleteCancel}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-[32px] border border-divider bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-ink-faint">
            {t.historyDetail.savedBanner.replace(
              '{date}',
              new Date(entry.savedAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US'),
            )}
          </p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl">{entry.result.symbolMeta.names[locale]}</h1>
          {narrative && (
            <p className="mt-2 text-sm text-accent">{t.ai.savedPersonalized}</p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => setShared(await shareReading(entry, locale))}
              className="rounded-full border border-divider px-4 py-2 text-sm text-ink-soft"
            >
              {t.historyDetail.share}
            </button>
            <button
              type="button"
              onClick={() => printReading(entry, locale)}
              className="rounded-full border border-divider px-4 py-2 text-sm text-ink-soft"
            >
              {t.historyDetail.print}
            </button>
            {shared && <span className="text-xs text-ok" role="status">{t.historyDetail.shared}</span>}
          </div>

          <div className="mt-8 rounded-3xl border border-divider bg-warm-bg p-5">
            <h2 className="font-serif text-xl">{t.historyDetail.originalConcern}</h2>
            <p className="mt-3 text-base text-ink-soft">{entry.input.concern}</p>
            <label className="mt-5 block border-t border-divider pt-4 text-sm text-ink-soft">
              {t.historyDetail.tags}
              <input
                value={tags}
                onChange={(event) => {
                  setTags(event.target.value.slice(0, 200));
                  setUpdated(false);
                }}
                placeholder={t.historyDetail.tagsPlaceholder}
                className="mt-2 w-full rounded-2xl border border-divider bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
              />
            </label>
          </div>

          <div className="mt-8 space-y-6">
            {sections.map((section) => (
              <section key={section.label} className="rounded-3xl border border-divider bg-warm-bg p-5">
                <h2 className="font-serif text-xl">{section.label}</h2>
                <p className="mt-3 text-base text-ink-soft">{section.value}</p>
              </section>
            ))}
            {entry.aiPerspective && (
              <section className="rounded-3xl border border-accent/30 bg-accent-soft/30 p-5">
                <h2 className="font-serif text-xl">{t.ai.perspectives}</h2>
                <p className="mt-3 text-base text-ink-soft">{entry.aiPerspective.text}</p>
              </section>
            )}
            <section className="rounded-3xl border border-divider bg-warm-bg p-5">
              <h2 className="font-serif text-xl">{t.reading.sectionLabels.reflectionQuestions}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-ink-soft">
                {content.reflectionQuestions.map((question) => <li key={question}>{question}</li>)}
              </ul>
              {entry.reflection && (
                <div className="mt-5 border-t border-divider pt-5">
                  <p className="text-sm font-medium text-ink">{entry.reflection.question}</p>
                  <textarea
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value.slice(0, 1000));
                      setUpdated(false);
                    }}
                    rows={5}
                    className="mt-3 w-full rounded-2xl border border-divider bg-surface p-4 text-sm text-ink outline-none transition focus:border-accent"
                  />
                  {entry.reflection.followUpQuestion && (
                    <div className="mt-3 rounded-2xl bg-surface p-4 text-sm text-ink-soft">
                      <p className="text-xs uppercase tracking-[0.12em] text-accent">{t.ai.deeperQuestion}</p>
                      <p className="mt-2">{entry.reflection.followUpQuestion}</p>
                    </div>
                  )}
                </div>
              )}
            </section>
            <section className="rounded-3xl border border-divider bg-warm-bg p-5">
              <h2 className="font-serif text-xl">{t.reflection.actionHeading}</h2>
              <textarea
                value={actionText}
                onChange={(event) => {
                  setActionText(event.target.value.slice(0, 500));
                  setUpdated(false);
                }}
                rows={3}
                className="mt-3 w-full rounded-2xl border border-divider bg-surface p-4 text-sm text-ink outline-none transition focus:border-accent"
              />
              {entry.aiActionPlan && (
                <div className="mt-4 rounded-2xl bg-surface p-4 text-sm text-ink-soft">
                  <ol className="list-decimal space-y-2 pl-5">
                    {entry.aiActionPlan.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                  <p className="mt-3 font-medium text-ink">{t.ai.actionFallback}</p>
                  <p className="mt-1">{entry.aiActionPlan.fallback}</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {([
                  ['pending', t.reflection.statusPending],
                  ['completed', t.reflection.statusCompleted],
                  ['skipped', t.reflection.statusSkipped],
                ] as const).map(([status, label]) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setActionStatus(status);
                      setUpdated(false);
                    }}
                    aria-pressed={actionStatus === status}
                    className={`rounded-full border px-3 py-1.5 text-xs ${actionStatus === status ? 'border-ink bg-ink text-white' : 'border-divider bg-surface text-ink-soft'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {canFollowUp && (
                <div className="mt-5 border-t border-divider pt-5">
                  <h3 className="font-serif text-lg">{t.reflection.followUpHeading}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{t.reflection.followUpPrompt}</p>
                  <textarea
                    value={followUpNote}
                    onChange={(event) => {
                      setFollowUpNote(event.target.value.slice(0, 1000));
                      setUpdated(false);
                    }}
                    placeholder={t.reflection.followUpPlaceholder}
                    rows={4}
                    className="mt-3 w-full rounded-2xl border border-divider bg-surface p-4 text-sm text-ink outline-none transition focus:border-accent"
                  />
                </div>
              )}
              <div className="mt-5 flex items-center gap-3">
                <button type="button" onClick={handleUpdate} className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white">
                  {t.reflection.updateButton}
                </button>
                {updated && <span className="text-sm text-ok" role="status">{t.reflection.updated}</span>}
              </div>
            </section>
            {(aiAvailable || entry.futureLetter) && (
              <section className="rounded-3xl border border-accent/30 bg-accent-soft/30 p-5">
                <h2 className="font-serif text-xl">{t.ai.futureLetter}</h2>
                {entry.futureLetter ? (
                  letterUnlocked ? (
                    <p className="mt-4 whitespace-pre-line rounded-2xl bg-surface p-4 text-sm text-ink-soft">{entry.futureLetter.text}</p>
                  ) : (
                    <p className="mt-4 text-sm text-ink-soft">
                      {t.ai.letterLocked.replace('{date}', entry.futureLetter.unlockDate)}
                    </p>
                  )
                ) : entry.input.crisisDetected ? (
                  <p className="mt-4 text-sm text-danger">{t.ai.crisisUnavailable}</p>
                ) : (
                  <div className="mt-4">
                    <p className="text-xs text-ink-faint">{t.ai.dataNotice}</p>
                    <label className="mt-3 block text-sm text-ink-soft">
                      {t.ai.unlockDate}
                      <input
                        type="date"
                        min={toLocalDateString()}
                        value={unlockDate}
                        onChange={(event) => setUnlockDate(event.target.value)}
                        className="ml-3 rounded-xl border border-divider bg-surface px-3 py-2 text-sm"
                      />
                    </label>
                    <button type="button" onClick={() => void handleFutureLetter()} disabled={letterLoading || !unlockDate} className="mt-4 rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-50">
                      {letterLoading ? t.ai.toolLoading : t.ai.createLetter}
                    </button>
                    {letterError && <p className="mt-3 text-sm text-danger" role="alert">{t.ai.toolError}</p>}
                  </div>
                )}
              </section>
            )}
            <section className="rounded-3xl border border-divider bg-warm-bg p-5">
              <h2 className="font-serif text-xl">{t.reading.sectionLabels.closingLine}</h2>
              <p className="mt-3 text-base text-ink-soft">{content.closingLine}</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
