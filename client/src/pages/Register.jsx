import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth, roleHome } from '../context/AuthContext.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input, Select, Field } from '../components/ui/Form.jsx';
import { Logo } from '../components/ui/Logo.jsx';
import TravelMapArt from '../components/TravelMapArt.jsx';
import api, { errorMessage } from '../api/client.js';

const DEPARTMENTS = ['Sales', 'Marketing', 'Finance', 'Engineering', 'Operations', 'Human Resources', 'Business Development', 'Corporate Operations', 'Administration'];
const DESIGNATIONS = ['Junior Executive', 'Executive', 'Senior Executive', 'Analyst', 'Senior Analyst', 'Associate', 'Associate Manager', 'Consultant', 'Senior Consultant'];
const BANDS = [
  { value: 'A', label: 'Band A', hint: 'Economy · up to 2★ hotel · ₹8,000 flight' },
  { value: 'B', label: 'Band B', hint: 'Economy · up to 3★ hotel · ₹12,000 flight' },
  { value: 'C', label: 'Band C', hint: 'Economy/Premium · up to 4★ hotel · ₹20,000 flight' },
  { value: 'D', label: 'Band D', hint: 'Business · up to 5★ hotel · ₹35,000 flight' },
];

export default function Register() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    department: '', designation: '', salaryBand: 'A', manager: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/managers').then((res) => setManagers(res.data.results)).catch(() => setManagers([]));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      localStorage.setItem('sunrise_token', res.data.token);
      localStorage.setItem('sunrise_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      navigate(roleHome('employee'));
    } catch (err) {
      setError(errorMessage(err, 'Unable to create account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex w-full items-center justify-center bg-cream-50 px-6 py-12 lg:w-[62%]">
        <div className="w-full max-w-xl">
          <div className="mb-8 flex items-center justify-between">
            <Logo />
            <Link to="/login" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Sign in instead</Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card sm:p-10">
            <p className="section-eyebrow">Join your company</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-navy-950">Create your account</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Your travel entitlement is set by your salary band and enforced by the policy engine.
            </p>

            <form onSubmit={submit} className="mt-7 space-y-5">
              {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" required className="sm:col-span-2">
                  <Input value={form.name} onChange={set('name')} placeholder="e.g. Rahul Sharma" required autoComplete="name" />
                </Field>
                <Field label="Email" required className="sm:col-span-2">
                  <Input type="email" value={form.email} onChange={set('email')} placeholder="you@sunrise.com" required autoComplete="email" />
                </Field>
                <Field label="Password" required hint="At least 8 characters">
                  <Input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required autoComplete="new-password" />
                </Field>
                <Field label="Confirm password" required>
                  <Input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" required autoComplete="new-password" />
                </Field>
                <Field label="Department" required>
                  <Select value={form.department} onChange={set('department')} required>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </Field>
                <Field label="Designation" required>
                  <Select value={form.designation} onChange={set('designation')} required>
                    <option value="">Select designation</option>
                    {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </Field>
                <Field label="Salary band" required hint="Defines your travel entitlement">
                  <Select value={form.salaryBand} onChange={set('salaryBand')} required>
                    {BANDS.map((b) => <option key={b.value} value={b.value}>{b.label} — {b.hint}</option>)}
                  </Select>
                </Field>
                <Field label="Manager" required hint="Your approving manager">
                  <Select value={form.manager} onChange={set('manager')} required>
                    <option value="">Select manager</option>
                    {managers.map((m) => <option key={m._id} value={m._id}>{m.name} · {m.department}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-600" />
                <p>
                  Public registration creates an <strong>Employee</strong> account only. Administrator accounts are
                  provisioned securely by your company and can never be self-registered.
                </p>
              </div>
              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Create account <ArrowRight size={16} />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Navy info panel */}
      <div className="relative hidden w-[38%] overflow-hidden bg-navy-950 text-white lg:block">
        <TravelMapArt className="pointer-events-none absolute inset-0 h-full w-full text-white/90" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/50 to-navy-950/10" />
        <div className="relative flex h-full flex-col justify-center p-12">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-400/30 bg-accent-400/10 px-3 py-1 text-xs font-semibold text-accent-300">
            <ShieldCheck size={12} /> Entitlement-driven policy
          </span>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight">
            Your entitlement, <span className="text-accent-400">automatic</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            The band you’re assigned decides your flight class, hotel category and fare limits — enforced by the policy engine on every booking.
          </p>
          <div className="mt-8 space-y-2.5">
            {BANDS.map((b) => (
              <div key={b.value} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <span className="text-sm font-bold">{b.label}</span>
                <span className="text-xs text-slate-400">{b.hint}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
