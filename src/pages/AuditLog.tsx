import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAuditLogs } from '../api';
import { PageHeader, Button, Spinner, Badge } from '../components/ui';
import type { AuditEntry } from '../types';

const actorName = (a: AuditEntry['actor']) =>
  !a ? 'System' : typeof a === 'string' ? a : a.name || a.email || 'Unknown';

const actionTone = (m: string): 'green' | 'gold' | 'red' | 'default' =>
  m === 'POST' ? 'green' : m === 'DELETE' ? 'red' : m === 'PATCH' || m === 'PUT' ? 'gold' : 'default';

export function AuditLog() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', page],
    queryFn: () => listAuditLogs({ page, limit: 30 }),
  });

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Every change made in the admin, most recent first" />

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ivory text-left text-charcoal/60">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource</th>
                <th className="px-4 py-3">Path</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((e) => (
                <tr key={e._id} className="border-t border-line/70">
                  <td className="px-4 py-3 whitespace-nowrap text-charcoal/60">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-charcoal/80">{actorName(e.actor)}</td>
                  <td className="px-4 py-3"><Badge tone={actionTone(e.action)}>{e.action}</Badge></td>
                  <td className="px-4 py-3 capitalize text-charcoal/70">{e.entity ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-charcoal/50">{e.path}</td>
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-charcoal/50">No activity recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-charcoal/50">Page {data.meta.page} of {data.meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
