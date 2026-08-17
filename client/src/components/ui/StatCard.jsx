const ICON_BG = {
  blue: 'bg-brand-50 text-brand-600',
  navy: 'bg-navy-100 text-navy-700',
  teal: 'bg-accent-50 text-accent-600',
  green: 'bg-sunrise-50 text-sunrise-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  violet: 'bg-purple-50 text-purple-600',
  slate: 'bg-slate-100 text-slate-600',
};

export function StatCard({ label, value, sub, icon: Icon, color = 'blue', className = '' }) {
  return (
    <div className={`card flex items-start justify-between gap-3 p-4 ${className}`}>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="mt-1.5 truncate text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      </div>
      {Icon && (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ICON_BG[color]}`}>
          <Icon size={18} />
        </span>
      )}
    </div>
  );
}
