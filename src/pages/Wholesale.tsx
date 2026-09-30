import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { normalizeWhatsappNumber } from '@taaj/shared';
import { listWholesale, updateWholesale } from '../api';
import { PageHeader, Button, Spinner, Badge, Modal, Field } from '../components/ui';
import type { WholesaleCustomer } from '../types';

interface WForm {
  businessName: string;
  gstin?: string;
  minOrderQty: number;
  notes?: string;
}

const contactOf = (w: WholesaleCustomer) =>
  typeof w.customer === 'string' ? undefined : w.customer;
const errMsg = (e: unknown) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong';

export function Wholesale() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-wholesale'], queryFn: listWholesale });
  const [editing, setEditing] = useState<WholesaleCustomer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<WForm>();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-wholesale'] });

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => updateWholesale(id, body),
    onSuccess: () => { setEditing(null); invalidate(); },
    onError: (e) => setError(errMsg(e)),
  });

  const openEdit = (w: WholesaleCustomer) => {
    setError(null);
    reset({ businessName: w.businessName, gstin: w.gstin, minOrderQty: w.minOrderQty, notes: w.notes });
    setEditing(w);
  };

  return (
    <div>
      <PageHeader title="Wholesale Customers" subtitle="Approved resellers, boutiques and bulk buyers" />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ivory text-left text-charcoal/60">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3">Min qty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.map((w) => {
                const c = contactOf(w);
                return (
                  <tr key={w._id} className="border-t border-line/70">
                    <td className="px-4 py-3 font-medium text-charcoal">{w.businessName}</td>
                    <td className="px-4 py-3 text-charcoal/60">
                      {c ? (
                        <div>
                          <div>{c.name}</div>
                          <div className="text-xs text-charcoal/40">{c.phone}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-charcoal/60">{w.gstin || '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{w.minOrderQty}</td>
                    <td className="px-4 py-3">
                      {w.isApproved ? <Badge tone="green">Approved</Badge> : <Badge tone="gold">Pending</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {c?.whatsapp || c?.phone ? (
                          <a
                            href={`https://wa.me/${normalizeWhatsappNumber(c.whatsapp || c.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-deep hover:bg-sage"
                          >
                            WhatsApp
                          </a>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={patch.isPending}
                          onClick={() => patch.mutate({ id: w._id, body: { isApproved: !w.isApproved } })}
                        >
                          {w.isApproved ? 'Unapprove' : 'Approve'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(w)}>Edit</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data?.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-charcoal/50">
                  No wholesale customers yet. Convert a customer from the Customers screen.
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal title="Edit Wholesale Customer" onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit((v) => patch.mutate({ id: editing._id, body: { ...v, minOrderQty: Number(v.minOrderQty) } }))} className="space-y-4">
            <Field label="Business name"><input className="tf" {...register('businessName', { required: true })} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="GSTIN"><input className="tf" {...register('gstin')} /></Field>
              <Field label="Min order qty"><input type="number" className="tf" {...register('minOrderQty', { valueAsNumber: true })} /></Field>
            </div>
            <Field label="Notes"><textarea className="tf min-h-16" {...register('notes')} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={patch.isPending}>{patch.isPending ? 'Saving…' : 'Save'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
