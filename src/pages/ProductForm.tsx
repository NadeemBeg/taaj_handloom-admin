import { useEffect, useState } from 'react';
import { useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProduct,
  createProduct,
  updateProduct,
  listCategories,
} from '../api';
import { PageHeader, Button, Field, Spinner } from '../components/ui';
import { VariantManager } from '../components/VariantManager';
import { ImageUploader } from '../components/ImageUploader';
import type { Img } from '../types';

interface FormShape {
  name: string;
  sku: string;
  category: string;
  shortDescription?: string;
  description?: string;
  careInstructions?: string;
  pricing: { mrp: number; price: number; wholesalePrice?: number };
  attributes: { fabric?: string; material?: string; pattern?: string };
  occasionCsv?: string;
  tagsCsv?: string;
  baseStock: { quantity: number; lowStockThreshold: number };
  flags: { isFeatured: boolean; isBestSeller: boolean; isNewArrival: boolean; isActive: boolean };
  seo: { title?: string; description?: string };
}

const splitCsv = (v?: string) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export function ProductForm() {
  const { slug } = useParams();
  const isEdit = slug !== undefined && slug !== 'new';
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<Img | undefined>();
  const [gallery, setGallery] = useState<Img[]>([]);

  const categories = useQuery({ queryKey: ['cats'], queryFn: listCategories });
  const productQuery = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProduct(slug as string),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormShape>({
    defaultValues: {
      flags: { isActive: true, isNewArrival: true, isFeatured: false, isBestSeller: false },
      baseStock: { quantity: 0, lowStockThreshold: 3 },
    },
  });

  // Populate the form when editing.
  useEffect(() => {
    const p = productQuery.data?.product;
    if (!p) return;
    setMainImage(p.media.mainImage);
    setGallery(p.media.gallery ?? []);
    reset({
      name: p.name,
      sku: p.sku,
      category: typeof p.category === 'object' ? p.category?._id : (p.category ?? ''),
      shortDescription: p.shortDescription,
      description: p.description,
      careInstructions: p.careInstructions,
      pricing: { mrp: p.pricing.mrp, price: p.pricing.price, wholesalePrice: p.pricing.wholesalePrice },
      attributes: { fabric: p.attributes?.fabric, material: p.attributes?.material, pattern: p.attributes?.pattern },
      occasionCsv: p.attributes?.occasion?.join(', '),
      tagsCsv: p.attributes?.tags?.join(', '),
      baseStock: { quantity: p.baseStock?.quantity ?? 0, lowStockThreshold: p.baseStock?.lowStockThreshold ?? 3 },
      flags: {
        isFeatured: !!p.flags?.isFeatured,
        isBestSeller: !!p.flags?.isBestSeller,
        isNewArrival: !!p.flags?.isNewArrival,
        isActive: p.flags?.isActive ?? true,
      },
      seo: { title: p.seo?.title, description: p.seo?.description },
    });
  }, [productQuery.data, reset]);

  const save = useMutation({
    mutationFn: (body: unknown) =>
      isEdit ? updateProduct(productQuery.data!.product._id, body) : createProduct(body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['product', res.product.slug] });
      if (!isEdit) navigate(`/products/${res.product.slug}`);
    },
    onError: (e) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Could not save product');
    },
  });

  const onSubmit = (v: FormShape) => {
    setError(null);
    if (!mainImage) {
      setError('A main image is required.');
      return;
    }
    const body = {
      name: v.name,
      sku: v.sku,
      category: v.category,
      shortDescription: v.shortDescription,
      description: v.description,
      careInstructions: v.careInstructions,
      pricing: {
        mrp: Number(v.pricing.mrp),
        price: Number(v.pricing.price),
        wholesalePrice: v.pricing.wholesalePrice ? Number(v.pricing.wholesalePrice) : undefined,
      },
      attributes: {
        fabric: v.attributes.fabric,
        material: v.attributes.material,
        pattern: v.attributes.pattern,
        occasion: splitCsv(v.occasionCsv),
        tags: splitCsv(v.tagsCsv),
      },
      media: {
        mainImage,
        gallery,
      },
      baseStock: { quantity: Number(v.baseStock.quantity), lowStockThreshold: Number(v.baseStock.lowStockThreshold) },
      flags: v.flags,
      seo: v.seo,
    };
    save.mutate(body);
  };

  if (isEdit && productQuery.isLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  }

  const product = productQuery.data?.product;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={isEdit ? 'Edit Product' : 'New Product'}
        subtitle={product?.sku}
        action={<Link to="/products"><Button variant="ghost">← Back</Button></Link>}
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="card grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={errors.name && 'Required'} full>
            <input className="tf" {...register('name', { required: true })} />
          </Field>
          <Field label="SKU" error={errors.sku && 'Required'}>
            <input className="tf" {...register('sku', { required: true })} />
          </Field>
          <Field label="Category" error={errors.category && 'Required'}>
            <select className="tf" {...register('category', { required: true })}>
              <option value="">Select…</option>
              {categories.data?.categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Short description" full>
            <input className="tf" {...register('shortDescription')} />
          </Field>
          <Field label="Description" full>
            <textarea className="tf min-h-24" {...register('description')} />
          </Field>
          <Field label="Care instructions" full>
            <input className="tf" {...register('careInstructions')} />
          </Field>
        </section>

        <section className="card grid gap-4 sm:grid-cols-3">
          <Field label="MRP (₹)" error={errors.pricing?.mrp && 'Required'}>
            <input className="tf" type="number" step="1" {...register('pricing.mrp', { required: true, valueAsNumber: true })} />
          </Field>
          <Field label="Selling price (₹)" error={errors.pricing?.price && 'Required'}>
            <input className="tf" type="number" step="1" {...register('pricing.price', { required: true, valueAsNumber: true })} />
          </Field>
          <Field label="Wholesale price (₹)">
            <input className="tf" type="number" step="1" {...register('pricing.wholesalePrice', { valueAsNumber: true })} />
          </Field>
        </section>

        <section className="card grid gap-4 sm:grid-cols-2">
          <Field label="Fabric"><input className="tf" {...register('attributes.fabric')} /></Field>
          <Field label="Material"><input className="tf" {...register('attributes.material')} /></Field>
          <Field label="Pattern"><input className="tf" {...register('attributes.pattern')} /></Field>
          <Field label="Occasion (comma separated)"><input className="tf" {...register('occasionCsv')} /></Field>
          <Field label="Tags (comma separated)" full><input className="tf" {...register('tagsCsv')} /></Field>
        </section>

        <section className="card grid gap-6 sm:grid-cols-2">
          <ImageUploader label="Main image *" value={mainImage} onChange={setMainImage} />
          <ImageUploader label="Gallery images" multiple value={gallery} onChange={setGallery} />
        </section>

        <section className="card">
          <p className="mb-3 text-sm font-medium text-charcoal/70">
            Base stock {product?.hasVariants && '(managed per-variant since this product has variants)'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Quantity">
              <input className="tf" type="number" {...register('baseStock.quantity', { valueAsNumber: true })} disabled={product?.hasVariants} />
            </Field>
            <Field label="Low-stock threshold">
              <input className="tf" type="number" {...register('baseStock.lowStockThreshold', { valueAsNumber: true })} />
            </Field>
          </div>
          <p className="mt-2 text-xs text-charcoal/40">Adjust stock levels from the Inventory page to keep an audit trail.</p>
        </section>

        <section className="card flex flex-wrap gap-5">
          <Check label="Active" registration={register('flags.isActive')} />
          <Check label="Featured" registration={register('flags.isFeatured')} />
          <Check label="Best seller" registration={register('flags.isBestSeller')} />
          <Check label="New arrival" registration={register('flags.isNewArrival')} />
        </section>

        <div className="flex justify-end gap-2">
          <Link to="/products"><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button type="submit" disabled={isSubmitting || save.isPending}>
            {save.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </form>

      {isEdit && product && (
        <div className="mt-8">
          <VariantManager productId={product._id} variants={productQuery.data?.variants ?? []} />
        </div>
      )}
    </div>
  );
}

const Check = ({ label, registration }: { label: string; registration: UseFormRegisterReturn }) => (
  <label className="flex items-center gap-2 text-sm text-charcoal/80">
    <input type="checkbox" className="h-4 w-4 rounded border-brand/40 text-brand-deep" {...registration} />
    {label}
  </label>
);
