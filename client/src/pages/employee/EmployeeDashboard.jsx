import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  Hotel,
  TrainFront,
  ClipboardList,
  Ticket,
  CalendarClock,
  Hourglass,
  Wallet,
  ArrowRight,
  MapPin,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import api, { errorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { Badge, StatusBadge, PolicyBadge } from '../../components/ui/Badge.jsx';
import { PageLoader, ErrorState, EmptyState } from '../../components/ui/States.jsx';
import { formatINR, formatDate } from '../../utils/format.js';

const QUICK_ACTIONS = [
  { label: 'Search Flight', icon: Plane, to: '/travel?tab=flights' },
  { label: 'Search Hotel', icon: Hotel, to: '/travel?tab=hotels' },
  { label: 'Search Railway', icon: TrainFront, to: '/travel?tab=railway' },
  { label: 'My Bookings', icon: Ticket, to: '/bookings' },
  { label: 'My Requests', icon: ClipboardList, to: '/requests' },
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/dashboard/employee')
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <PageLoader message="Loading your travel data..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const { stats, upcomingTrips, recentRequests } = data;

  const policyCounts = (recentRequests || []).reduce(
    (acc, r) => {
      const s = r.policyResult?.status;
      if (s === 'COMPLIANT') acc.compliant += 1;
      else if (s === 'WARNING') acc.warning += 1;
      else if (s === 'VIOLATION') acc.violation += 1;
      return acc;
    },
    { compliant: 0, warning: 0, violation: 0 }
  );
  const totalChecked = policyCounts.compliant + policyCounts.warning + policyCounts.violation;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="section-eyebrow">Employee workspace</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-950">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {user.designation} · {user.department} · <Badge color="navy">Band {user.salaryBand}</Badge>
          </p>
        </div>
        <Link to="/travel" className="btn-primary btn-md self-start sm:self-auto">
          Book Business Travel <ArrowRight size={15} />
        </Link>
      </div>

      {/* Quick actions strip */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick start</span>
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700 hover:shadow-sm"
          >
            <a.icon size={14} className="text-slate-400 group-hover:text-brand-600" />
            {a.label}
          </Link>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Trips" value={stats.upcomingTrips} sub="upcoming & active" icon={CalendarClock} color="blue" />
        <StatCard label="Pending Requests" value={stats.pendingRequests} sub="awaiting approval" icon={Hourglass} color="amber" />
        <StatCard label="Active Bookings" value={stats.ticketedBookings} sub="ticketed" icon={Ticket} color="teal" />
        <StatCard label="Travel Spend" value={formatINR(stats.travelSpend)} sub="all-time" icon={Wallet} color="navy" />
      </div>

      {/* Asymmetric composition: primary + supporting */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Primary: upcoming travel */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-navy-950 to-navy-900 px-5 py-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-accent-400">
                  <CalendarClock size={17} />
                </span>
                <div>
                  <h3 className="text-sm font-bold">Upcoming Travel</h3>
                  <p className="text-xs text-slate-400">Your active corporate trips</p>
                </div>
              </div>
              <Link to="/bookings" className="text-xs font-bold text-accent-400 hover:text-accent-300">
                View all →
              </Link>
            </div>
          </div>
          <CardBody>
            {upcomingTrips.length === 0 ? (
              <EmptyState
                title="No upcoming trips"
                message="Search travel and create a request to plan your next business trip."
                action={<Link to="/travel" className="btn-primary btn-sm">Search travel</Link>}
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcomingTrips.slice(0, 5).map((b) => (
                  <li key={b._id}>
                    <Link to={`/bookings/${b._id}`} className="flex flex-col gap-3 py-4 transition group sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-100 text-navy-700">
                          <MapPin size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            {b.origin} <ArrowRight size={12} className="text-slate-300" /> {b.destination}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatDate(b.departureDate)} · {b.provider || 'Travel'} · {b.passengers || 1} passenger{(b.passengers || 1) > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-1">
                        <StatusBadge status={b.status} />
                        <p className="text-sm font-extrabold text-navy-950">{formatINR(b.fare)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Supporting column */}
        <div className="space-y-6">
          {/* Travel spending overview */}
          <Card>
            <CardHeader title="Travel Spending Overview" subtitle="Your approved activity" icon={Wallet} />
            <CardBody>
              <p className="text-3xl font-extrabold tracking-tight text-navy-950">{formatINR(stats.travelSpend)}</p>
              <p className="mt-1 text-xs text-slate-500">total managed spend</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">Approved trips</p>
                  <p className="mt-0.5 text-lg font-extrabold text-slate-900">{stats.approvedTrips}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500">Ticketed</p>
                  <p className="mt-0.5 text-lg font-extrabold text-slate-900">{stats.ticketedBookings}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent-50 px-3 py-2.5 text-xs font-semibold text-accent-800">
                <TrendingUp size={14} />
                All fares settled through the corporate account.
              </div>
            </CardBody>
          </Card>

          {/* Policy status */}
          <Card>
            <CardHeader title="Policy Status" subtitle="Band {X} entitlement checks" icon={ShieldCheck} />
            <CardBody>
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-xs font-semibold text-slate-500">Your entitlement</p>
                <p className="mt-0.5 text-sm font-extrabold text-navy-950">Band {user.salaryBand}</p>
              </div>
              {totalChecked > 0 ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-sunrise-700"><span className="h-1.5 w-1.5 rounded-full bg-sunrise-500" /> Within policy</span>
                    <span className="font-bold text-slate-800">{policyCounts.compliant}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Review required</span>
                    <span className="font-bold text-slate-800">{policyCounts.warning}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-red-700"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Violations</span>
                    <span className="font-bold text-slate-800">{policyCounts.violation}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-sunrise-500"
                      style={{ width: `${Math.round((policyCounts.compliant / totalChecked) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">Policy checks appear once you submit travel requests.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Recent requests — data grid */}
      <Card>
        <CardHeader
          title="Recent Requests"
          subtitle="Your latest travel requests"
          action={<Link to="/requests" className="text-xs font-bold text-brand-600 hover:text-brand-700">View all →</Link>}
        />
        <CardBody className="!px-0 !pb-0">
          {recentRequests.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState title="No requests yet" message="Your travel requests will appear here." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table min-w-[720px]">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Route</th>
                    <th>Purpose</th>
                    <th>Cost</th>
                    <th>Policy</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.slice(0, 6).map((r) => (
                    <tr key={r._id}>
                      <td>
                        <p className="font-bold text-slate-900">{r.requestId}</p>
                        <p className="text-xs text-slate-400">{formatDate(r.departureDate)}</p>
                      </td>
                      <td className="font-semibold text-slate-700">{r.origin} → {r.destination}</td>
                      <td className="text-slate-600">{r.travelPurpose}</td>
                      <td className="font-bold text-navy-950">{formatINR(r.estimatedCost)}</td>
                      <td><PolicyBadge status={r.policyResult?.status} showLabel={false} /></td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
