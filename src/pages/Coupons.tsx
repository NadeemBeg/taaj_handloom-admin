import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatINR } from '@taaj/shared';
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from '../api';
import { PageHeader, Button, Spinner, Badge, Modal, Field, ConfirmDialog } from '../components/ui';
import type { Coupon } from '../types';

interface CForm {
  code: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
  usageLimit?: number;
  isActive: boolean;
}

const errMsg = (e: unknown) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong';
const num = (v?: number) => (Number.isFinite(v) ? Number(v) : undefined);

export function Coupons() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-coupons'], queryFn: listCoupons });
  const [editing, setEditing] = useState<Coupon | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Coupon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<CForm>();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-coupons'] });

  const openForm = (c: Coupon | 'new') => {
    setError(null);
    if (c === 'new') reset({ code: '', type: 'PERCENT', value: 10, minSubtotal: 0, isActive: true });
    else reset({ code: c.code, type: c.type, value: c.value, minSubtotal: c.minSubtotal, maxDiscount: c.maxDiscount, usageLimit: c.usageLimit, isActive: c.isActive ?? true });
    setEditing(c);
  };

  const save = useMutation({
    mutationFn: (v: CForm) => {
      const body = {
        code: v.code,
        type: v.type,
        value: Number(v.value),
        minSubtotal: num(v.minSubtotal),
        maxDiscount: num(v.maxDiscount),
        usageLimit: num(v.usageLimit),
        isActive: v.isActive,
      };
      return editing && editing !== 'new' ? updateCoupon(editing._id, body) : createCoupon(body);
    },
    onSuccess: () => { setEditing(null); invalidate(); },
    onError: (e) => setError(errMsg(e)),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => { setToDelete(null); invalidate(); },
    onError: (e) => setError(errMsg(e)),
  });

  const fmtValue = (c: Coupon) => (c.type === 'PERCENT' ? `${c.value}%` : formatINR(c.value));

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Discount codes" action={<Button onClick={() => openForm('new')}>+ New Coupon</Button>} />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ivory text-left text-charcoal/60">
              <tr>
                <th className="px-4 py-3">Code</th><th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min order</th><th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data?.map((c) => (
                <tr key={c._id} className="border-t border-line/70">
                  <td className="px-4 py-3 font-mono font-semibold text-charcoal">{c.code}</td>
                  <td className="px-4 py-3 tabular-nums">{fmtValue(c)}</td>
                  <td className="px-4 py-3 tabular-nums">{c.minSubtotal ? formatINR(c.minSubtotal) : '—'}</td>
                  <td className="px-4 py-3 tabular-nums">{c.usedCount ?? 0}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                  <td className="px-4 py-3">{c.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openForm(c)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => setToDelete(c)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {data?.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-charcoal/50">No coupons yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'New Coupon' : 'Edit Coupon'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Code"><input className="tf uppercase" {...register('code', { required: true })} /></Field>
              <Field label="Type">
                <select className="tf" {...register('type')}>
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FLAT">Flat (₹)</option>
                </select>
              </Field>
              <Field label="Value"><input type="number" step="0.01" className="tf" {...register('value', { valueAsNumber: true, required: true })} /></Field>
              <Field label="Min order (₹)"><input type="number" className="tf" {...register('minSubtotal', { valueAsNumber: true })} /></Field>
              <Field label="Max discount (₹)"><input type="number" className="tf" {...register('maxDiscount', { valueAsNumber: true })} /></Field>
              <Field label="Usage limit"><input type="number" className="tf" {...register('usageLimit', { valueAsNumber: true })} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-charcoal/80">
              <input type="checkbox" className="h-4 w-4 rounded border-brand/40 text-brand-deep" {...register('isActive')} />
              Active
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete coupon"
          message={`Delete “${toDelete.code}”?`}
          loading={del.isPending}
          onCancel={() => setToDelete(null)}
          onConfirm={() => del.mutate(toDelete._id)}
        />
      )}
    </div>
  );
}
