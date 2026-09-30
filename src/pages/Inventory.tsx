import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { INVENTORY_REASONS } from '@taaj/shared';
import { listProducts, getProduct, adjustStock, listTransactions, getLowStock } from '../api';
import { PageHeader, Button, Field, Spinner, Badge } from '../components/ui';
import type { Product, Stock } from '../types';

function avail(s?: Stock) {
  return s ? s.quantity - s.reserved : 0;
}

export function Inventory() {
  const qc = useQueryClient();
  const [product, setProduct] = useState<Product | null>(null);
  const [variantId, setVariantId] = useState('');
  const [change, setChange] = useState('');
  const [reason, setReason] = useState<string>('NEW_STOCK');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [txnPage, setTxnPage] = useState(1);

  const productsQ = useQuery({
    queryKey: ['inv-products'],
    queryFn: () => listProducts({ limit: 100, includeInactive: true, sort: 'newest' }),
  });
  const variantsQ = useQuery({
    queryKey: ['inv-variants', product?.slug],
    queryFn: () => getProduct(product!.slug),
    enabled: !!product?.hasVariants,
  });
  const lowQ = useQuery({ queryKey: ['inv-low'], queryFn: getLowStock });
  const txnQ = useQuery({
    queryKey: ['inv-txns', txnPage],
    queryFn: () => listTransactions({ page: txnPage, limit: 10 }),
  });

  const adjust = useMutation({
    mutationFn: () =>
      adjustStock({
        product: product!._id,
        variant: variantId || undefined,
        change: Number(change),
        reason,
        note: note || undefined,
      }),
    onSuccess: () => {
      setMsg({ ok: true, text: 'Stock adjusted.' });
      setChange('');
      setNote('');
      qc.invalidateQueries({ queryKey: ['inv-low'] });
      qc.invalidateQueries({ queryKey: ['inv-txns'] });
      qc.invalidateQueries({ queryKey: ['inv-variants'] });
    },
    onError: (e) =>
      setMsg({ ok: false, text: (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Adjustment failed' }),
  });

  const canSubmit = product && change && Number(change) !== 0 && (!product.hasVariants || variantId);

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Adjust stock — every change is logged" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Adjust */}
        <div className="card">
          <h2 className="mb-4 font-display text-lg text-charcoal">Adjust stock</h2>
          {msg && (
            <p className={`mb-3 rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-brand-soft text-brand-deep' : 'bg-red-50 text-red-700'}`}>
              {msg.text}
            </p>
          )}
          <div className="grid gap-4">
            <Field label="Product">
              <select
                className="tf"
                value={product?._id ?? ''}
                onChange={(e) => {
                  const p = productsQ.data?.items.find((x) => x._id === e.target.value) ?? null;
                  setProduct(p);
                  setVariantId('');
                }}
              >
                <option value="">Select product…</option>
                {productsQ.data?.items.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </Field>

            {product?.hasVariants && (
              <Field label="Variant">
                {variantsQ.isLoading ? <Spinner /> : (
                  <select className="tf" value={variantId} onChange={(e) => setVariantId(e.target.value)}>
                    <option value="">Select variant…</option>
                    {variantsQ.data?.variants.map((v) => (
                      <option key={v._id} value={v._id}>{v.color.name} ({v.sku}) — {avail(v.stock)} in stock</option>
                    ))}
                  </select>
                )}
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Change (+/−)">
                <input className="tf" type="number" value={change} onChange={(e) => setChange(e.target.value)} placeholder="e.g. 10 or -2" />
              </Field>
              <Field label="Reason">
                <select className="tf" value={reason} onChange={(e) => setReason(e.target.value)}>
                  {INVENTORY_REASONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Note (optional)"><input className="tf" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <Button disabled={!canSubmit || adjust.isPending} onClick={() => adjust.mutate()}>
              {adjust.isPending ? 'Applying…' : 'Apply adjustment'}
            </Button>
          </div>
        </div>

        {/* Low stock */}
        <div className="card">
          <h2 className="mb-4 font-display text-lg text-charcoal">Low stock</h2>
          {lowQ.isLoading ? (
            <div className="flex h-40 items-center justify-center"><Spinner /></div>
          ) : (lowQ.data && (lowQ.data.products.length + lowQ.data.variants.length) > 0) ? (
            <ul className="space-y-2 text-sm">
              {lowQ.data.products.map((p) => (
                <li key={p._id} className="flex justify-between">
                  <span>{p.name}</span>
                  <Badge tone={avail(p.baseStock) <= 0 ? 'red' : 'gold'}>{avail(p.baseStock)} left</Badge>
                </li>
              ))}
              {lowQ.data.variants.map((v) => (
                <li key={v._id} className="flex justify-between">
                  <span>{v.color?.name} — {v.sku}</span>
                  <Badge tone={avail(v.stock) <= 0 ? 'red' : 'gold'}>{avail(v.stock)} left</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-charcoal/50">Everything is well stocked.</p>
          )}
        </div>
      </div>

      {/* History */}
      <div className="card mt-6">
        <h2 className="mb-4 font-display text-lg text-charcoal">Stock history</h2>
        {txnQ.isLoading ? (
          <div className="flex h-40 items-center justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-charcoal/50">
                <tr><th className="py-2">Date</th><th>Product</th><th>Reason</th><th>Prev → New</th><th>Change</th></tr>
              </thead>
              <tbody>
                {txnQ.data?.items.map((t) => (
                  <tr key={t._id} className="border-t border-black/5">
                    <td className="py-2 text-charcoal/50">{new Date(t.createdAt).toLocaleString()}</td>
                    <td>{typeof t.product === 'object' ? t.product?.name : '—'}</td>
                    <td>{t.reason.replace(/_/g, ' ')}</td>
                    <td className="text-charcoal/60">{t.previousStock} → {t.newStock}</td>
                    <td className={t.change < 0 ? 'text-red-600' : 'text-brand-deep'}>{t.change > 0 ? `+${t.change}` : t.change}</td>
                  </tr>
                ))}
                {txnQ.data?.items.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-charcoal/50">No adjustments yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {txnQ.data && txnQ.data.meta.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={txnPage <= 1} onClick={() => setTxnPage((p) => p - 1)}>Prev</Button>
            <span className="text-sm text-charcoal/60">Page {txnQ.data.meta.page} / {txnQ.data.meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={txnPage >= txnQ.data.meta.totalPages} onClick={() => setTxnPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}
