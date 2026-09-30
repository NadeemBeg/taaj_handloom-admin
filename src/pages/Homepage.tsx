import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../api';
import { PageHeader, Button, Spinner } from '../components/ui';

interface Section {
  key: string;
  enabled: boolean;
  order: number;
}

const LABELS: Record<string, { title: string; hint: string }> = {
  categories: { title: 'Featured Categories', hint: 'Shop-by-category tiles' },
  featured: { title: 'Featured Products', hint: 'Products flagged as featured' },
  charkha: { title: 'Charkha Story', hint: '"From Thread to Tradition" section' },
  why: { title: 'Why Choose Us', hint: 'Trust / value propositions' },
  newArrivals: { title: 'New Arrivals', hint: 'Latest products' },
  bestSellers: { title: 'Best Sellers', hint: 'Top-selling products' },
  wholesale: { title: 'Wholesale CTA', hint: 'Bulk-order call to action' },
  social: { title: 'Social Strip', hint: 'Follow-us band + collection grid' },
};

const DEFAULTS: Section[] = Object.keys(LABELS).map((key, i) => ({ key, enabled: true, order: i + 1 }));
const errMsg = (e: unknown) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Could not save';

export function Homepage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: getSettings });
  const [sections, setSections] = useState<Section[]>(DEFAULTS);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fromApi = data?.homeSections;
    if (fromApi && fromApi.length) {
      // Merge any newly-added section keys that aren't stored yet.
      const known = new Set(fromApi.map((s) => s.key));
      const merged = [...fromApi].sort((a, b) => a.order - b.order);
      DEFAULTS.filter((d) => !known.has(d.key)).forEach((d) => merged.push({ ...d, order: merged.length + 1 }));
      setSections(merged);
    }
  }, [data]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next.map((s, idx) => ({ ...s, order: idx + 1 })));
  };
  const toggle = (i: number) =>
    setSections(sections.map((s, idx) => (idx === i ? { ...s, enabled: !s.enabled } : s)));

  const save = useMutation({
    mutationFn: () => updateSettings({ homeSections: sections.map((s, i) => ({ ...s, order: i + 1 })) }),
    onSuccess: () => {
      setError(null); setSaved(true); setTimeout(() => setSaved(false), 2500);
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (e) => setError(errMsg(e)),
  });

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Homepage"
        subtitle="Reorder and show/hide homepage sections (the hero is always shown)"
        action={<Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save layout'}</Button>}
      />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Homepage layout saved.</p>}

      <div className="space-y-2">
        {sections.map((s, i) => {
          const label = LABELS[s.key] ?? { title: s.key, hint: '' };
          return (
            <div key={s.key} className={`card flex items-center gap-4 p-3 ${!s.enabled ? 'opacity-60' : ''}`}>
              <div className="flex flex-col text-charcoal/40">
                <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="leading-none hover:text-brand-deep disabled:opacity-30">▲</button>
                <button aria-label="Move down" disabled={i === sections.length - 1} onClick={() => move(i, 1)} className="leading-none hover:text-brand-deep disabled:opacity-30">▼</button>
              </div>
              <div className="flex-1">
                <p className="font-medium text-charcoal">{label.title}</p>
                <p className="text-xs text-charcoal/50">{label.hint}</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-charcoal/70">
                <input type="checkbox" className="h-4 w-4 rounded border-brand/40 text-brand-deep" checked={s.enabled} onChange={() => toggle(i)} />
                {s.enabled ? 'Visible' : 'Hidden'}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
