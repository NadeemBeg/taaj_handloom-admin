import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatINR } from '@taaj/shared';
import { listProducts, deleteProduct } from '../api';
import { PageHeader, Button, Spinner, Badge, ConfirmDialog } from '../components/ui';
import type { Product, Stock } from '../types';

function avail(s?: Stock) {
  return s ? s.quantity - s.reserved : 0;
}

export function Products() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page],
    queryFn: () => listProducts({ page, limit: 12, includeInactive: true, sort: 'newest' }),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={data ? `${data.meta.total} products` : undefined}
        action={
          <Link to="/products/new">
            <Button>+ New Product</Button>
          </Link>
        }
      />

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ivory text-left text-charcoal/60">
                <tr>
                  <Th>Product</Th>
                  <Th>SKU</Th>
                  <Th>Price</Th>
                  <Th>Stock</Th>
                  <Th>Status</Th>
                  <Th> </Th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((p) => (
                  <tr key={p._id} className="border-t border-black/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.media.mainImage.url} alt="" className="h-10 w-8 rounded object-cover" />
                        <span className="font-medium text-charcoal">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-charcoal/60">{p.sku}</td>
                    <td className="px-4 py-3">{formatINR(p.pricing.price)}</td>
                    <td className="px-4 py-3">
                      {p.hasVariants ? <Badge>variants</Badge> : (
                        <span className={avail(p.baseStock) <= 0 ? 'text-red-600' : ''}>{avail(p.baseStock)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.flags?.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link to={`/products/${p.slug}`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => setToDelete(p)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-charcoal/50">No products yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-sm text-charcoal/60">Page {data.meta.page} / {data.meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete product"
          message={`Delete “${toDelete.name}”? This also removes its variants and cannot be undone.`}
          loading={del.isPending}
          onCancel={() => setToDelete(null)}
          onConfirm={() => del.mutate(toDelete._id)}
        />
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}
