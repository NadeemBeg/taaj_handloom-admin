import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listBanners, createBanner, updateBanner, deleteBanner } from '../api';
import { PageHeader, Button, Spinner, Badge, Modal, Field, ConfirmDialog } from '../components/ui';
import { ImageUploader } from '../components/ImageUploader';
import type { Banner, Img } from '../types';

interface BannerForm {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  sortOrder?: number;
  isActive: boolean;
}

const errMsg = (e: unknown) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong';

export function Banners() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners', 'HERO'],
    queryFn: () => listBanners('HERO'),
  });
  const [editing, setEditing] = useState<Banner | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Banner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [desktop, setDesktop] = useState<Img | undefined>();
  const [mobile, setMobile] = useState<Img | undefined>();

  const { register, handleSubmit, reset } = useForm<BannerForm>();
  const banners = [...(data?.banners ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-banners'] });

  const openForm = (b: Banner | 'new') => {
    setError(null);
    if (b === 'new') {
      reset({ title: '', subtitle: '', ctaLabel: '', ctaHref: '', sortOrder: (banners.length + 1), isActive: true });
      setDesktop(undefined);
      setMobile(undefined);
    } else {
      reset({
        title: b.title, subtitle: b.subtitle, ctaLabel: b.ctaLabel, ctaHref: b.ctaHref,
        sortOrder: b.sortOrder ?? 0, isActive: b.isActive ?? true,
      });
      setDesktop(b.desktopImage);
      setMobile(b.mobileImage);
    }
    setEditing(b);
  };

  const save = useMutation({
    mutationFn: (v: BannerForm) => {
      if (!desktop) throw { response: { data: { message: 'A desktop image is required.' } } };
      const body = {
        type: 'HERO',
        title: v.title, subtitle: v.subtitle,
        desktopImage: desktop, mobileImage: mobile,
        ctaLabel: v.ctaLabel, ctaHref: v.ctaHref,
        sortOrder: Number(v.sortOrder ?? 0), isActive: v.isActive,
      };
      return editing && editing !== 'new' ? updateBanner(editing._id, body) : createBanner(body);
    },
    onSuccess: () => { setEditing(null); invalidate(); },
    onError: (e) => setError(errMsg(e)),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteBanner(id),
    onSuccess: () => { setToDelete(null); invalidate(); },
    onError: (e) => setError(errMsg(e)),
  });

  const toggleActive = useMutation({
    mutationFn: (b: Banner) => updateBanner(b._id, { isActive: !b.isActive }),
    onSuccess: invalidate,
    onError: (e) => setError(errMsg(e)),
  });

  // Reorder by swapping sortOrder with the adjacent banner.
  const reorder = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const a = banners[index];
      const b = banners[index + dir];
      if (!a || !b) return;
      const ao = a.sortOrder ?? index + 1;
      const bo = b.sortOrder ?? index + 1 + dir;
      await Promise.all([updateBanner(a._id, { sortOrder: bo }), updateBanner(b._id, { sortOrder: ao })]);
    },
    onSuccess: invalidate,
    onError: (e) => setError(errMsg(e)),
  });

  return (
    <div>
      <PageHeader
        title="Hero Banners"
        subtitle="Slides shown in the homepage hero carousel"
        action={<Button onClick={() => openForm('new')}>+ New Banner</Button>}
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {isLoading ? (
        <div className="card flex h-48 items-center justify-center"><Spinner /></div>
      ) : banners.length === 0 ? (
        <div className="card p-12 text-center text-charcoal/50">
          No hero banners yet. Add one to populate the homepage slider.
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, i) => (
            <div key={b._id} className="card flex items-center gap-4 p-3">
              {/* Reorder */}
              <div className="flex flex-col">
                <button
                  aria-label="Move up"
                  disabled={i === 0 || reorder.isPending}
                  onClick={() => reorder.mutate({ index: i, dir: -1 })}
                  className="px-1 text-charcoal/40 hover:text-brand-deep disabled:opacity-30"
                >▲</button>
                <button
                  aria-label="Move down"
                  disabled={i === banners.length - 1 || reorder.isPending}
                  onClick={() => reorder.mutate({ index: i, dir: 1 })}
                  className="px-1 text-charcoal/40 hover:text-brand-deep disabled:opacity-30"
                >▼</button>
              </div>

              <div className="h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-ivory ring-1 ring-black/10">
                {b.desktopImage?.url && <img src={b.desktopImage.url} alt="" className="h-full w-full object-cover" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-charcoal">{b.title || <span className="text-charcoal/40">Untitled</span>}</p>
                  {b.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Hidden</Badge>}
                </div>
                {b.subtitle && <p className="truncate text-sm text-charcoal/50">{b.subtitle}</p>}
                {b.ctaLabel && (
                  <p className="mt-0.5 text-xs text-charcoal/40">
                    CTA: <span className="font-medium text-brand-deep">{b.ctaLabel}</span> → {b.ctaHref || '—'}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleActive.mutate(b)} disabled={toggleActive.isPending}>
                  {b.isActive ? 'Hide' : 'Show'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => openForm(b)}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => setToDelete(b)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'New Hero Banner' : 'Edit Hero Banner'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <Field label="Heading"><input className="tf" placeholder="Authentic Maheshwari Handloom" {...register('title')} /></Field>
            <Field label="Subheading"><textarea className="tf min-h-16" placeholder="Handcrafted in Maheshwar…" {...register('subtitle')} /></Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="CTA label"><input className="tf" placeholder="Shop Sarees" {...register('ctaLabel')} /></Field>
              <Field label="CTA link"><input className="tf" placeholder="/sarees" {...register('ctaHref')} /></Field>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-charcoal/70">Desktop image <span className="text-red-500">*</span></p>
              <ImageUploader value={desktop} onChange={setDesktop} />
              <p className="mt-1 text-xs text-charcoal/40">Wide landscape (~1600×760). Shown on tablet & desktop.</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-charcoal/70">Mobile image <span className="text-charcoal/40">(optional)</span></p>
              <ImageUploader value={mobile} onChange={setMobile} />
              <p className="mt-1 text-xs text-charcoal/40">Portrait (~900×1100). Falls back to the desktop image if empty.</p>
            </div>

            <div className="grid grid-cols-2 items-end gap-4">
              <Field label="Display order"><input type="number" className="tf" {...register('sortOrder', { valueAsNumber: true })} /></Field>
              <label className="flex items-center gap-2 pb-2 text-sm text-charcoal/80">
                <input type="checkbox" className="h-4 w-4 rounded border-brand/40 text-brand-deep" {...register('isActive')} />
                Active (visible on site)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save banner'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete banner"
          message={`Delete “${toDelete.title || 'Untitled'}”? This removes it from the homepage slider.`}
          loading={del.isPending}
          onCancel={() => setToDelete(null)}
          onConfirm={() => del.mutate(toDelete._id)}
        />
      )}
    </div>
  );
}
