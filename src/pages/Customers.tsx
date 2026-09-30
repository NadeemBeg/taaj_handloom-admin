import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CUSTOMER_TYPES } from '@taaj/shared';
import { listCustomers, createWholesale } from '../api';
import { PageHeader, Button, Spinner, Badge, Modal, Field } from '../components/ui';
import type { Customer } from '../types';

export function Customers() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [wholesaleFor, setWholesaleFor] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, type, search],
    queryFn: () => listCustomers({ page, limit: 20, type: type || undefined, search: search || undefined }),
  });

  return (
    <div>
      <PageHeader title="Customers" subtitle={data ? `${data.meta.total} customers` : undefined} />

      <div className="mb-4 flex flex-wrap gap-3">
        <select className="tf max-w-48" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All types</option>
          {CUSTOMER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input className="tf max-w-64" placeholder="Search name / phone / email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex h-56 items-center justify-center"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ivory text-left text-charcoal/60">
              <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Orders</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {data?.items.map((c) => (
                <tr key={c._id} className="border-t border-black/5">
                  <td className="px-4 py-3 font-medium text-charcoal">{c.name}</td>
                  <td className="px-4 py-3 text-charcoal/60">{c.phone}</td>
                  <td className="px-4 py-3"><Badge tone={c.type === 'WHOLESALE' ? 'gold' : 'default'}>{c.type}</Badge></td>
                  <td className="px-4 py-3">{c.orderCount ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    {c.type !== 'WHOLESALE' && (
                      <Button variant="outline" size="sm" onClick={() => setWholesaleFor(c)}>Make wholesale</Button>
                    )}
                  </td>
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-charcoal/50">No customers yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-sm text-charcoal/60">Page {data.meta.page} / {data.meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {wholesaleFor && (
        <WholesaleModal
          customer={wholesaleFor}
          onClose={() => setWholesaleFor(null)}
          onDone={() => { setWholesaleFor(null); qc.invalidateQueries({ queryKey: ['customers'] }); }}
        />
      )}
    </div>
  );
}

function WholesaleModal({ customer, onClose, onDone }: { customer: Customer; onClose: () => void; onDone: () => void }) {
  const { register, handleSubmit } = useForm<{ businessName: string; gstin?: string; minOrderQty: number; notes?: string }>({
    defaultValues: { minOrderQty: 1 },
  });
  const [error, setError] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: (v: { businessName: string; gstin?: string; minOrderQty: number; notes?: string }) =>
      createWholesale({ customer: customer._id, ...v, minOrderQty: Number(v.minOrderQty) }),
    onSuccess: onDone,
    onError: (e) => setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed'),
  });

  return (
    <Modal title={`Make ${customer.name} a wholesale customer`} onClose={onClose}>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <form onSubmit={handleSubmit((v) => mut.mutate(v))} className="space-y-4">
        <Field label="Business name"><input className="tf" {...register('businessName', { required: true })} /></Field>
        <Field label="GSTIN (optional)"><input className="tf" {...register('gstin')} /></Field>
        <Field label="Minimum order quantity"><input className="tf" type="number" {...register('minOrderQty')} /></Field>
        <Field label="Notes"><textarea className="tf min-h-16" {...register('notes')} /></Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={mut.isPending}>{mut.isPending ? 'Saving…' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
