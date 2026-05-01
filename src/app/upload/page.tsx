import { db } from '@/lib/db';
import { specTemplates } from '@/lib/db/schema';
import { UploadClient } from './UploadClient';
import { getLocale } from 'next-intl/server';

export default async function UploadPage() {
  const templates = await db.select().from(specTemplates).orderBy(specTemplates.id);
  const locale = await getLocale();
  
  return (
    <div className="flex flex-col items-center flex-1 w-full max-w-6xl mx-auto px-6 py-8 md:py-12 animate-in fade-in duration-500">
      <UploadClient templates={templates} locale={locale} />
    </div>
  );
}
