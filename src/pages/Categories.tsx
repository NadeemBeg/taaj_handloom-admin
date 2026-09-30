import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../api';
import { PageHeader, Button, Spinner, Badge, Modal, Field, ConfirmDialog } from '../components/ui';
import { ImageUploader } from '../components/ImageUploader';
import type { Category, Img } from '../types';

interface CatForm {
  name: string;
  description?: string;
  parent?: string;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  isActive: boolean;
}

const errMsg = (e: unknown) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Something went wrong';

export function Categories() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-cats'], queryFn: listCategories });
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [image, setImage] = useState<Img | undefined>();

  const { register, handleSubmit, reset } = useForm<CatForm>();

  const cats = useMemo(() => data?.categories ?? [], [data]);
  const parents = useMemo(() => cats.filter((c) => !c.parent), [cats]);
  const nameById = useMemo(() => new Map(cats.map((c) => [c._id, c.name])), [cats]);

  // Display order: each parent followed by its children, both by sortOrder.
  const ordered = useMemo(() => {
    const byOrder = (a: Category, b: Category) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name);
    const rows: Category[] = [];
    for (const p of [...parents].sort(byOrder)) {
      rows.push(p);
      cats.filter((c) => c.parent === p._id).sort(byOrder).forEach((c) => rows.push(c));
    }
    // Orphans (parent set but missing) at the end.
    cats.filter((c) => c.parent && !nameById.has(c.parent)).forEach((c) => rows.push(c));
    return rows;
  }, [cats, parents, nameById]);

  const siblings = (c: Category) =>
    ordered.filter((x) => (x.parent ?? null) === (c.parent ?? null));

  const openForm = (cat: Category | 'new') => {
    setError(null);
    if (cat === 'new') {
      reset({ name: '', description: '', parent: '', sortOrder: cats.length + 1, seoTitle: '', seoDescription: '', isActive: true });
      setImage(undefined);
    } else {
      reset({
        name: cat.name,
        description: cat.description,
        parent: cat.parent ?? '',
        sortOrder: cat.sortOrder ?? 0,
        seoTitle: cat.seo?.title,
        seoDescription: cat.seo?.description,
        isActive: cat.isActive ?? true,
      });
      setImage(cat.image);
    }
    setEditing(cat);
  };

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-cats'] });

  const save = useMutation({
    mutationFn: (v: CatForm) => {
      const body = {
        name: v.name,
        description: v.description,
        image,
        parent: v.parent ? v.parent : null,
        sortOrder: Number(v.sortOrder ?? 0),
        seo: { title: v.seoTitle, description: v.seoDescription },
        isActive: v.isActive,
      };
      return editing && editing !== 'new' ? updateCategory(editing._id, body) : createCategory(body);
    },
    onSuccess: () => { setEditing(null); invalidate(); },
    onError: (e) => setError(errMsg(e)),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => { setToDelete(null); invalidate(); },
    onError: (e) => setError(errMsg(e)),
  });

  const reorder = useMutation({
    mutationFn: async ({ cat, dir }: { cat: Category; dir: -1 | 1 }) => {
      const sibs = siblings(cat);
      const idx = sibs.findIndex((x) => x._id === cat._id);
      const other = sibs[idx + dir];
      if (!other) return;
      const a = cat.sortOrder ?? idx + 1;
      const b = other.sortOrder ?? idx + 1 + dir;
      await Promise.all([updateCategory(cat._id, { sortOrder: b }), updateCategory(other._id, { sortOrder: a })]);
    },
    onSuccess: invalidate,
    onError: (e) => setError(errMsg(e)),
  });

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Departments and their weave/motif subcategories"
        action={<Button onClick={() => openForm('new')}>+ New Category</Button>}
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center"><Spinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-ivory text-left text-charcoal/60">
              <tr>
                <th className="px-4 py-3 w-16">Order</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3">SEO</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((c) => {
                const sibs = siblings(c);
                const idx = sibs.findIndex((x) => x._id === c._id);
                return (
                  <tr key={c._id} className="border-t border-line/70">
                    <td className="px-4 py-3">
                      <div className="flex flex-col text-charcoal/40">
                        <button aria-label="Move up" disabled={idx === 0 || reorder.isPending} onClick={() => reorder.mutate({ cat: c, dir: -1 })} className="leading-none hover:text-brand-deep disabled:opacity-30">▲</button>
                        <button aria-label="Move down" disabled={idx === sibs.length - 1 || reorder.isPending} onClick={() => reorder.mutate({ cat: c, dir: 1 })} className="leading-none hover:text-brand-deep disabled:opacity-30">▼</button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={c.parent ? 'pl-4 text-charcoal/80' : 'font-semibold text-charcoal'}>
                        {c.parent && <span className="text-charcoal/30">↳ </span>}{c.name}
                      </span>
                      <div className="text-xs text-charcoal/40">{c.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-charcoal/60">{c.parent ? nameById.get(c.parent) ?? '—' : <span className="text-charcoal/30">—</span>}</td>
                    <td className="px-4 py-3">{c.seo?.title || c.seo?.description ? <Badge tone="green">Set</Badge> : <span className="text-charcoal/30 text-xs">—</span>}</td>
                    <td className="px-4 py-3">{c.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openForm(c)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => setToDelete(c)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {ordered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-charcoal/50">No categories yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal title={editing === 'new' ? 'New Category' : 'Edit Category'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name"><input className="tf" {...register('name', { required: true })} /></Field>
              <Field label="Display order"><input type="number" className="tf" {...register('sortOrder', { valueAsNumber: true })} /></Field>
            </div>
            <Field label="Parent category">
              <select className="tf" {...register('parent')}>
                <option value="">— None (top-level department) —</option>
                {parents
                  .filter((p) => !(editing !== 'new' && p._id === editing._id))
                  .map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Description"><textarea className="tf min-h-16" {...register('description')} /></Field>
            <ImageUploader label="Image" value={image} onChange={setImage} />

            <div className="rounded-lg border border-line p-3">
              <p className="mb-2 text-sm font-semibold text-charcoal/70">SEO</p>
              <div className="space-y-3">
                <Field label="Meta title"><input className="tf" {...register('seoTitle')} /></Field>
                <Field label="Meta description"><textarea className="tf min-h-16" {...register('seoDescription')} /></Field>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-charcoal/80">
              <input type="checkbox" className="h-4 w-4 rounded border-brand/40 text-brand-deep" {...register('isActive')} />
              Active
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete category"
          message={`Delete “${toDelete.name}”? Categories with products or subcategories cannot be deleted.`}
          loading={del.isPending}
          onCancel={() => setToDelete(null)}
          onConfirm={() => del.mutate(toDelete._id)}
        />
      )}
    </div>
  );
}
