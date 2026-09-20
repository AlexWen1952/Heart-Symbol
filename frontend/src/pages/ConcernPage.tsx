import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/hooks/useTranslation';
import { validateConcern } from '@/lib/api';

const MAX = 300;
const MIN = 10;

export default function ConcernPage() {
  const navigate = useNavigate();
  const { session, updateSession } = useSession();
  const { t } = useTranslation();
  const [value, setValue] = useState(session?.concern ?? '');
  const [crisisDetected, setCrisisDetected] = useState(false);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
      return;
    }
    if (!session.topic) {
      navigate('/topic', { replace: true });
    }
  }, [navigate, session]);

  // Debounced server-side validation + crisis detection.
  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    const handle = setTimeout(() => {
      validateConcern(value)
        .then((res) => {
          setCrisisDetected(res.crisisDetected);
          if (res.crisisDetected) setShowCrisisBanner(true);
        })
        .catch(() => {
          /* network hiccup — non-blocking */
        });
    }, 300);
    return () => clearTimeout(handle);
  }, [value]);

  if (!session || !session.topic) return null;

  const trimmedLength = value.trim().length;
  const isValid = trimmedLength >= MIN && value.length <= MAX;

  const handleContinue = async () => {
    const trimmed = value.trim();
    if (trimmed.length < MIN) return;
    let crisis = crisisDetected;
    try {
      const res = await validateConcern(trimmed);
      if (!res.validation.isValid) return;
      crisis = res.crisisDetected;
    } catch {
      // If the backend is unreachable, fall back to the client length check.
    }
    updateSession({ concern: trimmed, crisisDetected: crisis, step: 'emotion' });
    navigate('/emotion');
  };

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/topic')}
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
              onChange={(event) => {
                const next = event.target.value.slice(0, MAX);
                setValue(next);
                if (!next.trim()) setCrisisDetected(false);
              }}
              placeholder={t.concern.placeholder}
              rows={8}
              className="w-full rounded-3xl border border-divider bg-warm-bg p-4 text-base text-ink outline-none transition focus:border-accent"
            />
          </label>

          <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
            <span className={isValid ? 'text-ok' : 'text-ink-soft'}>
              {t.concern.charactersRemaining.replace('{n}', String(Math.max(0, MAX - value.length)))}
            </span>
            {!isValid && trimmedLength > 0 && (
              <span className="text-danger">{t.concern.minimumCharacters.replace('{n}', String(MIN))}</span>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!isValid}
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
