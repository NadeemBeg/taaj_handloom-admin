import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ORDER_STATUSES, formatINR, normalizeWhatsappNumber } from '@taaj/shared';
import { listOrders, getOrder, updateOrderStatus } from '../api';
import { PageHeader, Button, Spinner, Modal, Field } from '../components/ui';
import { StatusBadge } from '../components/StatusBadge';

export function Orders() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['orders', page, status, search],
    queryFn: () => listOrders({ page, limit: 15, status: status || undefined, search: search || undefined }),
  });

  return (
    <div>
      <PageHeader title="Orders" subtitle={list.data ? `${list.data.meta.total} orders` : undefined} />

      <div className="mb-4 flex flex-wrap gap-3">
        <select className="tf max-w-48" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <input
          className="tf max-w-64"
          placeholder="Search order # / name / phone"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="card overflow-hidden p-0">
        {list.isLoading ? (
          <div className="flex h-64 items-center justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ivory text-left text-charcoal/60">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {list.data?.items.map((o) => (
                  <tr key={o._id} className="border-t border-black/5">
                    <td className="px-4 py-3 font-medium text-charcoal">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-charcoal/70">{o.contact.name}<br /><span className="text-xs text-charcoal/40">{o.contact.phone}</span></td>
                    <td className="px-4 py-3">{formatINR(o.amounts.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-charcoal/50">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => setOpenId(o._id)}>View</Button>
                    </td>
                  </tr>
                ))}
                {list.data?.items.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-charcoal/50">No orders found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {list.data && list.data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-sm text-charcoal/60">Page {list.data.meta.page} / {list.data.meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= list.data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {openId && (
        <OrderDetail
          id={openId}
          onClose={() => setOpenId(null)}
          onUpdated={() => qc.invalidateQueries({ queryKey: ['orders'] })}
        />
      )}
    </div>
  );
}

function OrderDetail({ id, onClose, onUpdated }: { id: string; onClose: () => void; onUpdated: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['order', id], queryFn: () => getOrder(id) });
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: (s: string) => updateOrderStatus(id, s),
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ['order', id] });
      onUpdated();
    },
    onError: (e) => setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Update failed'),
  });

  const order = data?.order;
  const addr = order?.shippingAddress;
  const waHref = order
    ? `https://wa.me/${normalizeWhatsappNumber(order.contact.whatsapp || order.contact.phone)}`
    : '#';

  return (
    <Modal title={order ? order.orderNumber : 'Order'} onClose={onClose}>
      {isLoading || !order ? (
        <div className="flex h-40 items-center justify-center"><Spinner /></div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} />
              {order.customerType === 'WHOLESALE' && (
                <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold">Wholesale</span>
              )}
            </div>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#25D366]">
              Message customer on WhatsApp →
            </a>
          </div>

          <div className="rounded-lg bg-ivory p-4 text-sm">
            <p className="font-medium text-charcoal">{order.contact.name}</p>
            <p className="text-charcoal/60">{order.contact.phone}{order.contact.email ? ` · ${order.contact.email}` : ''}</p>
            {addr && (
              <p className="mt-2 text-charcoal/60">
                {[addr.line1, addr.line2, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-charcoal/70">Items</h3>
            <ul className="space-y-1 text-sm">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex justify-between">
                  <span className="text-charcoal/70">{i.snapshot.name}{i.snapshot.color ? ` · ${i.snapshot.color}` : ''} × {i.quantity}</span>
                  <span>{formatINR(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 space-y-1 border-t border-black/5 pt-2 text-sm">
              {order.amounts.discount > 0 && (
                <div className="flex justify-between text-charcoal/60">
                  <span>{order.coupon?.code ? `Coupon ${order.coupon.code}` : 'Discount'}</span>
                  <span>– {formatINR(order.amounts.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-charcoal">
                <span>Total</span><span>{formatINR(order.amounts.total)}</span>
              </div>
            </div>
          </div>

          {order.notes && <p className="rounded-lg bg-ivory p-3 text-sm text-charcoal/70">Note: {order.notes}</p>}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex items-end gap-3 border-t border-black/5 pt-4">
            <Field label="Update status">
              <select className="tf" value={status || order.status} onChange={(e) => setStatus(e.target.value)}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
            <Button
              disabled={update.isPending || !status || status === order.status}
              onClick={() => update.mutate(status)}
            >
              {update.isPending ? 'Saving…' : 'Update'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
