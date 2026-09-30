export interface Img {
  url: string;
  publicId?: string;
  alt?: string;
}
export interface Stock {
  quantity: number;
  reserved: number;
  sold: number;
  lowStockThreshold: number;
}
export interface Pricing {
  mrp: number;
  price: number;
  wholesalePrice?: number;
  minWholesaleQty?: number;
}
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: Img;
  parent?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  seo?: { title?: string; description?: string };
}
export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  category?: Category | string;
  shortDescription?: string;
  description?: string;
  careInstructions?: string;
  pricing: Pricing;
  attributes?: {
    fabric?: string;
    material?: string;
    pattern?: string;
    occasion?: string[];
    tags?: string[];
  };
  media: { mainImage: Img; gallery?: Img[] };
  flags?: {
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    isActive?: boolean;
  };
  hasVariants?: boolean;
  baseStock?: Stock;
  seo?: { title?: string; description?: string };
}
export interface Variant {
  _id: string;
  sku: string;
  color: { name: string; hex?: string };
  size?: string;
  price?: number;
  mrp?: number;
  stock?: Stock;
  images?: Img[];
  isActive?: boolean;
}
export interface InventoryTxn {
  _id: string;
  product?: { name?: string; sku?: string } | string;
  previousStock: number;
  newStock: number;
  change: number;
  reason: string;
  note?: string;
  performedBy?: { name?: string; email?: string } | string;
  createdAt: string;
}
export interface OrderItem {
  snapshot: { name: string; sku: string; color?: string; image?: string };
  unitPrice: number;
  mrp: number;
  quantity: number;
  lineTotal: number;
}
export interface Order {
  _id: string;
  orderNumber: string;
  contact: { name: string; phone: string; whatsapp?: string; email?: string };
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: OrderItem[];
  amounts: { subtotal: number; discount: number; total: number };
  customerType?: 'INDIVIDUAL' | 'WHOLESALE';
  coupon?: { code?: string; discount?: number };
  status: string;
  paymentStatus?: string;
  source?: string;
  notes?: string;
  statusHistory?: Array<{ status: string; at: string }>;
  createdAt: string;
}
export interface Customer {
  _id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  type: 'INDIVIDUAL' | 'RETAIL' | 'WHOLESALE';
  orderCount?: number;
  createdAt: string;
}
export interface Banner {
  _id: string;
  type: 'HERO' | 'STRIP' | 'CATEGORY_TILE' | 'CTA';
  title?: string;
  subtitle?: string;
  desktopImage: Img;
  mobileImage?: Img;
  ctaLabel?: string;
  ctaHref?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
}
export interface Coupon {
  _id: string;
  code: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  usedCount?: number;
  isActive?: boolean;
}
export interface WholesaleCustomer {
  _id: string;
  customer: { _id: string; name: string; phone: string; whatsapp?: string; email?: string } | string;
  businessName: string;
  gstin?: string;
  minOrderQty: number;
  notes?: string;
  isApproved: boolean;
  createdAt?: string;
}
export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'INVENTORY_MANAGER' | 'ORDER_MANAGER';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}
export interface AuditEntry {
  _id: string;
  actor?: { name?: string; email?: string } | string;
  action: string;
  entity?: string;
  entityId?: string;
  path?: string;
  statusCode?: number;
  ip?: string;
  createdAt: string;
}
export interface SiteSettings {
  brand?: { name?: string; tagline?: string; logo?: Img };
  whatsappNumber?: string;
  phone?: string;
  email?: string;
  address?: { line1?: string; city?: string; state?: string; pincode?: string; country?: string };
  social?: { instagram?: string; facebook?: string; youtube?: string };
  announcement?: string;
  seo?: { title?: string; description?: string };
  homeSections?: { key: string; enabled: boolean; order: number }[];
}
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
