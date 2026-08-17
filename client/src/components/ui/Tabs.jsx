export function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`inline-flex rounded-lg bg-slate-100 p-1 ${className}`}>
      {tabs.map((tab) => {
        const activeTab = active === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
              activeTab
                ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.icon && <tab.icon size={15} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
