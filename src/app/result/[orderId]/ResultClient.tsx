'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import jsPDF from 'jspdf';
import type { PhotoOrder, SpecTemplate } from '@/lib/db/schema';

export function ResultClient({ order, template }: { order: PhotoOrder, template: SpecTemplate }) {
  const t = useTranslations('result');
  const [isExporting, setIsExporting] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);

  const handleDownloadSingle = () => {
    if (!order.resultImagePath) return;
    const a = document.createElement('a');
    a.href = order.resultImagePath;
    a.download = `PhotoID_${order.id.slice(0, 8)}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportPDF = async () => {
    if (!order.resultImagePath || isExporting) return;
    setIsExporting(true);
    
    try {
      // Create A4 PDF (210 x 297 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Simple 2x2 layout calculation
      const marginX = 20;
      const marginY = 20;
      const spacing = 10;
      const w = template.widthMm;
      const h = template.heightMm;

      // Add image 4 times
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          const x = marginX + col * (w + spacing);
          const y = marginY + row * (h + spacing);
          pdf.addImage(order.resultImagePath, 'JPEG', x, y, w, h);
        }
      }

      pdf.save(`PhotoID_Print_${order.id.slice(0, 8)}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (order.status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-foreground/60">Processing your photo...</p>
      </div>
    );
  }

  if (order.status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h2 className="text-2xl font-bold">Generation Failed</h2>
        <p className="text-foreground/60 text-center max-w-md">{order.errorMessage}</p>
        <Link href="/upload" className="px-6 py-3 mt-4 rounded-xl bg-primary text-white font-medium">Try Again</Link>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-8">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 text-success border border-success/20 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          {t('complete')}
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12">
        {/* Left: Preview */}
        <div className="flex flex-col gap-4 items-center">
          <p className="text-foreground/50 text-sm font-mono">{t('preview')}</p>
          <div className="p-4 rounded-2xl bg-panel border border-border flex flex-col items-center shadow-lg">
            {order.resultImagePath ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={order.resultImagePath}
                alt="ID Photo"
                className="rounded-lg border border-border/50 shadow-inner object-cover block"
                style={{
                  width: Math.min(template.widthMm * 4, 280),
                  height: Math.min(template.heightMm * 4, 280 * template.heightMm / template.widthMm),
                }}
              />
            ) : (
              <div className="rounded-lg border border-border/50 shadow-inner bg-background/50 flex items-center justify-center text-foreground/30 text-sm"
                style={{ width: Math.min(template.widthMm * 4, 280), height: Math.min(template.heightMm * 4, 280 * template.heightMm / template.widthMm) }}
              >
                No image
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-foreground/50 mt-2 px-4 py-2 rounded-lg bg-panel border border-border/50">
            <span>{template.widthMm}×{template.heightMm}mm</span>
            <span>{template.dpi} DPI</span>
            <span>JPEG 95%</span>
          </div>
        </div>

        {/* Right: Download Options */}
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">{t('downloadOptions')}</h2>
            <p className="text-foreground/50 text-sm">{t('downloadSub')}</p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-5 rounded-2xl bg-panel border border-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div>
                  <h3 className="font-bold">{t('singlePhoto')}</h3>
                  <p className="text-xs text-foreground/50">{t('singlePhotoSub')}</p>
                </div>
              </div>
              <button onClick={handleDownloadSingle} className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-md shadow-primary/20">
                {t('download')}
              </button>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl bg-panel border border-border">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div>
                  <h3 className="font-bold">{t('printLayout')}</h3>
                  <p className="text-xs text-foreground/50">{t('printLayoutSub')}</p>
                </div>
              </div>
              <button onClick={handleExportPDF} disabled={isExporting} className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20 disabled:opacity-50">
                {isExporting ? '...' : t('exportPdf')}
              </button>
            </div>
          </div>

          <div className="mt-4 p-6 rounded-2xl bg-panel border border-border flex flex-col gap-4">
            <h4 className="text-sm font-bold text-foreground/70">{t('printPreview')}</h4>
            <div className="w-full aspect-[1/1.414] bg-background border border-border/50 rounded-lg p-6 relative flex flex-col items-center justify-center" ref={layoutRef}>
               <span className="absolute top-2 right-4 text-[10px] text-foreground/30 font-mono">A4 Paper</span>
               <div className="grid grid-cols-2 gap-4">
                 {[...Array(4)].map((_, i) => {
                   const previewWidth = 72;
                   const previewHeight = Math.round(previewWidth * (template.heightMm / template.widthMm));
                   return (
                     <div key={i} className="rounded-sm border border-border/50 overflow-hidden shadow-sm" style={{ width: previewWidth, height: previewHeight }}>
                       {order.resultImagePath ? (
                         /* eslint-disable-next-line @next/next/no-img-element */
                         <img src={order.resultImagePath} alt={`Preview ${i}`} className="w-full h-full object-cover block" />
                       ) : (
                         <div className="w-full h-full bg-panel" />
                       )}
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>

          <Link href="/upload" className="w-full py-4 mt-2 rounded-xl border border-border text-center font-medium hover:bg-panel hover:text-foreground text-foreground/80 transition-colors">
            {t('generateAnother')}
          </Link>
        </div>
      </div>
    </div>
  );
}
