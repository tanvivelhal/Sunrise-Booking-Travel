import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShieldCheck, Plane, TrainFront, Check } from 'lucide-react';
import { useAuth, roleHome } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input, Field } from '../components/ui/Form.jsx';
import { Logo } from '../components/ui/Logo.jsx';
import TravelMapArt from '../components/TravelMapArt.jsx';
import { errorMessage } from '../api/client.js';

const DEMO_ACCOUNTS = [
  { role: 'Employee', email: 'employee@sunrise.com', password: 'Employee@123', desc: 'Search travel & submit requests', color: 'border-brand-200 bg-brand-50 text-brand-700' },
  { role: 'Manager', email: 'manager@sunrise.com', password: 'Manager@123', desc: 'Approve & reject team requests', color: 'border-accent-200 bg-accent-50 text-accent-700' },
  { role: 'Admin', email: 'admin@sunrise.com', password: 'Admin@123', desc: 'Monitor spend & manage policies', color: 'border-sunrise-200 bg-sunrise-50 text-sunrise-700' },
];

const HIGHLIGHTS = [
  { icon: Plane, label: 'Search flights, hotels & railways', sub: 'Policy-checked in real time' },
  { icon: ShieldCheck, label: 'Salary-band entitlements enforced', sub: 'Every selection validated automatically' },
  { icon: TrainFront, label: 'Manager approvals, tracked', sub: 'From request to ticketed' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(roleHome(user.role));
    } catch (err) {
      setError(errorMessage(err, 'Unable to sign in.'));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Navy brand panel with abstract travel visual */}
      <div className="relative hidden w-[52%] overflow-hidden bg-navy-950 text-white lg:block">
        <TravelMapArt className="pointer-events-none absolute inset-0 h-full w-full text-white/90" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/40 to-navy-950/10" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo dark />
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-400/30 bg-accent-400/10 px-3 py-1 text-xs font-semibold text-accent-300">
              <Check size={12} /> Corporate travel management
            </span>
            <h2 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight">
              Every business trip, <span className="text-accent-400">on policy.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              One governed workspace for travel search, policy validation, manager approvals and company-wide spend — built for enterprise teams.
            </p>
            <div className="mt-9 space-y-3">
              {HIGHLIGHTS.map((f) => (
                <div key={f.label} className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500/20 text-brand-300 ring-1 ring-inset ring-brand-400/25">
                    <f.icon size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{f.label}</p>
                    <p className="text-xs text-slate-400">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} SUNRISE Corporate Travel</p>
        </div>
      </div>

      {/* White auth panel */}
      <div className="flex w-full items-center justify-center bg-cream-50 px-6 py-12 lg:w-[48%]">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card sm:p-10">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <p className="section-eyebrow">Sign in to your workspace</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-navy-950">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500">Manage your business travel, approvals and spend.</p>

          <form onSubmit={submit} className="mt-7 space-y-5">
            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
            <Field label="Email address" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@sunrise.com"
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Remember me
              </label>
              <a href="#forgot" className="font-semibold text-brand-600 hover:text-brand-700">Forgot password?</a>
            </div>
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Sign In <ArrowRight size={16} />
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="mt-7">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Demo accounts</p>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="group rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-brand-300 hover:shadow-card"
                >
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold ${acc.color}`}>{acc.role}</span>
                  <p className="mt-1.5 break-all text-[10px] font-medium text-slate-400">{acc.email}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{acc.desc}</p>
                  <p className="mt-1 text-[10px] font-bold text-brand-600 opacity-0 transition group-hover:opacity-100">Tap to fill →</p>
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              Click a role to auto-fill its credentials, then press Sign In.
            </p>
          </div>

          <p className="mt-7 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
            New to Sunrise?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
