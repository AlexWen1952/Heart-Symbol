import { Link, useNavigate } from 'react-router-dom';
import { useHistory } from '@/hooks/useHistory';
import { useLocale } from '@/hooks/useLocale';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/hooks/useTranslation';
import {
  calculateStreak,
  getLocalMonthDays,
  isDateBefore,
  localDateFromTimestamp,
  toLocalDateString,
} from '@/lib/date';

const STEP_ROUTES = {
  topic: '/topic',
  concern: '/concern',
  emotion: '/emotion',
  ritual: '/ritual',
  draw: '/draw',
  reading: '/reading',
} as const;

export default function HomePage() {
  const navigate = useNavigate();
  const { setLocale } = useLocale();
  const { t } = useTranslation();
  const { history } = useHistory();
  const { session, updateSession, clearSession } = useSession();

  const recordedDates = new Set(history.map((entry) => localDateFromTimestamp(entry.savedAt)));
  const streak = calculateStreak([...recordedDates]);
  const monthDays = getLocalMonthDays();
  const monthOffset = monthDays.length
    ? new Date(`${monthDays[0]}T12:00:00`).getDay()
    : 0;
  const discovered = new Set(history.map((entry) => entry.result.symbolMeta.id)).size;
  const pending = [...history]
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .find((entry) => (
      entry.action?.status === 'pending' &&
      isDateBefore(localDateFromTimestamp(entry.savedAt), toLocalDateString())
    ));
  const continuePath = session && session.step !== 'topic' ? STEP_ROUTES[session.step] : null;

  function selectLanguage(lang: 'en' | 'zh') {
    clearSession();
    setLocale(lang);
    updateSession({
      locale: lang,
      dateString: toLocalDateString(),
      step: 'topic',
    });
    navigate('/topic');
  }

  return (
    <main className="min-h-screen bg-warm-bg px-5 py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8">
        {/* App identity */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-3xl font-medium tracking-wide text-ink">Heart Symbol</h1>
            <span className="font-serif text-2xl text-ink-soft" aria-hidden="true">·</span>
            <span className="font-serif text-3xl font-medium tracking-wide text-ink">心符</span>
          </div>
          <p className="max-w-[300px] text-sm leading-relaxed text-ink-soft">
            A quiet space to reflect on what is weighing on your heart.
          </p>
          <p className="max-w-[300px] text-sm leading-relaxed text-ink-soft" lang="zh-CN">
            一个安静的空间，让你回望心中所挂念的事。
          </p>
        </div>

        {(history.length > 0 || continuePath) && (
          <section className="w-full rounded-[28px] border border-divider bg-surface p-5 shadow-sm sm:p-6">
            <h2 className="font-serif text-2xl text-ink">{t.daily.heading}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-warm-bg p-4 text-sm text-ink-soft">
                {t.daily.streak.replace('{n}', String(streak))}
              </div>
              <div className="rounded-2xl bg-warm-bg p-4 text-sm text-ink-soft">
                {t.daily.discovered.replace('{n}', String(discovered))}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1.5" aria-label={new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}>
              {Array.from({ length: monthOffset }, (_, index) => <span key={`empty-${index}`} />)}
              {monthDays.map((date) => {
                const recorded = recordedDates.has(date);
                const today = date === toLocalDateString();
                return (
                  <span
                    key={date}
                    title={date}
                    className={`flex aspect-square items-center justify-center rounded-lg text-[10px] ${recorded ? 'bg-accent text-white' : today ? 'border border-accent text-accent' : 'bg-warm-bg text-ink-faint'}`}
                  >
                    {Number(date.slice(-2))}
                  </span>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {continuePath && (
                <Link to={continuePath} className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">
                  {t.daily.continueDraft}
                </Link>
              )}
              {pending && (
                <Link to={`/history/${pending.id}`} className="rounded-full border border-accent bg-accent-soft px-4 py-2 text-sm text-ink">
                  {t.daily.pendingAction}
                </Link>
              )}
              <Link to="/collection" className="rounded-full border border-divider bg-surface px-4 py-2 text-sm text-ink-soft hover:border-accent">
                {t.daily.collectionLink}
              </Link>
            </div>
          </section>
        )}

        {/* Language selection */}
        <div className="flex w-full max-w-sm flex-col gap-4" role="group" aria-label="Choose your language">
          <p className="text-center text-xs uppercase tracking-widest text-ink-faint" aria-hidden="true">
            Choose your language · 请选择语言
          </p>
          <button
            type="button"
            onClick={() => selectLanguage('en')}
            lang="en"
            className="h-14 w-full rounded-2xl border border-divider bg-surface font-sans text-lg font-medium text-ink transition-all duration-200 hover:border-accent hover:bg-accent-soft active:bg-accent active:text-white"
          >
            English
          </button>
          <button
            type="button"
            onClick={() => selectLanguage('zh')}
            lang="zh-CN"
            className="h-14 w-full rounded-2xl border border-divider bg-surface font-sans text-lg font-medium text-ink transition-all duration-200 hover:border-accent hover:bg-accent-soft active:bg-accent active:text-white"
          >
            中文
          </button>
        </div>

        {/* History link */}
        <Link
          to="/history"
          className="rounded text-sm text-ink-soft transition-colors duration-200 hover:text-ink"
        >
          <span lang="en">My Readings</span>
          <span aria-hidden="true"> · </span>
          <span lang="zh-CN">我的记录</span>
        </Link>
      </div>
    </main>
  );
}
