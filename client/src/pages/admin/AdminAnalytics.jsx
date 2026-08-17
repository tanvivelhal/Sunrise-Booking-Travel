import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, Wallet } from 'lucide-react';
import api, { errorMessage } from '../../api/client.js';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.jsx';
import { PageLoader, ErrorState } from '../../components/ui/States.jsx';
import { formatINR } from '../../utils/format.js';

const PIE_COLORS = ['#4F46E5', '#14B8A6', '#10B981', '#818CF8', '#94A3B8', '#EF4444', '#0EA5E9'];

const STATUS_COLORS = {
  Ticketed: '#10B981',
  Approved: '#4F46E5',
  Pending: '#0EA5E9',
  Cancelled: '#94A3B8',
  Rejected: '#EF4444',
};

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  boxShadow: '0 8px 30px -6px rgb(15 23 42 / 0.18)',
};

function INRValue({ value }) {
  return formatINR(value);
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/dashboard/admin/analytics')
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <PageLoader message="Crunching company travel data..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const spendData = data.spendByMonth.map((m) => ({ ...m, spendLabel: formatINR(m.spend) }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="section-eyebrow">Analytics</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-950">Travel Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Company-wide travel intelligence · last 6 months</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-navy-950 px-5 py-3 text-white shadow-sm">
          <Wallet size={17} className="text-accent-400" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total managed spend</p>
            <p className="text-lg font-extrabold leading-tight">{formatINR(data.totalSpend)}</p>
          </div>
        </div>
      </div>

      {/* Policy violation summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Compliant', value: data.policyViolations.COMPLIANT || 0, color: 'text-sunrise-600', bg: 'bg-sunrise-50' },
          { label: 'Review required', value: data.policyViolations.WARNING || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Violations', value: data.policyViolations.VIOLATION || 0, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((s) => (
          <Card key={s.label} className={`p-4 text-center ${s.bg} border-transparent`}>
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{s.label} bookings</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spend by month */}
        <Card className="lg:col-span-2">
          <CardHeader title="Travel spend by month" subtitle="Fare value of approved & ticketed bookings" icon={BarChart3} />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [formatINR(value), 'Spend']} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="spend" fill="#4F46E5" radius={[8, 8, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Bookings by type */}
        <Card>
          <CardHeader title="Bookings by travel type" subtitle="Flight vs hotel vs railway vs multi" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.bookingsByType} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3}>
                    {data.bookingsByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [value, name]} />
                  <Legend formatter={(v) => <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }} className="capitalize">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader title="Booking status distribution" subtitle="Where every booking stands" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.statusDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={3}>
                    {data.statusDistribution.map((s) => <Cell key={s.status} fill={STATUS_COLORS[s.status] || '#94A3B8'} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [value, name]} />
                  <Legend formatter={(v) => <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Most travelled cities */}
        <Card>
          <CardHeader title="Most travelled cities" subtitle="Destinations by booking count" />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.mostTravelledCities} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="city" width={76} tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [value, name]} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#374672" radius={[0, 8, 8, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Department spending */}
        <Card>
          <CardHeader title="Department spending" subtitle="Total fare spend by department" />
          <CardBody>
            <div className="space-y-4">
              {data.departmentSpending.slice(0, 8).map((d, i) => {
                const max = data.departmentSpending[0]?.spend || 1;
                return (
                  <div key={d.department}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-700">{d.department}</span>
                      <span className="font-extrabold text-navy-950">{formatINR(d.spend)}</span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${i === 0 ? 'bg-brand-500' : 'bg-brand-300'}`}
                        style={{ width: `${Math.max(6, (d.spend / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
