import { useQuery } from '@tanstack/react-query';
import { formatINR } from '@taaj/shared';
import { getDashboardReport, getLowStock } from '../api';
import { PageHeader, Button, Spinner } from '../components/ui';
import { downloadCsv } from '../lib/csv';

export function Reports() {
  const report = useQuery({ queryKey: ['admin-report'], queryFn: getDashboardReport });
  const lowStock = useQuery({ queryKey: ['admin-lowstock'], queryFn: getLowStock });

  if (report.isLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8" /></div>;
  }
  const r = report.data;
  const revenue = (r?.ordersByDay ?? []).reduce((n, d) => n + (d.revenue || 0), 0);

  const kpis = [
    { label: 'Revenue (14d)', value: formatINR(revenue) },
    { label: 'Orders', value: r?.counts.orders ?? 0 },
    { label: 'Products', value: r?.counts.products ?? 0 },
    { label: 'Low stock', value: r?.stock.lowStock ?? 0 },
    { label: 'Out of stock', value: r?.stock.outOfStock ?? 0 },
    { label: 'Wholesale', value: r?.counts.wholesaleCustomers ?? 0 },
  ];

  const exportCategory = () =>
    downloadCsv(
      'sales-by-category.csv',
      ['Category', 'Units', 'Revenue (INR)'],
      (r?.salesByCategory ?? []).map((c) => [c.category, c.units, c.revenue]),
    );

  const exportLowStock = () => {
    const rows: (string | number)[][] = [];
    (lowStock.data?.products ?? []).forEach((p) =>
      rows.push([p.name, p.sku, 'base', (p.baseStock?.quantity ?? 0) - (p.baseStock?.reserved ?? 0)]),
    );
    (lowStock.data?.variants ?? []).forEach((v) =>
      rows.push([v.color?.name ?? '', v.sku, 'variant', (v.stock?.quantity ?? 0) - (v.stock?.reserved ?? 0)]),
    );
    downloadCsv('low-stock.csv', ['Name', 'SKU', 'Type', 'Available'], rows);
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Sales, products and stock at a glance" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <div className="font-display text-2xl text-brand-deep tabular-nums">{k.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-charcoal/50">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Sales by category */}
        <section className="card p-0">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display text-lg text-charcoal">Sales by Category</h2>
            <Button variant="outline" size="sm" onClick={exportCategory}>Export CSV</Button>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-ivory text-left text-charcoal/60">
              <tr><th className="px-5 py-2">Category</th><th className="px-5 py-2">Units</th><th className="px-5 py-2">Revenue</th></tr>
            </thead>
            <tbody>
              {(r?.salesByCategory ?? []).map((c) => (
                <tr key={c.category} className="border-t border-line/70">
                  <td className="px-5 py-2 text-charcoal/80">{c.category}</td>
                  <td className="px-5 py-2 tabular-nums">{c.units}</td>
                  <td className="px-5 py-2 tabular-nums">{formatINR(c.revenue)}</td>
                </tr>
              ))}
              {(r?.salesByCategory ?? []).length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-charcoal/40">No sales recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Best sellers */}
        <section className="card p-0">
          <div className="px-5 py-4"><h2 className="font-display text-lg text-charcoal">Best Sellers</h2></div>
          <table className="w-full text-sm">
            <thead className="bg-ivory text-left text-charcoal/60">
              <tr><th className="px-5 py-2">Product</th><th className="px-5 py-2">SKU</th><th className="px-5 py-2">Price</th></tr>
            </thead>
            <tbody>
              {(r?.bestSellers ?? []).map((p) => (
                <tr key={p._id} className="border-t border-line/70">
                  <td className="px-5 py-2 text-charcoal/80">{p.name}</td>
                  <td className="px-5 py-2 text-charcoal/50">{p.sku}</td>
                  <td className="px-5 py-2 tabular-nums">{formatINR(p.pricing.price)}</td>
                </tr>
              ))}
              {(r?.bestSellers ?? []).length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-charcoal/40">No best sellers yet.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      {/* Low stock */}
      <section className="card mt-6 p-0">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-display text-lg text-charcoal">Low / Out of Stock</h2>
          <Button variant="outline" size="sm" onClick={exportLowStock} disabled={lowStock.isLoading}>Export CSV</Button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-ivory text-left text-charcoal/60">
            <tr><th className="px-5 py-2">Name</th><th className="px-5 py-2">SKU</th><th className="px-5 py-2">Type</th><th className="px-5 py-2">Available</th></tr>
          </thead>
          <tbody>
            {(lowStock.data?.products ?? []).map((p) => (
              <tr key={p._id} className="border-t border-line/70">
                <td className="px-5 py-2 text-charcoal/80">{p.name}</td>
                <td className="px-5 py-2 text-charcoal/50">{p.sku}</td>
                <td className="px-5 py-2 text-charcoal/50">base</td>
                <td className="px-5 py-2 tabular-nums">{(p.baseStock?.quantity ?? 0) - (p.baseStock?.reserved ?? 0)}</td>
              </tr>
            ))}
            {(lowStock.data?.variants ?? []).map((v) => (
              <tr key={v._id} className="border-t border-line/70">
                <td className="px-5 py-2 text-charcoal/80">{v.color?.name}</td>
                <td className="px-5 py-2 text-charcoal/50">{v.sku}</td>
                <td className="px-5 py-2 text-charcoal/50">variant</td>
                <td className="px-5 py-2 tabular-nums">{(v.stock?.quantity ?? 0) - (v.stock?.reserved ?? 0)}</td>
              </tr>
            ))}
            {!lowStock.isLoading && (lowStock.data?.products?.length ?? 0) + (lowStock.data?.variants?.length ?? 0) === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-charcoal/40">Everything is well stocked.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
