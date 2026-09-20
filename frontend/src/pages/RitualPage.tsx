import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/hooks/useTranslation';

export default function RitualPage() {
  const navigate = useNavigate();
  const { session, updateSession } = useSession();
  const { t } = useTranslation();

  useEffect(() => {
    if (!session) {
      navigate('/', { replace: true });
      return;
    }
    if (!session.topic || !session.concern || !session.emotion) {
      navigate('/topic', { replace: true });
    }
  }, [navigate, session]);

  if (!session || !session.topic || !session.concern || !session.emotion) return null;

  const continueToDraw = () => {
    updateSession({ step: 'draw' });
    navigate('/draw');
  };

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-8 text-ink">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/emotion')}
            className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft transition hover:border-accent hover:text-ink"
          >
            {t.nav.back}
          </button>
          <span className="text-sm text-ink-soft">{t.progress.stepOf.replace('{step}', '4').replace('{total}', '5')}</span>
        </div>

        <div className="rounded-[32px] border border-divider bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">{t.ritual.heading}</h1>

          <div className="mt-8 rounded-3xl bg-warm-bg p-6 text-base leading-8 text-ink-soft sm:text-lg">
            {t.ritual.prompt.split('\n').map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={continueToDraw}
              className="rounded-full bg-ink px-6 py-3 text-base font-medium text-white transition hover:bg-ink/90"
            >
              {t.ritual.ready}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
