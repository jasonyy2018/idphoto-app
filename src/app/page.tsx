import Link from 'next/link';
import { db } from '@/lib/db';
import { specTemplates } from '@/lib/db/schema';
import { getLocale, getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('home');
  const locale = await getLocale();
  const templates = await db.select().from(specTemplates).orderBy(specTemplates.id);

  return (
    <div className="flex flex-col items-center flex-1 w-full max-w-6xl mx-auto px-6 py-12 md:py-24 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center space-y-6 max-w-3xl">
        <div className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          ✨ {t('badge')}
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
          {t('title')}
        </h1>
        <p className="text-lg md:text-xl text-foreground/60 max-w-2xl leading-relaxed">
          {t('subtitle')}
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-4 pt-6">
          <Link href="/upload" className="px-8 py-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transform hover:-translate-y-1">
            {t('uploadBtn')}
          </Link>
          <Link href="#" className="px-8 py-4 rounded-xl border border-border hover:border-foreground/50 hover:bg-panel transition-all font-medium text-foreground/80 hover:text-foreground">
            {t('apiDocsBtn')}
          </Link>
        </div>
      </div>

      {/* Formats Grid */}
      <div className="w-full mt-24 md:mt-32">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-border/50">
          <h2 className="text-2xl font-bold">{t('formatsTitle')}</h2>
          <span className="text-sm text-foreground/50 font-mono bg-panel px-3 py-1 rounded-full border border-border">
            {t('formatsCount')}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((tpl) => (
            <div key={tpl.id} className="p-6 rounded-2xl bg-panel border border-border hover:border-primary/50 hover:bg-panel-hover transition-all flex flex-col items-start text-left gap-5 group cursor-default">
              <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center border border-border group-hover:border-primary/30 transition-colors shadow-inner">
                <div className={`w-3 h-3 rounded-full shadow-[0_0_8px_currentColor] ${getCategoryColor(tpl.category)}`} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1.5 group-hover:text-primary transition-colors">
                  {locale === 'zh' ? tpl.name : tpl.nameEn}
                </h3>
                <p className="text-xs text-foreground/50 font-mono tracking-tight bg-background/50 px-2 py-1 rounded inline-block border border-border/50">
                  {tpl.widthMm}×{tpl.heightMm}mm · {tpl.dpi} DPI
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getCategoryColor(category: string) {
  switch(category) {
    case 'passport': return 'bg-primary text-primary';
    case 'gaokao': return 'bg-warning text-warning';
    case 'visa': return 'bg-blue-500 text-blue-500';
    case 'study_abroad': return 'bg-success text-success';
    default: return 'bg-foreground text-foreground';
  }
}
