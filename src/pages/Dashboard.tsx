import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { formatINR } from '@taaj/shared';
import { getDashboardReport } from '../api';
import { PageHeader, Spinner } from '../components/ui';
import { StatusBadge } from '../components/StatusBadge';

export function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardReport });

  if (isLoading || !data) {
    return <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Store overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Products" value={data.counts.products} />
        <Stat label="Orders" value={data.counts.orders} />
        <Stat label="Customers" value={data.counts.customers} />
        <Stat label="Wholesale" value={data.counts.wholesaleCustomers} tone="gold" />
        <Stat label="Low Stock" value={data.stock.lowStock} tone="gold" />
        <Stat label="Out of Stock" value={data.stock.outOfStock} tone="red" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-display text-lg text-charcoal">Orders (last 14 days)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.ordersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => String(d).slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#4F7A5C" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 font-display text-lg text-charcoal">Orders by status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ordersByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#7BA982" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-display text-lg text-charcoal">Recent orders</h2>
          <table className="w-full text-sm">
            <tbody>
              {data.recentOrders.map((o) => (
                <tr key={o._id} className="border-b border-black/5 last:border-0">
                  <td className="py-2">
                    <Link to="/orders" className="font-medium text-brand-deep hover:underline">{o.orderNumber}</Link>
                  </td>
                  <td className="py-2 text-charcoal/60">{o.contact?.name}</td>
                  <td className="py-2">{formatINR(o.amounts.total)}</td>
                  <td className="py-2 text-right"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
              {data.recentOrders.length === 0 && (
                <tr><td className="py-8 text-center text-charcoal/50">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="mb-4 font-display text-lg text-charcoal">Sales by category</h2>
          {data.salesByCategory.length === 0 ? (
            <p className="py-10 text-center text-sm text-charcoal/50">No sales recorded yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesByCategory} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Bar dataKey="revenue" fill="#C9A24B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'green' }: { label: string; value: number; tone?: 'green' | 'gold' | 'red' }) {
  const tones = { green: 'text-brand-deep', gold: 'text-gold', red: 'text-red-600' };
  return (
    <div className="card">
      <p className="text-sm text-charcoal/50">{label}</p>
      <p className={`mt-1 font-display text-3xl ${tones[tone]}`}>{value}</p>
    </div>
  );
}
