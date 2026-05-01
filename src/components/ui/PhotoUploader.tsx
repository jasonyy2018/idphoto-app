'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from 'next-intl';

interface PhotoUploaderProps {
  onFileSelect: (file: File, base64: string) => void;
  disabled?: boolean;
}

export function PhotoUploader({ onFileSelect, disabled }: PhotoUploaderProps) {
  const t = useTranslations('upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File too large. Max 10MB.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onFileSelect(file, reader.result);
      }
    };
    reader.readAsDataURL(file);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    disabled
  });

  return (
    <div className="w-full flex flex-col gap-2 h-full min-h-[400px]">
      <div 
        {...getRootProps()} 
        className={`flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer bg-panel
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-panel-hover'}
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center border border-border mb-6 shadow-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        
        <h3 className="text-xl font-bold mb-2">{t('dropTitle')}</h3>
        <p className="text-foreground/60 mb-6">{t('dropSub')}</p>
        
        <div className="px-6 py-2.5 rounded-full bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-md shadow-primary/20">
          {t('browseBtn')}
        </div>
        
        <p className="text-xs text-foreground/40 mt-8 font-mono tracking-tight">
          {t('dropFormats')}
        </p>
      </div>
      
      {errorMsg && (
        <p className="text-sm text-error text-center mt-2">{errorMsg}</p>
      )}
    </div>
  );
}
