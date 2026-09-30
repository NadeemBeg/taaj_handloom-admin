import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../api';
import { PageHeader, Button, Spinner, Field } from '../components/ui';

interface SettingsForm {
  brandName?: string;
  tagline?: string;
  whatsappNumber?: string;
  phone?: string;
  email?: string;
  addrLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  announcement?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  seoTitle?: string;
  seoDescription?: string;
}

const errMsg = (e: unknown) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not save settings';

export function Settings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: getSettings });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset } = useForm<SettingsForm>();

  useEffect(() => {
    if (!data) return;
    reset({
      brandName: data.brand?.name,
      tagline: data.brand?.tagline,
      whatsappNumber: data.whatsappNumber,
      phone: data.phone,
      email: data.email,
      addrLine1: data.address?.line1,
      city: data.address?.city,
      state: data.address?.state,
      pincode: data.address?.pincode,
      announcement: data.announcement,
      instagram: data.social?.instagram,
      facebook: data.social?.facebook,
      youtube: data.social?.youtube,
      seoTitle: data.seo?.title,
      seoDescription: data.seo?.description,
    });
  }, [data, reset]);

  const save = useMutation({
    mutationFn: (v: SettingsForm) =>
      updateSettings({
        brand: { name: v.brandName, tagline: v.tagline },
        whatsappNumber: v.whatsappNumber,
        phone: v.phone,
        email: v.email,
        address: { line1: v.addrLine1, city: v.city, state: v.state, pincode: v.pincode },
        announcement: v.announcement,
        social: { instagram: v.instagram, facebook: v.facebook, youtube: v.youtube },
        seo: { title: v.seoTitle, description: v.seoDescription },
      }),
    onSuccess: () => {
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (e) => setError(errMsg(e)),
  });

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Site Settings" subtitle="Business content shown across the storefront" />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Settings saved.</p>}

      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-6">
        <Card title="Brand">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand name"><input className="tf" {...register('brandName')} /></Field>
            <Field label="Tagline"><input className="tf" {...register('tagline')} /></Field>
          </div>
        </Card>

        <Card title="Announcement bar">
          <Field label="Announcement text">
            <input className="tf" {...register('announcement')} placeholder="Authentic Maheshwari Handloom • Manufacturer • Wholesale • Retail" />
          </Field>
        </Card>

        <Card title="Contact & WhatsApp">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp number (country code, no +)">
              <input className="tf" {...register('whatsappNumber')} placeholder="919999999999" />
            </Field>
            <Field label="Phone"><input className="tf" {...register('phone')} /></Field>
            <Field label="Email"><input className="tf" type="email" {...register('email')} /></Field>
            <Field label="Address line"><input className="tf" {...register('addrLine1')} /></Field>
            <Field label="City"><input className="tf" {...register('city')} /></Field>
            <Field label="State"><input className="tf" {...register('state')} /></Field>
            <Field label="Pincode"><input className="tf" {...register('pincode')} /></Field>
          </div>
        </Card>

        <Card title="Social links">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Instagram URL"><input className="tf" {...register('instagram')} placeholder="https://instagram.com/…" /></Field>
            <Field label="Facebook URL"><input className="tf" {...register('facebook')} placeholder="https://facebook.com/…" /></Field>
            <Field label="YouTube URL"><input className="tf" {...register('youtube')} placeholder="https://youtube.com/…" /></Field>
          </div>
        </Card>

        <Card title="SEO defaults">
          <div className="space-y-4">
            <Field label="Default meta title"><input className="tf" {...register('seoTitle')} /></Field>
            <Field label="Default meta description"><textarea className="tf min-h-20" {...register('seoDescription')} /></Field>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save settings'}</Button>
        </div>
      </form>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 font-display text-lg text-charcoal">{title}</h2>
      {children}
    </section>
  );
}
