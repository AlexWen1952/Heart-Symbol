'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/hooks/useTranslation';
import { detectCrisis } from '@/lib/crisisDetection';
import { validateConcern } from '@/lib/concern';

export default function ConcernPage() {
  const router = useRouter();
  const { session, updateSession } = useSession();
  const { t } = useTranslation();
  const [value, setValue] = useState(session?.concern ?? '');
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);

  useEffect(() => {
    if (!session) {
      router.replace('/');
      return;
    }
    if (!session.topic) {
      router.replace('/topic');
      return;
    }
    setValue((current) => current || session.concern || '');
  }, [router, session]);

  const validation = useMemo(() => validateConcern(value), [value]);
  const crisisDetected = useMemo(() => detectCrisis(value), [value]);

  useEffect(() => {
    setShowCrisisBanner(crisisDetected);
  }, [crisisDetected]);

  if (!session || !session.topic) return null;

  const handleContinue = () => {
    const trimmed = value.trim();
    const result = validateConcern(trimmed);
    if (!result.isValid) {
      return;
    }
    const crisis = detectCrisis(trimmed);
    updateSession({ concern: trimmed, crisisDetected: crisis, step: 'emotion' });
    router.push('/emotion');
  };

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/topic')}
            className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
          >
            {t.nav.back}
          </button>
          <span className="text-sm text-ink-soft">{t.progress.stepOf.replace('{step}', '2').replace('{total}', '5')}</span>
        </div>

        <div className="rounded-[32px] border border-divider bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{t.concern.heading}</h1>
          <p className="mt-3 text-base text-ink-soft">{t.concern.subheading}</p>

          {showCrisisBanner && (
            <div className="mt-6 rounded-2xl border border-danger/30 bg-red-50 p-4 text-sm text-red-900">
              <p>{t.concern.crisisBanner}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <a href="https://www.findahelpline.com" target="_blank" rel="noreferrer" className="font-medium underline">
                  {t.concern.crisisLink}
                </a>
                <button type="button" onClick={() => setShowCrisisBanner(false)} className="text-sm font-medium text-red-700">
                  {t.concern.dismissBanner}
                </button>
              </div>
            </div>
          )}

          <label className="mt-6 block">
            <span className="sr-only">{t.concern.heading}</span>
            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value.slice(0, 300))}
              placeholder={t.concern.placeholder}
              rows={8}
              className="w-full rounded-3xl border border-divider bg-warm-bg p-4 text-base text-ink outline-none transition focus:border-accent"
            />
          </label>

          <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
            <span className={validation.isValid ? 'text-ok' : 'text-ink-soft'}>
              {t.concern.charactersRemaining.replace('{n}', String(Math.max(0, 300 - value.length)))}
            </span>
            {!validation.isValid && value.trim().length > 0 && (
              <span className="text-danger">Please write at least 10 characters.</span>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!validation.isValid}
              className="rounded-full bg-ink px-6 py-3 text-base font-medium text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/30"
            >
              {t.concern.continue}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
