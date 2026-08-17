import { useEffect, useState } from 'react';
import { ShieldCheck, Pencil, CheckCircle2, Plane, Hotel, TrainFront } from 'lucide-react';
import api, { errorMessage } from '../../api/client.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input, Select, Field } from '../../components/ui/Form.jsx';
import { PageLoader, ErrorState } from '../../components/ui/States.jsx';
import { formatINR } from '../../utils/format.js';

const CLASS_OPTIONS = ['Economy', 'Premium Economy', 'Business'];
const RAIL_OPTIONS = ['Sleeper', '3AC', '2AC', '1AC', 'CC', 'Executive Chair Car', 'Executive'];

export default function AdminPolicies() {
  const [policies, setPolicies] = useState(null);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = () => {
    api
      .get('/policies')
      .then((res) => setPolicies(res.data.results))
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, []);

  const openEdit = (p) => {
    setEditTarget(p);
    setForm({
      flightClasses: p.flightClasses,
      hotelStarMax: p.hotelStarMax,
      railClasses: p.railClasses,
      maxFlightFare: p.maxFlightFare,
      maxHotelPerNight: p.maxHotelPerNight,
      maxRailFare: p.maxRailFare,
      description: p.description,
    });
  };

  const toggleInArray = (key, value) => {
    setForm((f) => {
      const arr = f[key] || [];
      return { ...f, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/policies/${editTarget._id}`, form);
      setNotice(`Policy for ${editTarget.salaryBand === 'A' ? 'Band A' : `Band ${editTarget.salaryBand}`} updated. The policy engine now uses the new limits.`);
      setEditTarget(null);
      load();
      setTimeout(() => setNotice(''), 6000);
    } catch (err) {
      setError(errorMessage(err, 'Unable to update policy.'));
    } finally {
      setSaving(false);
    }
  };

  if (!policies && !error) return <PageLoader message="Loading travel policies..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="section-eyebrow">Administration</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-950">Travel Policies</h1>
        <p className="mt-1 text-sm text-slate-500">
          Salary-band entitlements enforced by the policy engine. Changes apply immediately to all new requests.
        </p>
      </div>

      {notice && (
        <div className="flex items-center gap-2.5 rounded-xl border border-sunrise-200 bg-sunrise-50 px-5 py-3.5 text-sm font-bold text-sunrise-800">
          <CheckCircle2 size={17} /> {notice}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {policies.map((p) => (
          <Card key={p._id} className="overflow-hidden">
            <div className="flex items-center justify-between bg-navy-950 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-accent-400">
                  <ShieldCheck size={17} />
                </span>
                <div>
                  <p className="text-sm font-extrabold">Band {p.salaryBand}</p>
                  <p className="text-xs text-slate-400">{p.bandLabel}</p>
                </div>
              </div>
              <Button size="sm" variant="outlineWhite" onClick={() => openEdit(p)}>
                <Pencil size={13} /> Edit
              </Button>
            </div>
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                <PolicyValue icon={Plane} label="Flight classes" value={p.flightClasses.join(' / ')} />
                <PolicyValue icon={Plane} label="Max flight fare" value={formatINR(p.maxFlightFare)} highlight />
                <PolicyValue icon={Hotel} label="Hotel rating" value={`Up to ${p.hotelStarMax}-star`} />
                <PolicyValue icon={Hotel} label="Max hotel / night" value={formatINR(p.maxHotelPerNight)} highlight />
                <PolicyValue icon={TrainFront} label="Rail classes" value={p.railClasses.join(' / ')} />
                <PolicyValue icon={TrainFront} label="Max rail fare" value={formatINR(p.maxRailFare)} highlight />
              </div>
              {p.description && <p className="mt-4 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">{p.description}</p>}
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Edit modal */}
      <Modal
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title={`Edit Band ${editTarget?.salaryBand || ''} policy`}
        subtitle="Changes are validated by the policy engine and stored in MongoDB"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={save} loading={saving}>Save policy</Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Allowed flight classes" required hint="Select one or more">
            <div className="flex flex-wrap gap-2">
              {CLASS_OPTIONS.map((c) => {
                const active = (form.flightClasses || []).includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleInArray('flightClasses', c)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      active ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Max flight fare (₹)" required>
              <Input type="number" value={form.maxFlightFare || ''} onChange={(e) => setForm((f) => ({ ...f, maxFlightFare: e.target.value }))} />
            </Field>
            <Field label="Max hotel star rating" required>
              <Select value={form.hotelStarMax || 2} onChange={(e) => setForm((f) => ({ ...f, hotelStarMax: e.target.value }))}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}-star</option>)}
              </Select>
            </Field>
            <Field label="Max hotel / night (₹)" required>
              <Input type="number" value={form.maxHotelPerNight || ''} onChange={(e) => setForm((f) => ({ ...f, maxHotelPerNight: e.target.value }))} />
            </Field>
          </div>
          <Field label="Allowed rail classes" required hint="Select one or more">
            <div className="flex flex-wrap gap-2">
              {RAIL_OPTIONS.map((c) => {
                const active = (form.railClasses || []).includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleInArray('railClasses', c)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      active ? 'bg-sunrise-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Max rail fare (₹)" required>
            <Input type="number" value={form.maxRailFare || ''} onChange={(e) => setForm((f) => ({ ...f, maxRailFare: e.target.value }))} />
          </Field>
          <Field label="Policy description">
            <Input value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function PolicyValue({ icon: Icon, label, value, highlight = false }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? 'border-brand-100 bg-brand-50/50' : 'border-slate-100 bg-slate-50/70'}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        <Icon size={11} /> {label}
      </p>
      <p className="mt-1 text-sm font-extrabold text-slate-800">{value}</p>
    </div>
  );
}
