import { apiClient } from '../lib/apiClient';
import type {
  AdminUser,
  AuditEntry,
  Banner,
  Category,
  Coupon,
  Customer,
  InventoryTxn,
  Order,
  PaginationMeta,
  Product,
  SiteSettings,
  Variant,
  WholesaleCustomer,
} from '../types';

interface Env<T> {
  data: T;
}
const data = <T>(r: { data: Env<T> }) => r.data.data;

// ── Products ──
export interface ProductListParams {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
  inStock?: boolean;
  includeInactive?: boolean;
}
export async function listProducts(params: ProductListParams) {
  return data<{ items: Product[]; meta: PaginationMeta }>(
    await apiClient.get('/products', { params }),
  );
}
export async function getProduct(slug: string) {
  return data<{ product: Product; variants: Variant[] }>(await apiClient.get(`/products/${slug}`));
}
export async function createProduct(body: unknown) {
  return data<{ product: Product }>(await apiClient.post('/products', body));
}
export async function updateProduct(id: string, body: unknown) {
  return data<{ product: Product }>(await apiClient.patch(`/products/${id}`, body));
}
export async function deleteProduct(id: string) {
  return apiClient.delete(`/products/${id}`);
}

// ── Variants ──
export async function addVariant(productId: string, body: unknown) {
  return data<{ variant: Variant }>(await apiClient.post(`/products/${productId}/variants`, body));
}
export async function updateVariant(variantId: string, body: unknown) {
  return data<{ variant: Variant }>(await apiClient.patch(`/products/variants/${variantId}`, body));
}
export async function deleteVariant(variantId: string) {
  return apiClient.delete(`/products/variants/${variantId}`);
}

// ── Categories ──
export async function listCategories() {
  return data<{ categories: Category[] }>(await apiClient.get('/categories'));
}
export async function createCategory(body: unknown) {
  return data<{ category: Category }>(await apiClient.post('/categories', body));
}
export async function updateCategory(id: string, body: unknown) {
  return data<{ category: Category }>(await apiClient.patch(`/categories/${id}`, body));
}
export async function deleteCategory(id: string) {
  return apiClient.delete(`/categories/${id}`);
}

// ── Banners (homepage CMS) ──
export async function listBanners(type?: string) {
  return data<{ banners: Banner[] }>(
    await apiClient.get('/banners/admin', { params: type ? { type } : {} }),
  );
}
export async function createBanner(body: unknown) {
  return data<{ banner: Banner }>(await apiClient.post('/banners', body));
}
export async function updateBanner(id: string, body: unknown) {
  return data<{ banner: Banner }>(await apiClient.patch(`/banners/${id}`, body));
}
export async function deleteBanner(id: string) {
  return apiClient.delete(`/banners/${id}`);
}

// ── Admin users (SUPER_ADMIN) ──
export async function listUsers() {
  return data<{ users: AdminUser[] }>(await apiClient.get('/auth/users')).users;
}
export async function createUser(body: unknown) {
  return data<{ user: AdminUser }>(await apiClient.post('/auth/users', body)).user;
}
export async function updateUser(id: string, body: unknown) {
  return data<{ user: AdminUser }>(await apiClient.patch(`/auth/users/${id}`, body)).user;
}

// ── Coupons ──
export async function listCoupons() {
  return data<{ coupons: Coupon[] }>(await apiClient.get('/coupons')).coupons;
}
export async function createCoupon(body: unknown) {
  return data<{ coupon: Coupon }>(await apiClient.post('/coupons', body)).coupon;
}
export async function updateCoupon(id: string, body: unknown) {
  return data<{ coupon: Coupon }>(await apiClient.patch(`/coupons/${id}`, body)).coupon;
}
export async function deleteCoupon(id: string) {
  return apiClient.delete(`/coupons/${id}`);
}

// ── Audit log ──
export async function listAuditLogs(params: { page?: number; limit?: number; entity?: string }) {
  return data<{ items: AuditEntry[]; meta: PaginationMeta }>(
    await apiClient.get('/audit-logs', { params }),
  );
}

// ── Website settings (singleton) ──
export async function getSettings() {
  return data<{ settings: SiteSettings }>(await apiClient.get('/settings')).settings;
}
export async function updateSettings(body: unknown) {
  return data<{ settings: SiteSettings }>(await apiClient.patch('/settings', body)).settings;
}

// ── Inventory ──
export interface TxnParams {
  page?: number;
  limit?: number;
  product?: string;
  reason?: string;
}
export async function adjustStock(body: unknown) {
  return data<{ stock: unknown }>(await apiClient.post('/inventory/adjust', body));
}
export async function listTransactions(params: TxnParams) {
  return data<{ items: InventoryTxn[]; meta: PaginationMeta }>(
    await apiClient.get('/inventory/transactions', { params }),
  );
}
export async function getLowStock() {
  return data<{ products: Product[]; variants: Variant[] }>(
    await apiClient.get('/inventory/low-stock'),
  );
}

// ── Orders (admin) ──
export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: string;
  source?: string;
  search?: string;
}
export async function listOrders(params: OrderListParams) {
  return data<{ items: Order[]; meta: PaginationMeta }>(
    await apiClient.get('/orders/admin', { params }),
  );
}
export async function getOrder(id: string) {
  return data<{ order: Order }>(await apiClient.get(`/orders/admin/${id}`));
}
export async function updateOrderStatus(id: string, status: string) {
  return data<{ order: Order }>(await apiClient.patch(`/orders/admin/${id}/status`, { status }));
}

// ── Customers / Wholesale ──
export interface CustomerListParams {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
}
export async function listCustomers(params: CustomerListParams) {
  return data<{ items: Customer[]; meta: PaginationMeta }>(
    await apiClient.get('/customers', { params }),
  );
}
export async function createWholesale(body: unknown) {
  return apiClient.post('/wholesale', body);
}
export async function listWholesale() {
  return data<{ items: WholesaleCustomer[] }>(await apiClient.get('/wholesale')).items;
}
export async function updateWholesale(id: string, body: unknown) {
  return data<{ wholesale: WholesaleCustomer }>(await apiClient.patch(`/wholesale/${id}`, body)).wholesale;
}

// ── Reports ──
export interface DashboardReport {
  counts: {
    products: number;
    activeProducts: number;
    categories: number;
    customers: number;
    wholesaleCustomers: number;
    orders: number;
  };
  stock: { total: number; lowStock: number; outOfStock: number };
  ordersByStatus: { status: string; count: number }[];
  ordersByDay: { date: string; count: number; revenue: number }[];
  salesByCategory: { category: string; revenue: number; units: number }[];
  bestSellers: Product[];
  recentOrders: Array<{ _id: string; orderNumber: string; contact: { name: string }; amounts: { total: number }; status: string; createdAt: string }>;
}
export async function getDashboardReport() {
  return data<DashboardReport>(await apiClient.get('/reports/dashboard'));
}

// ── Image uploads (Cloudinary) ──
export interface UploadedImage {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}
export async function uploadImage(file: File) {
  const fd = new FormData();
  fd.append('image', file);
  return data<{ image: UploadedImage }>(await apiClient.postForm('/uploads/image', fd)).image;
}
export async function uploadImages(files: File[]) {
  const fd = new FormData();
  files.forEach((f) => fd.append('images', f));
  return data<{ images: UploadedImage[] }>(await apiClient.postForm('/uploads/images', fd)).images;
}
