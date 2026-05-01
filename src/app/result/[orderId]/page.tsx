import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { photoOrders, specTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ResultClient } from './ResultClient';

export default async function ResultPage({
  params
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params;
  
  const [order] = await db
    .select()
    .from(photoOrders)
    .where(eq(photoOrders.id, orderId))
    .limit(1);

  if (!order) {
    notFound();
  }

  const [template] = await db
    .select()
    .from(specTemplates)
    .where(eq(specTemplates.id, order.templateId!))
    .limit(1);

  return (
    <div className="flex flex-col items-center flex-1 w-full max-w-6xl mx-auto px-6 py-8 md:py-12 animate-in fade-in duration-500">
      <ResultClient order={order} template={template} />
    </div>
  );
}
