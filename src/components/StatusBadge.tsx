const STYLES: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  WHATSAPP_CONTACTED: 'bg-teal-100 text-teal-700',
  CONFIRMED: 'bg-brand-soft text-brand-deep',
  PROCESSING: 'bg-amber-100 text-amber-700',
  READY_TO_SHIP: 'bg-indigo-100 text-indigo-700',
  SHIPPED: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  RETURNED: 'bg-orange-100 text-orange-700',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] ?? 'bg-charcoal/10 text-charcoal/70'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
