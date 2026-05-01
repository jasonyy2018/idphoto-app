'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { setLocale } from '@/i18n/actions';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();

  const handleLanguageToggle = async () => {
    const newLocale = locale === 'zh' ? 'en' : 'zh';
    await setLocale(newLocale);
    router.refresh();
  };

  return (
    <nav className="w-full h-16 border-b border-border bg-background flex items-center justify-between px-6 md:px-12 z-50 sticky top-0">
      <Link href="/" className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
            <circle cx="12" cy="13" r="3"/>
          </svg>
        </div>
        <span className="font-bold text-lg tracking-tight">PhotoID AI</span>
      </Link>

      <div className="flex items-center gap-6 text-sm font-medium">
        <Link href="/" className="text-foreground/80 hover:text-foreground transition-colors">{t('home')}</Link>
        <Link href="/admin" className="text-foreground/80 hover:text-error transition-colors flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-error"></span> Admin
        </Link>
        
        <button 
          onClick={handleLanguageToggle}
          className="ml-2 px-3 py-1.5 rounded-full border border-border hover:border-primary/50 text-foreground/80 hover:text-primary transition-all text-xs font-mono"
        >
          {locale === 'zh' ? 'English' : '中文'}
        </button>
      </div>
    </nav>
  );
}
