import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

function cn(...c: Array<string | false | undefined>) {
  return c.filter(Boolean).join(' ');
}

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-brand-deep text-white hover:bg-brand-deep/90',
  outline: 'border border-brand/30 text-brand-deep hover:bg-brand-soft/40',
  ghost: 'text-charcoal/70 hover:bg-ivory',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }
>(function Button({ variant = 'primary', size = 'md', className, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand/30 border-t-brand-deep',
        className,
      )}
    />
  );
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'green' | 'red' | 'gold' }) {
  const tones = {
    default: 'bg-charcoal/10 text-charcoal/70',
    green: 'bg-brand-soft text-brand-deep',
    red: 'bg-red-100 text-red-700',
    gold: 'bg-gold/20 text-gold',
  };
  return <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>;
}

export function Field({ label, error, children, full }: { label: string; error?: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={cn('flex flex-col gap-1', full && 'sm:col-span-2')}>
      <span className="text-sm font-medium text-charcoal/70">{label}</span>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mt-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-charcoal">{title}</h2>
          <button onClick={onClose} className="text-charcoal/40 hover:text-charcoal" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-display text-lg text-charcoal">{title}</h2>
        <p className="mt-2 text-sm text-charcoal/60">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl text-charcoal">{title}</h1>
        {subtitle && <p className="text-sm text-charcoal/50">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
