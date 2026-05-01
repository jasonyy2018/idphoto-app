import { db } from '@/lib/db';
import { apiKeys, photoOrders, specTemplates } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { AdminClient } from './AdminClient';
import { getTranslations } from 'next-intl/server';

export default async function AdminPage() {
  const t = await getTranslations('admin');

  // Stats queries
  const [{ count: totalOrders }] = await db.select({ count: sql<number>`cast(count(${photoOrders.id}) as int)` }).from(photoOrders);
  const [{ count: activeKeys }] = await db.select({ count: sql<number>`cast(count(${apiKeys.id}) as int)` }).from(apiKeys).where(eq(apiKeys.isActive, 1));
  const [{ avgTime }] = await db.select({ avgTime: sql<number>`cast(avg(${photoOrders.processingTimeMs}) as int)` }).from(photoOrders).where(eq(photoOrders.status, 'completed'));
  const [{ completedCount }] = await db.select({ completedCount: sql<number>`cast(count(${photoOrders.id}) as int)` }).from(photoOrders).where(eq(photoOrders.status, 'completed'));
  
  const successRate = totalOrders > 0 ? ((completedCount / totalOrders) * 100).toFixed(1) : '100.0';

  // Lists
  const recentOrders = await db
    .select({
      id: photoOrders.id,
      status: photoOrders.status,
      createdAt: photoOrders.createdAt,
      templateName: specTemplates.nameEn,
    })
    .from(photoOrders)
    .leftJoin(specTemplates, eq(photoOrders.templateId, specTemplates.id))
    .orderBy(desc(photoOrders.createdAt))
    .limit(10);

  const keys = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));

  return (
    <div className="flex flex-1 w-full max-w-[1400px] mx-auto overflow-hidden animate-in fade-in duration-500">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border hidden lg:flex flex-col p-6 gap-8">
        <div>
          <div className="text-xs font-bold text-foreground/40 tracking-wider mb-4 uppercase">Navigation</div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
              {t('dashboard')}
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/70 hover:text-foreground hover:bg-panel transition-colors cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              {t('apiKeys')}
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/70 hover:text-foreground hover:bg-panel transition-colors cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              {t('orders')}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <h1 className="text-3xl font-bold mb-8">{t('dashboard')}</h1>
        
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard title={t('totalOrders')} value={totalOrders.toString()} />
          <StatCard title={t('activeKeys')} value={activeKeys.toString()} color="text-primary" />
          <StatCard title={t('avgTime')} value={avgTime ? `${(avgTime/1000).toFixed(1)}s` : '-'} color="text-blue-500" />
          <StatCard title={t('successRate')} value={`${successRate}%`} color="text-success" />
        </div>

        {/* Admin Client for interactions */}
        <AdminClient initialKeys={keys} recentOrders={recentOrders} translations={{
          apiKeys: t('apiKeys'),
          newKey: t('newKey'),
          recentOrders: t('recentOrders')
        }} />
      </main>
    </div>
  );
}

function StatCard({ title, value, color = "text-foreground" }: { title: string, value: string, color?: string }) {
  return (
    <div className="p-6 rounded-2xl bg-panel border border-border flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground/50">{title}</span>
      <span className={`text-3xl font-bold font-mono ${color}`}>{value}</span>
    </div>
  );
}
