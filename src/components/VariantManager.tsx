import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PRODUCT_COLORS, formatINR } from '@taaj/shared';
import { addVariant, deleteVariant } from '../api';
import { Button, Field, Badge, ConfirmDialog } from './ui';
import { ImageUploader } from './ImageUploader';
import type { Variant, Stock, Img } from '../types';

interface VForm {
  sku: string;
  colorName: string;
  price?: number;
  quantity?: number;
}

function avail(s?: Stock) {
  return s ? s.quantity - s.reserved : 0;
}

export function VariantManager({ productId, variants }: { productId: string; variants: Variant[] }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Variant | null>(null);
  const [image, setImage] = useState<Img | undefined>();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<VForm>();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['product'] });

  const add = useMutation({
    mutationFn: (v: VForm) => {
      const color = PRODUCT_COLORS.find((c) => c.name === v.colorName);
      return addVariant(productId, {
        sku: v.sku,
        color: { name: v.colorName, hex: color?.hex },
        price: v.price ? Number(v.price) : undefined,
        stock: { quantity: Number(v.quantity ?? 0), lowStockThreshold: 3 },
        images: image ? [image] : [],
      });
    },
    onSuccess: () => { reset(); setImage(undefined); setError(null); invalidate(); },
    onError: (e) => setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not add variant'),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteVariant(id),
    onSuccess: () => { setToDelete(null); invalidate(); },
  });

  return (
    <div className="card">
      <h2 className="mb-1 font-display text-lg text-charcoal">Variants (colours)</h2>
      <p className="mb-4 text-xs text-charcoal/40">Adjust variant stock from the Inventory page.</p>

      {variants.length > 0 && (
        <div className="mb-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-charcoal/50">
              <tr><th className="py-2">Colour</th><th>SKU</th><th>Price</th><th>Stock</th><th></th></tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v._id} className="border-t border-black/5">
                  <td className="py-2">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: v.color.hex ?? '#ccc' }} />
                      {v.color.name}
                    </span>
                  </td>
                  <td className="text-charcoal/60">{v.sku}</td>
                  <td>{v.price ? formatINR(v.price) : <span className="text-charcoal/30">base</span>}</td>
                  <td>{avail(v.stock) <= 0 ? <Badge tone="red">0</Badge> : avail(v.stock)}</td>
                  <td className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(v)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit((v) => add.mutate(v))} className="grid gap-3 sm:grid-cols-5">
        <Field label="Colour" error={errors.colorName && 'Required'}>
          <select className="tf" {...register('colorName', { required: true })}>
            <option value="">Select…</option>
            {PRODUCT_COLORS.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="SKU" error={errors.sku && 'Required'}>
          <input className="tf" {...register('sku', { required: true })} />
        </Field>
        <Field label="Price (₹)"><input className="tf" type="number" {...register('price', { valueAsNumber: true })} /></Field>
        <Field label="Stock qty"><input className="tf" type="number" {...register('quantity', { valueAsNumber: true })} /></Field>
        <div className="sm:col-span-2">
          <ImageUploader label="Image" value={image} onChange={setImage} />
        </div>
        <div className="sm:col-span-5">
          <Button type="submit" size="sm" disabled={add.isPending}>{add.isPending ? 'Adding…' : '+ Add variant'}</Button>
        </div>
      </form>

      {toDelete && (
        <ConfirmDialog
          title="Delete variant"
          message={`Delete the ${toDelete.color.name} variant?`}
          loading={del.isPending}
          onCancel={() => setToDelete(null)}
          onConfirm={() => del.mutate(toDelete._id)}
        />
      )}
    </div>
  );
}
