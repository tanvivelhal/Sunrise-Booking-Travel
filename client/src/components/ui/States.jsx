import { Loader2, Inbox, AlertTriangle } from 'lucide-react';

export function PageLoader({ message = 'Loading your travel data...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
      <Loader2 size={28} className="animate-spin text-brand-600" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function InlineLoader({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
      <Loader2 size={16} className="animate-spin text-brand-600" />
      {message}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
        <Icon size={22} />
      </span>
      <h3 className="mt-1 text-sm font-bold text-slate-800">{title}</h3>
      {message && <p className="max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Unable to load travel data.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50/60 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-500">
        <AlertTriangle size={22} />
      </span>
      <h3 className="text-sm font-bold text-red-700">Something went wrong</h3>
      <p className="max-w-sm text-sm text-red-600/80">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-sm font-semibold text-red-700 underline underline-offset-2 hover:text-red-800">
          Try again
        </button>
      )}
    </div>
  );
}
