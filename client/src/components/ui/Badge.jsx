export function Badge({ color = 'slate', children, className = '' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-brand-50 text-brand-700',
    navy: 'bg-navy-100 text-navy-800',
    teal: 'bg-accent-50 text-accent-700',
    green: 'bg-sunrise-50 text-sunrise-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    violet: 'bg-purple-50 text-purple-700',
  };
  return <span className={`badge ${colors[color] || colors.slate} ${className}`}>{children}</span>;
}

export const STATUS_STYLES = {
  Pending: 'bg-sky-50 text-sky-700 ring-sky-200',
  Approved: 'bg-brand-50 text-brand-700 ring-brand-200',
  Rejected: 'bg-red-50 text-red-700 ring-red-200',
  Ticketed: 'bg-sunrise-50 text-sunrise-700 ring-sunrise-200',
  Cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function StatusBadge({ status, className = '' }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export const POLICY_STYLES = {
  COMPLIANT: { label: 'Within company policy', color: 'green', dot: 'bg-sunrise-500' },
  WARNING: { label: 'Review required', color: 'amber', dot: 'bg-amber-500' },
  VIOLATION: { label: 'Policy violation', color: 'red', dot: 'bg-red-500' },
};

export function PolicyBadge({ status, showLabel = true }) {
  const s = POLICY_STYLES[status] || POLICY_STYLES.COMPLIANT;
  const colorMap = {
    green: 'bg-sunrise-50 text-sunrise-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${colorMap[s.color]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {showLabel ? s.label : status}
    </span>
  );
}
