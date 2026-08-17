import { Link } from 'react-router-dom';

export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="sunrise-tile" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1D2542" />
          <stop offset="1" stopColor="#12172E" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#sunrise-tile)" />
      <circle cx="16" cy="17" r="6" fill="#FFFFFF" />
      <path
        d="M16 7V4M16 30V27M25 17H28M4 17H7M23 9L25 7M7 25L9 23M23 25L25 27M7 9L9 11"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M9 21C10.5 22.5 12.5 23.5 16 23.5C19.5 23.5 21.5 22.5 23 21" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ dark = false, to = '/' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 shrink-0">
      <LogoMark size={32} />
      <span className="flex flex-col leading-none">
        <span className={`text-base font-extrabold tracking-tight ${dark ? 'text-white' : 'text-navy-950'}`}>
          SUNRISE
        </span>
        <span className={`mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] ${dark ? 'text-slate-400' : 'text-slate-400'}`}>
          Corporate Travel
        </span>
      </span>
    </Link>
  );
}
