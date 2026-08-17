import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

const TONE = {
  COMPLIANT: {
    icon: CheckCircle2,
    label: 'Within Company Policy',
    box: 'border-sunrise-200 bg-sunrise-50',
    text: 'text-sunrise-700',
    check: 'bg-sunrise-100 text-sunrise-600',
  },
  WARNING: {
    icon: AlertTriangle,
    label: 'Above Recommended Limit',
    box: 'border-amber-200 bg-amber-50',
    text: 'text-amber-700',
    check: 'bg-amber-100 text-amber-600',
  },
  VIOLATION: {
    icon: XCircle,
    label: 'Policy Violation',
    box: 'border-red-200 bg-red-50',
    text: 'text-red-700',
    check: 'bg-red-100 text-red-600',
  },
};

/** Compact inline policy chip. */
export function PolicyStatusChip({ status, labelOnly = false }) {
  const tone = TONE[status] || TONE.COMPLIANT;
  const Icon = tone.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${tone.box} ${tone.text}`}>
      <Icon size={13} />
      {labelOnly ? status : tone.label}
    </span>
  );
}

/** Detailed policy result panel with per-item checks and reasons. */
export function PolicyResultPanel({ policyResult, className = '' }) {
  if (!policyResult) return null;
  const tone = TONE[policyResult.status] || TONE.COMPLIANT;
  const Icon = tone.icon;
  const checks = policyResult.checks || [];

  return (
    <div className={`rounded-xl border ${tone.box} ${className}`}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone.check}`}>
          <Icon size={18} />
        </span>
        <div>
          <p className={`text-sm font-extrabold ${tone.text}`}>
            {policyResult.summary || tone.label}
          </p>
          {policyResult.bandLabel && (
            <p className="text-xs text-slate-500">Entitlement: {policyResult.bandLabel}</p>
          )}
        </div>
      </div>
      {checks.length > 0 && (
        <div className="space-y-2 border-t border-black/5 px-4 py-3.5">
          {checks.map((c, i) => {
            const cTone = TONE[c.status] || TONE.COMPLIANT;
            const CIcon = cTone.icon;
            return (
              <div key={i} className="flex items-start gap-2.5">
                <CIcon size={15} className={`mt-0.5 shrink-0 ${cTone.text}`} />
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-slate-800">
                    {c.item}: <span className={`font-bold ${cTone.text}`}>{cTone.label}</span>
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{c.message}</p>
                  {c.recommended && (
                    <p className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-2 py-1 text-xs font-semibold text-slate-700">
                      <Info size={12} className="text-brand-600" /> {c.recommended}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Compact list of checks for tables. */
export function PolicyChecksInline({ checks, max = 2 }) {
  const shown = (checks || []).slice(0, max);
  const more = (checks || []).length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((c, i) => {
        const t = TONE[c.status] || TONE.COMPLIANT;
        return (
          <span key={i} className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${t.box} ${t.text}`}>
            <t.icon size={10} /> {c.item}
          </span>
        );
      })}
      {more > 0 && <span className="text-[10px] font-semibold text-slate-400">+{more} more</span>}
    </div>
  );
}
