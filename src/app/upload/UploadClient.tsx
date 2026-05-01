'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { SpecTemplate } from '@/lib/db/schema';
import { PhotoUploader } from '@/components/ui/PhotoUploader';
import { submitPhoto } from './actions';

export function UploadClient({ templates, locale }: { templates: SpecTemplate[], locale: string }) {
  const t = useTranslations('upload');
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number>(templates[0]?.id || 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File, base64: string) => {
    setIsProcessing(true);
    setError(null);
    
    const result = await submitPhoto(selectedId, base64);
    
    if (result.success && result.data) {
      router.push(`/result/${result.data.orderId}`);
    } else {
      setError(result.error || 'Upload failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Steps Navigation */}
      <div className="flex items-center gap-2 md:gap-4 mb-12 text-sm md:text-base font-medium">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/30">
          <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">1</span>
          {t('steps.select')}
        </div>
        <div className="text-border">→</div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border border-border ${isProcessing ? 'bg-primary text-white border-primary' : 'text-foreground/50'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isProcessing ? 'bg-white text-primary' : 'bg-border text-background'}`}>2</span>
          {t('steps.processing')}
        </div>
        <div className="text-border">→</div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-foreground/50">
          <span className="w-5 h-5 rounded-full bg-border text-background flex items-center justify-center text-xs">3</span>
          {t('steps.download')}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8">
        
        {/* Left: Template List */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{t('chooseFormat')}</h2>
            <p className="text-foreground/50 text-sm mb-6">{t('chooseFormatSub')}</p>
          </div>
          
          <div className="flex flex-col gap-3">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedId(tpl.id)}
                disabled={isProcessing}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                  selectedId === tpl.id 
                    ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                    : 'border-border bg-panel hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(tpl.category)}`} />
                  <div>
                    <h3 className={`font-bold ${selectedId === tpl.id ? 'text-primary' : 'text-foreground'}`}>
                      {locale === 'zh' ? tpl.name : tpl.nameEn}
                    </h3>
                    <p className="text-xs text-foreground/50 font-mono mt-1">
                      {tpl.widthMm}×{tpl.heightMm}mm · {tpl.dpi} DPI · {formatSpecDesc(tpl.category)}
                    </p>
                  </div>
                </div>
                {selectedId === tpl.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Dropzone */}
        <div className="flex flex-col gap-4">
          <PhotoUploader onFileSelect={handleFileSelect} disabled={isProcessing} />
          
          {error && (
             <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
               Error: {error}
             </div>
          )}
          
          <div className="flex items-center justify-between mt-4 text-xs font-mono text-foreground/40 px-2">
            <span className="flex items-center gap-1.5"><ShieldIcon /> {t('privacy')}</span>
            <span className="flex items-center gap-1.5"><ZapIcon /> {t('speed')}</span>
            <span className="flex items-center gap-1.5"><DownloadIcon /> {t('pdf')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCategoryColor(category: string) {
  switch(category) {
    case 'passport': return 'bg-primary shadow-[0_0_6px_var(--color-primary)]';
    case 'gaokao': return 'bg-warning shadow-[0_0_6px_var(--color-warning)]';
    case 'visa': return 'bg-blue-500 shadow-[0_0_6px_#3b82f6]';
    case 'study_abroad': return 'bg-success shadow-[0_0_6px_var(--color-success)]';
    default: return 'bg-foreground';
  }
}

function formatSpecDesc(category: string) {
  switch(category) {
    case 'passport': return 'White BG';
    case 'gaokao': return 'No Smile';
    case 'visa': return 'White BG';
    case 'study_abroad': return 'Smile OK';
    default: return 'Standard';
  }
}

function ShieldIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function ZapIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>; }
function DownloadIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
