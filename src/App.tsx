import { lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './store/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/AdminLayout';
import { Login } from './pages/Login';

const named = <T extends string>(p: Promise<Record<T, React.ComponentType>>, key: T) =>
  p.then((m) => ({ default: m[key] }));

const Dashboard = lazy(() => named(import('./pages/Dashboard'), 'Dashboard'));
const Products = lazy(() => named(import('./pages/Products'), 'Products'));
const ProductForm = lazy(() => named(import('./pages/ProductForm'), 'ProductForm'));
const Categories = lazy(() => named(import('./pages/Categories'), 'Categories'));
const Banners = lazy(() => named(import('./pages/Banners'), 'Banners'));
const Settings = lazy(() => named(import('./pages/Settings'), 'Settings'));
const Users = lazy(() => named(import('./pages/Users'), 'Users'));
const Wholesale = lazy(() => named(import('./pages/Wholesale'), 'Wholesale'));
const AuditLog = lazy(() => named(import('./pages/AuditLog'), 'AuditLog'));
const Reports = lazy(() => named(import('./pages/Reports'), 'Reports'));
const Coupons = lazy(() => named(import('./pages/Coupons'), 'Coupons'));
const Homepage = lazy(() => named(import('./pages/Homepage'), 'Homepage'));
const Inventory = lazy(() => named(import('./pages/Inventory'), 'Inventory'));
const Orders = lazy(() => named(import('./pages/Orders'), 'Orders'));
const Customers = lazy(() => named(import('./pages/Customers'), 'Customers'));

export default function App() {
  const bootstrap = useAuth((s) => s.bootstrap);
  const status = useAuth((s) => s.status);

  useEffect(() => {
    if (status === 'idle') void bootstrap();
  }, [status, bootstrap]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:slug" element={<ProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="banners" element={<Banners />} />
          <Route path="homepage" element={<Homepage />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="wholesale" element={<Wholesale />} />
          <Route path="settings" element={<Settings />} />
          <Route path="users" element={<Users />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="reports" element={<Reports />} />
          <Route path="coupons" element={<Coupons />} />
        </Route>
      </Route>
    </Routes>
  );
}
