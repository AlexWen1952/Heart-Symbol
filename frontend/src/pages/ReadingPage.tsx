import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHistory } from '@/hooks/useHistory';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/hooks/useTranslation';
import { generateId } from '@/lib/uuid';
import {
  clearAIDraft,
  createAIFingerprint,
  readAIDraft,
  writeAIDraft,
} from '@/lib/aiDraft';
import {
  clearReflectionDraft,
  createReflectionFingerprint,
  readReflectionDraft,
  writeReflectionDraft,
} from '@/lib/reflectionDraft';
import {
  generateActionPlan,
  generateDeepDive,
  generatePerspective,
  generateReading,
  getAIAvailability,
  generateAINarrative,
} from '@/lib/api';
import type { AITone } from '@/lib/api';
import type {
  ActionStatus,
  AIActionPlan,
  AIPerspective,
  AIReadingResult,
  ReadingResult,
  SavedReading,
} from '@/types/reading';

const AI_SECTION_COUNT = 6;

export default function ReadingPage() {
  const navigate = useNavigate();
  const { session, clearSession } = useSession();
  const { history, saveReading } = useHistory();
  const { t, locale } = useTranslation();

  const [reading, setReading] = useState<ReadingResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<0 | 1 | 2 | null>(null);
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [actionText, setActionText] = useState('');
  const [actionStatus, setActionStatus] = useState<ActionStatus>('pending');
  const [actionEdited, setActionEdited] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [perspective, setPerspective] = useState<AIPerspective | null>(null);
  const [actionPlan, setActionPlan] = useState<AIActionPlan | null>(null);
  const [toolLoading, setToolLoading] = useState<string | null>(null);
  const [toolError, setToolError] = useState(false);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [aiNarrative, setAiNarrative] = useState<AIReadingResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [showPersonalized, setShowPersonalized] = useState(false);
  const [tone, setTone] = useState<AITone>('gentle');
  const [revealedSections, setRevealedSections] = useState(AI_SECTION_COUNT);
  const autoRequested = useRef(false);
  const draftLoaded = useRef(false);
  const skipDraftWrite = useRef(true);
  const aiRequestId = useRef(0);
  const aiController = useRef<AbortController | null>(null);

  const ready = Boolean(
    session && session.topic && session.emotion && session.symbolId && session.concern,
  );

  useEffect(() => {
    if (!ready) {
      navigate('/draw', { replace: true });
    }
  }, [ready, navigate]);

  useEffect(() => {
    if (!ready || !session) return;
    let active = true;
    generateReading({
      topic: session.topic!,
      emotion: session.emotion!,
      symbolId: session.symbolId!,
      locale: session.locale,
      concern: session.concern,
      crisisDetected: !!session.crisisDetected,
    })
      .then((res) => active && setReading(res))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [ready, session]);

  useEffect(() => {
    let active = true;
    getAIAvailability()
      .then((available) => active && setAiAvailable(available))
      .catch(() => active && setAiAvailable(false));
    return () => {
      active = false;
    };
  }, []);

  const requestPersonalization = useCallback(async (
    requestedTone: AITone = tone,
    force = false,
  ) => {
    if (!session || !reading) return;
    const input = {
      topic: session.topic!,
      emotion: session.emotion!,
      symbolId: session.symbolId!,
      concern: session.concern ?? '',
      locale: session.locale,
      dateString: session.dateString,
      crisisDetected: !!session.crisisDetected,
    };
    const fingerprint = createAIFingerprint(input, requestedTone);
    const cached = force ? null : readAIDraft(fingerprint);
    if (cached) {
      setAiNarrative(cached);
      setShowPersonalized(true);
      setRevealedSections(AI_SECTION_COUNT);
      setAiError(false);
      return;
    }

    aiController.current?.abort();
    const controller = new AbortController();
    const requestId = aiRequestId.current + 1;
    aiController.current = controller;
    aiRequestId.current = requestId;
    setAiLoading(true);
    setAiError(false);
    try {
      const res = await generateAINarrative(input, reading, requestedTone, controller.signal);
      if (requestId !== aiRequestId.current) return;
      if (res.ok && res.narrative) {
        writeAIDraft(fingerprint, res.narrative);
        setAiNarrative(res.narrative);
        setShowPersonalized(true);
        setRevealedSections(0);
      } else {
        setAiError(true);
      }
    } catch (error) {
      if (requestId !== aiRequestId.current) return;
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setAiError(true);
      }
    } finally {
      if (requestId === aiRequestId.current) setAiLoading(false);
    }
  }, [reading, session, tone]);

  useEffect(() => {
    if (!aiAvailable || !reading || !session || autoRequested.current) return;
    autoRequested.current = true;
    void requestPersonalization();
  }, [aiAvailable, reading, requestPersonalization, session]);

  useEffect(() => () => aiController.current?.abort(), []);

  useEffect(() => {
    if (!showPersonalized || !aiNarrative || revealedSections >= AI_SECTION_COUNT) return;
    const timer = window.setTimeout(() => {
      setRevealedSections((count) => Math.min(count + 1, AI_SECTION_COUNT));
    }, 260);
    return () => window.clearTimeout(timer);
  }, [aiNarrative, revealedSections, showPersonalized]);

  const displayed = useMemo(() => {
    if (showPersonalized && aiNarrative) {
      return {
        emotionalMirror: aiNarrative.emotionalMirror,
        symbolMeaning: aiNarrative.symbolMeaning,
        possibleBlindSpot: aiNarrative.possibleBlindSpot,
        reflectionQuestions: aiNarrative.reflectionQuestions,
        oneActionForToday: aiNarrative.oneActionForToday,
        closingLine: aiNarrative.closingLine,
      };
    }
    return reading;
  }, [showPersonalized, aiNarrative, reading]);

  useEffect(() => {
    if (!actionEdited && displayed?.oneActionForToday) {
      setActionText(displayed.oneActionForToday);
    }
  }, [actionEdited, displayed]);

  useEffect(() => {
    if (!session || !reading || draftLoaded.current) return;
    const draft = readReflectionDraft(createReflectionFingerprint(session));
    if (draft) {
      setSelectedQuestion(draft.selectedQuestion);
      setReflectionAnswer(draft.reflectionAnswer);
      setActionText(draft.actionText);
      setActionStatus(draft.actionStatus);
      setActionEdited(draft.actionEdited);
    }
    draftLoaded.current = true;
  }, [reading, session]);

  useEffect(() => {
    if (!session || !draftLoaded.current) return;
    if (skipDraftWrite.current) {
      skipDraftWrite.current = false;
      return;
    }
    writeReflectionDraft({
      fingerprint: createReflectionFingerprint(session),
      selectedQuestion,
      reflectionAnswer,
      actionText,
      actionStatus,
      actionEdited,
    });
  }, [actionEdited, actionStatus, actionText, reflectionAnswer, selectedQuestion, session]);

  if (!ready || !session || !reading || !displayed) {
    return (
      <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-divider bg-surface p-8 text-ink-soft">…</div>
      </main>
    );
  }

  const aiInput = {
    topic: session.topic!,
    emotion: session.emotion!,
    symbolId: session.symbolId!,
    concern: session.concern ?? '',
    locale: session.locale,
    dateString: session.dateString,
    crisisDetected: !!session.crisisDetected,
  };

  const handlePersonalize = () => {
    if (aiNarrative) {
      setShowPersonalized((visible) => !visible);
      return;
    }
    void requestPersonalization();
  };

  const handleToneChange = (nextTone: AITone) => {
    setTone(nextTone);
    void requestPersonalization(nextTone);
  };

  const handleDeepDive = async () => {
    if (selectedQuestion === null || !reflectionAnswer.trim() || session.crisisDetected) return;
    setToolLoading('deep');
    setToolError(false);
    try {
      const response = await generateDeepDive(
        aiInput,
        reading,
        displayed.reflectionQuestions[selectedQuestion],
        reflectionAnswer.trim(),
      );
      if (response.ok && response.followUpQuestion) {
        setFollowUpQuestion(response.followUpQuestion);
      } else {
        setToolError(true);
      }
    } catch {
      setToolError(true);
    } finally {
      setToolLoading(null);
    }
  };

  const handlePerspective = async (kind: AIPerspective['perspective']) => {
    if (session.crisisDetected) return;
    setToolLoading('perspective');
    setToolError(false);
    try {
      const response = await generatePerspective(aiInput, reading, kind);
      if (response.ok && response.text) {
        setPerspective({ perspective: kind, text: response.text });
      } else {
        setToolError(true);
      }
    } catch {
      setToolError(true);
    } finally {
      setToolLoading(null);
    }
  };

  const handleActionPlan = async () => {
    if (!actionText.trim() || session.crisisDetected) return;
    setToolLoading('action');
    setToolError(false);
    try {
      const response = await generateActionPlan(aiInput, reading, actionText.trim());
      if (response.ok && response.steps?.length === 3 && response.fallback) {
        setActionPlan({ steps: response.steps, fallback: response.fallback });
      } else {
        setToolError(true);
      }
    } catch {
      setToolError(true);
    } finally {
      setToolLoading(null);
    }
  };

  const handleSave = () => {
    if (saved) return;
    setSaveError(false);
    const now = new Date().toISOString();
    const entry: SavedReading = {
      version: 2,
      id: generateId(),
      savedAt: now,
      input: {
        topic: session.topic!,
        emotion: session.emotion!,
        symbolId: session.symbolId!,
        concern: session.concern ?? '',
        locale: session.locale,
        dateString: session.dateString,
        crisisDetected: !!session.crisisDetected,
      },
      result: reading,
      aiNarrative: aiNarrative ?? null,
      reflection: selectedQuestion !== null && reflectionAnswer.trim()
        ? {
            questionIndex: selectedQuestion,
            question: displayed.reflectionQuestions[selectedQuestion],
            answer: reflectionAnswer.trim(),
            updatedAt: now,
            followUpQuestion: followUpQuestion || undefined,
          }
        : undefined,
      action: actionText.trim()
        ? {
            text: actionText.trim(),
            status: actionStatus,
            updatedAt: now,
          }
        : undefined,
      aiPerspective: perspective ?? undefined,
      aiActionPlan: actionPlan ?? undefined,
    };
    if (saveReading(entry).ok) {
      clearReflectionDraft();
      setSaved(true);
    } else {
      setSaveError(true);
    }
  };

  const handleNewReading = () => {
    aiController.current?.abort();
    clearAIDraft();
    clearReflectionDraft();
    clearSession();
    navigate('/');
  };

  const sections = [
    { label: t.reading.sectionLabels.emotionalMirror, value: displayed.emotionalMirror },
    { label: t.reading.sectionLabels.symbolMeaning, value: displayed.symbolMeaning },
    { label: t.reading.sectionLabels.possibleBlindSpot, value: displayed.possibleBlindSpot },
  ];
  const tones: Array<{ value: AITone; label: string }> = [
    { value: 'gentle', label: t.ai.toneGentle },
    { value: 'direct', label: t.ai.toneDirect },
    { value: 'poetic', label: t.ai.tonePoetic },
  ];
  const isRevealing = showPersonalized && revealedSections < AI_SECTION_COUNT;
  const isVisible = (index: number) => !showPersonalized || index < revealedSections;

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/draw')}
            className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
          >
            {t.nav.back}
          </button>
          <button type="button" onClick={handleNewReading} className="text-sm text-ink-soft hover:text-ink">
            {t.nav.startNew}
          </button>
        </div>

        <div className={`rounded-[32px] border bg-surface p-6 shadow-sm transition sm:p-8 ${showPersonalized ? 'ai-glow border-accent/50' : 'border-divider'}`}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-ink-faint">{t.reading.symbolDrawn}</p>
              <h1 className="mt-2 font-serif text-3xl sm:text-4xl">{reading.symbolMeta.names[locale]}</h1>
            </div>
            <div className="rounded-full border border-divider bg-warm-bg px-4 py-2 text-sm text-ink-soft">
              {session.topic} · {session.emotion}
            </div>
          </div>

          {/* AI personalization controls */}
          {aiAvailable && (
            <div className="mb-6 rounded-3xl border border-accent/40 bg-accent-soft/45 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="ai-sparkle text-accent" aria-hidden="true">✦</span>
                <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">
                  {t.ai.toneLabel}
                </span>
                <div className="flex rounded-full border border-divider bg-surface p-1">
                  {tones.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleToneChange(item.value)}
                      disabled={aiLoading}
                      aria-pressed={tone === item.value}
                      className={`rounded-full px-3 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-50 ${tone === item.value ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                  {aiNarrative && (
                    <button
                      type="button"
                      onClick={() => void requestPersonalization(tone, true)}
                      disabled={aiLoading}
                      className="rounded-full border border-accent bg-surface px-4 py-2 text-sm text-ink-soft transition hover:bg-accent hover:text-white disabled:opacity-50"
                    >
                      {t.ai.regenerate}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handlePersonalize}
                    disabled={aiLoading}
                    className="rounded-full border border-accent bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-ink disabled:opacity-60"
                  >
                    {aiLoading
                      ? t.ai.personalizing
                      : aiNarrative
                        ? showPersonalized
                          ? t.ai.viewingPersonalized
                          : t.ai.viewingOriginal
                        : t.ai.personalizeButton}
                  </button>
                </div>
              </div>
              {aiLoading && (
                <div className="ai-shimmer mt-4 rounded-2xl border border-accent/30 px-4 py-3 text-sm text-ink-soft" role="status">
                  <span className="ai-sparkle mr-2 text-accent" aria-hidden="true">✦</span>
                  {t.ai.generating}
                </div>
              )}
              {aiError && <p className="mt-3 text-xs text-danger" role="alert">{t.ai.error}</p>}
            </div>
          )}
          {aiAvailable === false && (
            <p className="mb-6 text-xs text-ink-faint">{t.ai.unavailable}</p>
          )}
          {aiNarrative && showPersonalized && (
            <div className="mb-5 flex items-center gap-2">
              <span className="rounded-full bg-ink px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-white">
                {t.ai.personalizedBadge}
              </span>
              {isRevealing && <span className="ai-caret text-xs text-ink-faint">{t.ai.generating}</span>}
            </div>
          )}

          <div className="space-y-6" aria-live="polite">
            {sections.map((section, index) => isVisible(index) && (
              <section key={section.label} className={showPersonalized ? 'animate-ai-reveal rounded-3xl border border-accent/30 bg-warm-bg p-5' : 'rounded-3xl border border-divider bg-warm-bg p-5'}>
                <h2 className="font-serif text-xl">{section.label}</h2>
                <p className="mt-3 text-base text-ink-soft">{section.value}</p>
              </section>
            ))}

            {isVisible(3) && aiAvailable && (
              <section className="rounded-3xl border border-accent/30 bg-accent-soft/30 p-5">
                <h2 className="font-serif text-xl">{t.ai.perspectives}</h2>
                <p className="mt-2 text-xs text-ink-faint">{t.ai.dataNotice}</p>
                {session.crisisDetected ? (
                  <p className="mt-4 text-sm text-danger">{t.ai.crisisUnavailable}</p>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {([
                      ['friend', t.ai.perspectiveFriend],
                      ['pragmatic', t.ai.perspectivePragmatic],
                      ['selfCompassion', t.ai.perspectiveSelfCompassion],
                    ] as const).map(([kind, label]) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => void handlePerspective(kind)}
                        disabled={toolLoading !== null}
                        className="rounded-full border border-accent bg-surface px-4 py-2 text-sm text-ink-soft disabled:opacity-50"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                {toolLoading === 'perspective' && <p className="mt-4 text-sm text-ink-soft" role="status">{t.ai.toolLoading}</p>}
                {perspective && <p className="mt-4 rounded-2xl bg-surface p-4 text-sm text-ink-soft">{perspective.text}</p>}
              </section>
            )}

            {isVisible(3) && (
              <section className={showPersonalized ? 'animate-ai-reveal rounded-3xl border border-accent/30 bg-warm-bg p-5' : 'rounded-3xl border border-divider bg-warm-bg p-5'}>
                <h2 className="font-serif text-xl">{t.reflection.heading}</h2>
                <p className="mt-2 text-sm text-ink-soft">{t.reflection.subheading}</p>
                <div className="mt-4 space-y-3">
                  {displayed.reflectionQuestions.map((question, index) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => {
                        if (selectedQuestion !== index) setReflectionAnswer('');
                        setSelectedQuestion(index as 0 | 1 | 2);
                      }}
                      aria-pressed={selectedQuestion === index}
                      className={`w-full rounded-2xl border p-4 text-left text-sm transition ${selectedQuestion === index ? 'border-accent bg-accent-soft text-ink' : 'border-divider bg-surface text-ink-soft hover:border-accent'}`}
                    >
                      {question}
                    </button>
                  ))}
                </div>
                {selectedQuestion !== null && (
                  <div>
                    <textarea
                      value={reflectionAnswer}
                      onChange={(event) => setReflectionAnswer(event.target.value.slice(0, 1000))}
                      placeholder={t.reflection.answerPlaceholder}
                      rows={5}
                      className="mt-4 w-full rounded-2xl border border-divider bg-surface p-4 text-sm text-ink outline-none transition focus:border-accent"
                    />
                    {aiAvailable && !session.crisisDetected && (
                      <button
                        type="button"
                        onClick={() => void handleDeepDive()}
                        disabled={!reflectionAnswer.trim() || toolLoading !== null || !!followUpQuestion}
                        className="mt-3 rounded-full border border-accent bg-surface px-4 py-2 text-sm text-ink-soft disabled:opacity-40"
                      >
                        {toolLoading === 'deep' ? t.ai.toolLoading : t.ai.deepDive}
                      </button>
                    )}
                    {followUpQuestion && (
                      <div className="mt-4 rounded-2xl border border-accent/30 bg-surface p-4">
                        <p className="text-xs uppercase tracking-[0.12em] text-accent">{t.ai.deeperQuestion}</p>
                        <p className="mt-2 text-sm text-ink-soft">{followUpQuestion}</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {isVisible(4) && (
              <section className={showPersonalized ? 'animate-ai-reveal rounded-3xl border border-accent/30 bg-warm-bg p-5' : 'rounded-3xl border border-divider bg-warm-bg p-5'}>
                <h2 className="font-serif text-xl">{t.reflection.actionHeading}</h2>
                <textarea
                  value={actionText}
                  onChange={(event) => {
                    setActionText(event.target.value.slice(0, 500));
                    setActionEdited(true);
                  }}
                  placeholder={t.reflection.actionPlaceholder}
                  rows={3}
                  className="mt-3 w-full rounded-2xl border border-divider bg-surface p-4 text-sm text-ink outline-none transition focus:border-accent"
                />
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-xs uppercase tracking-[0.12em] text-ink-faint">{t.reflection.statusLabel}</span>
                  {([
                    ['pending', t.reflection.statusPending],
                    ['completed', t.reflection.statusCompleted],
                    ['skipped', t.reflection.statusSkipped],
                  ] as const).map(([status, label]) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setActionStatus(status)}
                      aria-pressed={actionStatus === status}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${actionStatus === status ? 'border-ink bg-ink text-white' : 'border-divider bg-surface text-ink-soft hover:border-accent'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {aiAvailable && !session.crisisDetected && (
                  <button
                    type="button"
                    onClick={() => void handleActionPlan()}
                    disabled={!actionText.trim() || toolLoading !== null}
                    className="mt-4 rounded-full border border-accent bg-surface px-4 py-2 text-sm text-ink-soft disabled:opacity-40"
                  >
                    {toolLoading === 'action' ? t.ai.toolLoading : t.ai.actionPlan}
                  </button>
                )}
                {actionPlan && (
                  <div className="mt-4 rounded-2xl bg-surface p-4 text-sm text-ink-soft">
                    <ol className="list-decimal space-y-2 pl-5">
                      {actionPlan.steps.map((step) => <li key={step}>{step}</li>)}
                    </ol>
                    <p className="mt-4 font-medium text-ink">{t.ai.actionFallback}</p>
                    <p className="mt-1">{actionPlan.fallback}</p>
                  </div>
                )}
                <p className="mt-3 text-xs text-ink-faint">{t.reflection.savedHint}</p>
              </section>
            )}

            {isVisible(5) && (
              <section className={showPersonalized ? 'animate-ai-reveal rounded-3xl border border-accent/30 bg-warm-bg p-5' : 'rounded-3xl border border-divider bg-warm-bg p-5'}>
                <h2 className="font-serif text-xl">{t.reading.sectionLabels.closingLine}</h2>
                <p className="mt-3 text-base text-ink-soft">{displayed.closingLine}</p>
              </section>
            )}
          </div>

          {toolError && <p className="mt-5 text-sm text-danger" role="alert">{t.ai.toolError}</p>}

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleSave}
              disabled={saved}
              className="rounded-full bg-ink px-6 py-3 text-base font-medium text-white transition hover:bg-ink/90 disabled:opacity-50"
            >
              {t.reading.saveButton}
            </button>
            <div className={`text-sm ${saveError ? 'text-danger' : 'text-ink-soft'}`} role={saveError ? 'alert' : undefined}>
              {saveError
                ? t.reading.saveError
                : saved
                  ? t.reading.savedConfirmation
                  : t.reading.savedCount.replace('{n}', String(history.length))}
            </div>
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
