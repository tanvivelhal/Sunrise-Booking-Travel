/**
 * Abstract corporate-travel visual: a dotted route map with city nodes,
 * dashed flight arcs and a small aircraft. Purely decorative — used on
 * the auth panels, landing hero and sidebar footer.
 */
export default function TravelMapArt({ className = '' }) {
  return (
    <svg viewBox="0 0 480 340" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Dotted grid */}
      <g opacity="0.5">
        {Array.from({ length: 13 }, (_, r) =>
          Array.from({ length: 17 }, (_, c) => (
            <circle key={`${r}-${c}`} cx={30 + c * 30} cy={28 + r * 24} r="1.3" className="fill-current" opacity="0.35" />
          ))
        )}
      </g>

      {/* Route arcs */}
      <g strokeWidth="1.5" strokeLinecap="round" fill="none">
        <path d="M80 90 C 150 40, 210 60, 250 120" strokeDasharray="2 6" className="stroke-accent-400" opacity="0.85" />
        <path d="M250 120 C 300 180, 350 170, 420 120" strokeDasharray="2 6" className="stroke-brand-300" opacity="0.7" />
        <path d="M80 90 C 60 170, 120 230, 200 240" strokeDasharray="2 6" className="stroke-brand-300" opacity="0.6" />
        <path d="M200 240 C 280 260, 340 240, 420 200" strokeDasharray="2 6" className="stroke-accent-400" opacity="0.7" />
        <path d="M420 120 C 430 160, 440 170, 420 200" strokeDasharray="2 6" className="stroke-brand-400" opacity="0.55" />
      </g>

      {/* City nodes */}
      <g className="text-white">
        <circle cx="80" cy="90" r="5" className="fill-brand-500" />
        <circle cx="250" cy="120" r="6" className="fill-accent-500" />
        <circle cx="420" cy="120" r="5" className="fill-brand-400" />
        <circle cx="200" cy="240" r="5" className="fill-accent-400" />
        <circle cx="420" cy="200" r="4" className="fill-brand-500" />
      </g>
      <g className="text-slate-400">
        <circle cx="80" cy="90" r="9" strokeWidth="1" className="stroke-current opacity-50" fill="none" />
        <circle cx="250" cy="120" r="10" strokeWidth="1" className="stroke-current opacity-50" fill="none" />
        <circle cx="420" cy="120" r="9" strokeWidth="1" className="stroke-current opacity-50" fill="none" />
      </g>

      {/* Aircraft on the main arc */}
      <g transform="translate(208 86) rotate(-28)">
        <path
          d="M0 0 L14 -6 L10 0 L14 6 Z"
          className="fill-accent-500"
        />
        <path d="M0 0 L14 -6 L10 0 L14 6 Z" strokeWidth="1" className="stroke-white" fill="none" opacity="0.8" />
      </g>

      {/* Soft landing glow under the primary node */}
      <circle cx="250" cy="120" r="22" className="fill-accent-400" opacity="0.12" />
    </svg>
  );
}
