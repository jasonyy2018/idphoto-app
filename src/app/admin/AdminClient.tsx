'use client';

import { useState } from 'react';
import type { ApiKey } from '@/lib/db/schema';

type OrderLight = {
  id: string;
  status: string;
  createdAt: Date | null;
  templateName: string | null;
};

export function AdminClient({ 
  initialKeys, 
  recentOrders,
  translations: t
}: { 
  initialKeys: ApiKey[], 
  recentOrders: OrderLight[],
  translations: any
}) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);

  // Quick helper to format date
  const formatDate = (d: Date | null) => d ? new Date(d).toLocaleString() : '-';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
      
      {/* API Keys Table */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{t.apiKeys}</h2>
          <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover shadow-md shadow-primary/20">
            {t.newKey}
          </button>
        </div>
        
        <div className="rounded-2xl border border-border bg-panel overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-foreground/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Key Name</th>
                <th className="px-6 py-4 font-medium">Prefix</th>
                <th className="px-6 py-4 font-medium">Calls</th>
                <th className="px-6 py-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-panel-hover transition-colors">
                  <td className="px-6 py-4">
                    {k.isActive === 1 ? (
                      <span className="px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium border border-success/20">Active</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-error/10 text-error text-xs font-medium border border-error/20">Revoked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium">{k.name}</td>
                  <td className="px-6 py-4 font-mono text-foreground/60">{k.keyPrefix}••••</td>
                  <td className="px-6 py-4 font-mono">{k.totalCalls}</td>
                  <td className="px-6 py-4 text-foreground/50">{formatDate(k.createdAt)}</td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-foreground/40">No API keys found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{t.recentOrders}</h2>
        <div className="p-2 rounded-2xl border border-border bg-panel flex flex-col gap-1">
          {recentOrders.map((o) => (
            <div key={o.id} className="p-4 rounded-xl hover:bg-background transition-colors border border-transparent hover:border-border/50 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${o.status === 'completed' ? 'bg-success shadow-[0_0_5px_var(--color-success)]' : o.status === 'failed' ? 'bg-error' : 'bg-warning animate-pulse'}`} />
                <div>
                  <div className="text-sm font-mono font-medium group-hover:text-primary transition-colors">#{o.id.slice(0, 8)}</div>
                  <div className="text-xs text-foreground/50">{o.templateName}</div>
                </div>
              </div>
              <div className={`text-xs px-2.5 py-1 rounded-md font-mono ${o.status === 'completed' ? 'text-success bg-success/10' : o.status === 'failed' ? 'text-error bg-error/10' : 'text-warning bg-warning/10'}`}>
                {o.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
