'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { useSession } from '@/hooks/useSession';

export default function HomePage() {
  const router = useRouter();
  const { setLocale } = useLocale();
  const { updateSession } = useSession();

  function selectLanguage(lang: 'en' | 'zh') {
    setLocale(lang);
    updateSession({
      locale: lang,
      dateString: new Date().toISOString().slice(0, 10),
      step: 'topic',
    });
    router.push('/topic');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-warm-bg px-5 py-12">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">

        {/* App identity */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-3xl font-medium text-ink tracking-wide">
              Heart Symbol
            </h1>
            <span className="font-serif text-2xl text-ink-soft" aria-hidden="true">·</span>
            <span className="font-serif text-3xl font-medium text-ink tracking-wide">
              心符
            </span>
          </div>
          <p className="text-sm text-ink-soft leading-relaxed max-w-[260px]">
            A quiet space to reflect on what is weighing on your heart.
          </p>
          <p className="text-sm text-ink-soft leading-relaxed max-w-[260px]" lang="zh-CN">
            一个安静的空间，让你回望心中所挂念的事。
          </p>
        </div>

        {/* Language selection */}
        <div className="w-full flex flex-col gap-4" role="group" aria-label="Choose your language">
          <p className="text-center text-xs text-ink-faint uppercase tracking-widest" aria-hidden="true">
            Choose your language · 请选择语言
          </p>
          <button
            onClick={() => selectLanguage('en')}
            lang="en"
            className={[
              'w-full h-14 rounded-2xl border border-divider bg-surface',
              'font-sans text-lg font-medium text-ink',
              'hover:border-accent hover:bg-accent-soft',
              'active:bg-accent active:text-white',
              'transition-all duration-200',
              'focus-visible:outline-2 focus-visible:outline-ink-soft focus-visible:outline-offset-2',
            ].join(' ')}
          >
            English
          </button>
          <button
            onClick={() => selectLanguage('zh')}
            lang="zh-CN"
            className={[
              'w-full h-14 rounded-2xl border border-divider bg-surface',
              'font-sans text-lg font-medium text-ink',
              'hover:border-accent hover:bg-accent-soft',
              'active:bg-accent active:text-white',
              'transition-all duration-200',
              'focus-visible:outline-2 focus-visible:outline-ink-soft focus-visible:outline-offset-2',
            ].join(' ')}
          >
            中文
          </button>
        </div>

        {/* History link */}
        <Link
          href="/history"
          className={[
            'text-sm text-ink-soft hover:text-ink transition-colors duration-200',
            'focus-visible:outline-2 focus-visible:outline-ink-soft focus-visible:outline-offset-2 rounded',
          ].join(' ')}
        >
          <span lang="en">My Readings</span>
          <span aria-hidden="true"> · </span>
          <span lang="zh-CN">我的记录</span>
        </Link>
      </div>
    </main>
  );
}
