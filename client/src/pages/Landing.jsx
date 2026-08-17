import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  ShieldCheck,
  ArrowRight,
  Check,
  AlertTriangle,
  XCircle,
  Sparkles,
  Globe2,
  Menu,
  X,
  Building2,
  Users,
  Wallet,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo.jsx';
import TravelMapArt from '../components/TravelMapArt.jsx';
import FeatureArt from '../components/FeatureArt.jsx';

const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Travel', href: '#travel' },
  { label: 'Policy', href: '#policy' },
  { label: 'Enterprise', href: '#enterprise' },
  { label: 'Contact', href: '#contact' },
];

const FEATURES = [
  { art: 'flight', title: 'Flight Booking', text: 'Search and select flights across airlines with live fare, baggage and class details — all within company limits.' },
  { art: 'hotel', title: 'Hotel Booking', text: 'Curated corporate hotel inventory with star ratings, amenities and nightly rates matched to your entitlement.' },
  { art: 'rail', title: 'Railway Booking', text: 'Realistic Indian railway search — Rajdhani, Shatabdi, Duronto and Express trains with class-level fares.' },
  { art: 'policy', title: 'Smart Policy Validation', text: 'Every selection is checked against your salary-band policy automatically — before it ever reaches your manager.' },
  { art: 'approvals', title: 'Manager Approvals', text: 'A clear approval queue with full context — employee, cost, policy result and travel details — so decisions are fast.' },
  { art: 'analytics', title: 'Travel Analytics', text: 'Company-wide spend, most travelled cities and policy compliance trends calculated from real booking data.' },
];

const WORKFLOW = [
  { step: '01', title: 'Employee books travel', text: 'Employees search flights, hotels or trains for a business trip.' },
  { step: '02', title: 'Sunrise checks company policy', text: 'The policy engine validates every selection against the employee’s salary band.' },
  { step: '03', title: 'Manager approves or rejects', text: 'Requests land in the manager’s queue with full context and a policy verdict.' },
  { step: '04', title: 'Booking gets ticketed', text: 'Approved trips are ticketed and tracked end-to-end.' },
  { step: '05', title: 'Admin monitors spend', text: 'Admins see company-wide travel spend, activity and compliance at a glance.' },
];

const POLICY_BANDS = [
  { band: 'Band A', role: 'Junior Staff', flight: 'Economy', hotel: 'Up to 2★', rail: 'SL / 3AC', flightMax: '₹8,000', hotelMax: '₹3,000/night' },
  { band: 'Band B', role: 'Executive', flight: 'Economy', hotel: 'Up to 3★', rail: '3AC / 2AC', flightMax: '₹12,000', hotelMax: '₹5,000/night' },
  { band: 'Band C', role: 'Senior Staff', flight: 'Economy / Premium', hotel: 'Up to 4★', rail: '2AC / EC', flightMax: '₹20,000', hotelMax: '₹8,000/night' },
  { band: 'Band D', role: 'Leadership', flight: 'Business', hotel: 'Up to 5★', rail: '1AC / EC', flightMax: '₹35,000', hotelMax: '₹15,000/night' },
];

const POLICY_CASES = [
  { icon: Check, tone: 'green', title: 'Within Company Policy', desc: 'Junior Executive · Economy · 2★ hotel', note: '“Economy class within Band A entitlement.”' },
  { icon: AlertTriangle, tone: 'amber', title: 'Review Required', desc: 'Executive · Hotel ₹6,200/night', note: '“Above the Band B limit of ₹5,000/night.”' },
  { icon: XCircle, tone: 'red', title: 'Policy Violation', desc: 'Junior Executive · Business class', note: '“Band A employees are eligible for Economy class only.”' },
];

const FOOTER_COLS = [
  { title: 'Product', links: ['Flight Booking', 'Hotel Booking', 'Railway Booking', 'Policy Engine', 'Analytics'] },
  { title: 'Company', links: ['About Us', 'Careers', 'Press', 'Partners'] },
  { title: 'Resources', links: ['Help Center', 'Travel Policy Guide', 'API Docs', 'Release Notes'] },
  { title: 'Support', links: ['Contact', 'FAQs', 'Status', 'Security'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'Compliance'] },
];

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white" id="top">
      {/* ---------- NAVBAR ---------- */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="container-sunrise flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-semibold text-slate-600 transition hover:text-navy-950">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link to="/login" className="btn-ghost btn-md">Sign In</Link>
            <Link to="/register" className="btn-primary btn-md">Get Started <ArrowRight size={15} /></Link>
          </div>
          <button onClick={() => setMobileOpen((v) => !v)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {l.label}
                </a>
              ))}
              <div className="mt-3 flex gap-3">
                <Link to="/login" className="btn-outline btn-md flex-1">Sign In</Link>
                <Link to="/register" className="btn-primary btn-md flex-1">Get Started</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <TravelMapArt className="pointer-events-none absolute inset-0 h-full w-full text-white/90" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-950/60 via-transparent to-navy-950" />
        <div className="container-sunrise relative grid items-center gap-14 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-400/30 bg-accent-400/10 px-4 py-1.5 text-xs font-semibold text-accent-300">
              <Sparkles size={13} />
              The corporate travel management platform
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Corporate travel, <span className="text-accent-400">simplified.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
              Plan, approve and manage every business trip from one intelligent travel platform —
              with company policy checked automatically at every step.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#how-it-works" className="btn-primary btn-lg">
                Explore Sunrise <ArrowRight size={17} />
              </a>
              <Link to="/register" className="btn-accent btn-lg">
                Get Started
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-400">
              <span className="flex items-center gap-2"><Check size={15} className="text-sunrise-400" /> Policy-checked bookings</span>
              <span className="flex items-center gap-2"><Check size={15} className="text-sunrise-400" /> Manager approval workflow</span>
              <span className="flex items-center gap-2"><Check size={15} className="text-sunrise-400" /> Live spend analytics</span>
            </div>
          </div>

          {/* Trip snapshot panel */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-white/10 bg-white p-5 text-slate-900 shadow-lift">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Welcome back, Rahul</p>
                  <p className="text-sm font-extrabold">Here’s your travel at a glance</p>
                </div>
                <span className="badge bg-navy-100 text-navy-800">Band A · Economy</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: 'Upcoming trips', value: '2' },
                  { label: 'Pending requests', value: '1' },
                  { label: 'Ticketed', value: '6' },
                  { label: 'Travel spend', value: '₹46,800' },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold text-slate-500">{s.label}</p>
                    <p className="mt-1 text-lg font-extrabold">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-slate-100 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Plane size={15} /></span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Mumbai → Delhi</p>
                      <p className="text-[11px] text-slate-500">Vistara UK-945 · Economy · ₹7,850</p>
                    </div>
                  </div>
                  <span className="badge bg-sunrise-50 text-sunrise-700">✓ Within policy</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                  <span className="rounded-md bg-brand-50 px-2 py-1 text-brand-700">Pending approval</span>
                  <ChevronRight size={11} />
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">Approved</span>
                  <ChevronRight size={11} />
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">Ticketed</span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-slate-200 bg-white p-3.5 shadow-card sm:block">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sunrise-50 text-sunrise-600"><ShieldCheck size={18} /></span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Policy validated</p>
                  <p className="text-[11px] text-slate-500">Band A · Economy · 2★ hotel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TRUST STRIP ---------- */}
      <section className="border-b border-slate-100 bg-white">
        <div className="container-sunrise grid grid-cols-2 gap-6 py-10 text-center sm:grid-cols-4">
          {[
            { icon: Building2, value: '120+', label: 'Enterprise clients' },
            { icon: Users, value: '12,000+', label: 'Employees managed' },
            { icon: Wallet, value: '₹40Cr+', label: 'Travel managed' },
            { icon: Globe2, value: '40+', label: 'Cities covered' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1.5">
              <s.icon size={20} className="text-brand-600" />
              <p className="text-xl font-extrabold text-navy-950">{s.value}</p>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <section id="how-it-works" className="bg-cream-50 py-20 lg:py-24">
        <div className="container-sunrise">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-brand-600">How it works</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">
              From request to ticketed — one clear workflow
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Every business trip follows the same governed path. Nothing is booked until the company policy and the right people have signed off.
            </p>
          </div>
          <div className="relative mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-slate-200 lg:block" />
            {WORKFLOW.map((w, i) => (
              <div key={w.step} className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-xl bg-navy-950 text-base font-extrabold text-accent-400">
                  {w.step}
                </span>
                <h3 className="mt-4 text-sm font-bold text-navy-950">{w.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{w.text}</p>
                {i < WORKFLOW.length - 1 && (
                  <ArrowRight size={16} className="absolute -right-3.5 top-7 hidden -translate-y-1/2 text-slate-300 lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- TRAVEL / FEATURES ---------- */}
      <section id="travel" className="bg-white py-20 lg:py-24">
        <div className="container-sunrise">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-brand-600">Everything in one place</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">
              Flights, hotels, railways — governed by one policy
            </h2>
            <p className="mt-4 text-base text-slate-600">
              A complete corporate travel toolkit, built around the way businesses actually travel.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Link
                key={f.title}
                to="/login"
                aria-label={`${f.title} — sign in to explore`}
                className="group card card-hover block overflow-hidden p-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <div className="relative h-40 overflow-hidden border-b border-slate-100 sm:h-44">
                  <div className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.05]">
                    <FeatureArt variant={f.art} className="h-full w-full" />
                  </div>
                </div>
                <div className="p-7">
                  <h3 className="text-lg font-bold text-navy-950 transition-colors group-hover:text-brand-700">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.text}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                    Explore
                    <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- BUSINESS VALUE (navy) ---------- */}
      <section id="enterprise" className="relative overflow-hidden bg-navy-950 py-20 text-white lg:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 top-0 h-[420px] w-[420px] rounded-full bg-brand-600/15 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-[380px] w-[380px] rounded-full bg-accent-500/10 blur-3xl" />
        </div>
        <div className="container-sunrise relative grid items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="section-eyebrow text-accent-400">Built for enterprise travel</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              The problem every company has — <span className="text-accent-400">solved</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">
              Employees need to travel for business. Spreadsheets and consumer booking sites can’t enforce policy,
              track approvals or show who is spending what. SUNRISE centralizes the entire journey.
            </p>
            <div className="mt-8 space-y-4">
              {[
                { title: 'Employees book business travel', text: 'Fast search across flights, hotels and railways — no more personal credit cards or expense chaos.' },
                { title: 'Sunrise checks company policy', text: 'Salary-band entitlements are validated automatically on every selection, before approval.' },
                { title: 'Managers approve with context', text: 'Employee, destination, cost and policy verdict — everything needed to decide in one screen.' },
                { title: 'Admins monitor spend', text: 'Company-wide dashboards show today’s bookings, cancelled trips, travel spend and top cities.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunrise-500/20 text-sunrise-400">
                    <Check size={13} />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold">{item.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            {[
              { label: 'Policy compliance', value: '98%', sub: 'of bookings within band limits', bar: 'w-[98%]', color: 'bg-accent-500' },
              { label: 'Approval turnaround', value: '3.2h', sub: 'average manager response', bar: 'w-[72%]', color: 'bg-brand-500' },
              { label: 'Travel spend visibility', value: '100%', sub: 'of trips tracked centrally', bar: 'w-[100%]', color: 'bg-sunrise-500' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{m.label}</p>
                    <p className="mt-1 text-3xl font-extrabold">{m.value}</p>
                    <p className="mt-1 text-xs text-slate-400">{m.sub}</p>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${m.color} ${m.bar}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- POLICY ---------- */}
      <section id="policy" className="bg-white py-20 lg:py-24">
        <div className="container-sunrise">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow text-brand-600">Travel policy engine</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">
              Every trip follows company policy
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Entitlement depends on designation and salary band — exactly like a real corporate travel policy.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-xl border border-slate-200 shadow-soft">
            <div className="overflow-x-auto">
              <table className="data-table min-w-[720px]">
                <thead>
                  <tr className="bg-navy-950 !text-white">
                    <th className="!bg-navy-950 text-white">Band</th>
                    <th className="!bg-navy-950 text-white">Flight class</th>
                    <th className="!bg-navy-950 text-white">Hotel</th>
                    <th className="!bg-navy-950 text-white">Rail</th>
                    <th className="!bg-navy-950 text-white">Max flight fare</th>
                    <th className="!bg-navy-950 text-white">Max hotel / night</th>
                  </tr>
                </thead>
                <tbody>
                  {POLICY_BANDS.map((p) => (
                    <tr key={p.band}>
                      <td className="font-bold text-navy-950">
                        {p.band}
                        <span className="block text-xs font-medium text-slate-500">{p.role}</span>
                      </td>
                      <td className="font-semibold text-slate-700">{p.flight}</td>
                      <td className="font-semibold text-slate-700">{p.hotel}</td>
                      <td className="font-semibold text-slate-700">{p.rail}</td>
                      <td className="font-semibold text-slate-700">{p.flightMax}</td>
                      <td className="font-semibold text-slate-700">{p.hotelMax}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {POLICY_CASES.map((c) => (
              <div key={c.title} className="card p-6">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    c.tone === 'green' ? 'bg-sunrise-50 text-sunrise-600' : c.tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                  }`}
                >
                  <c.icon size={19} />
                </span>
                <h3 className="mt-4 text-sm font-bold text-navy-950">{c.title}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{c.desc}</p>
                <p className="mt-3 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs italic text-slate-600">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section id="contact" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="container-sunrise relative overflow-hidden rounded-2xl bg-navy-950 px-6 py-16 text-center text-white shadow-lift sm:px-12 lg:py-20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-600/20 blur-2xl" />
            <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-accent-500/15 blur-2xl" />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <p className="section-eyebrow text-accent-400">Get started</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to simplify corporate travel?</h2>
            <p className="mt-4 text-base text-white/90">
              Join the companies that keep every business trip on policy, on budget and on track.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/register" className="btn-primary btn-lg">
                Get Started <ArrowRight size={17} />
              </Link>
              <Link to="/login" className="btn-outline-white btn-lg">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FOOTER ---------- */}
      <footer className="bg-navy-950 pb-10 pt-16 text-white">
        <div className="container-sunrise">
          <div className="grid gap-10 lg:grid-cols-6">
            <div className="lg:col-span-1">
              <Logo dark />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
                The corporate travel management platform. Plan, approve and manage every business trip from one place.
              </p>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-bold">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#top" className="text-sm text-slate-400 transition hover:text-white">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row">
            <p>© {new Date().getFullYear()} SUNRISE Corporate Travel. All rights reserved.</p>
            <p className="flex items-center gap-1.5"><MapPin size={11} /> Made for business travel teams everywhere.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
