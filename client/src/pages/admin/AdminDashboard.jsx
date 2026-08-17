import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  CheckSquare,
  Ban,
  Wallet,
  MapPin,
  Users,
  ArrowRight,
  Ticket,
  ShieldCheck,
} from 'lucide-react';
import api, { errorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { StatusBadge, PolicyBadge } from '../../components/ui/Badge.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { PageLoader, ErrorState, EmptyState } from '../../components/ui/States.jsx';
import { formatINR, formatDate, timeAgo } from '../../utils/format.js';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/dashboard/admin')
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <PageLoader message="Loading company travel data..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const { stats, todayBookings, pendingApprovals, recentBookings, employees } = data;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="section-eyebrow">Administrator workspace</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-950">Company travel overview</h1>
          <p className="mt-1 text-sm text-slate-500">
            {user.name} · {user.designation} — company-wide travel intelligence
          </p>
        </div>
        <Link to="/admin/analytics" className="btn-primary btn-md self-start sm:self-auto">
          View analytics <ArrowRight size={15} />
        </Link>
      </div>

      {/* Module 5 required stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Today's bookings" value={stats.todayBookings} icon={CalendarCheck} color="blue" />
        <StatCard label="Pending approvals" value={stats.pendingApprovals} icon={CheckSquare} color="amber" />
        <StatCard label="Cancelled bookings" value={stats.cancelledBookings} icon={Ban} color="red" />
        <StatCard label="Travel spend" value={formatINR(stats.travelSpend)} icon={Wallet} color="navy" />
        <StatCard label="Most travelled city" value={stats.mostTravelledCity} icon={MapPin} color="teal" />
        <StatCard label="Active employees" value={stats.activeEmployees} icon={Users} color="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending approvals */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-navy-950 to-navy-900 px-5 py-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-accent-400">
                  <ShieldCheck size={17} />
                </span>
                <div>
                  <h3 className="text-sm font-bold">Pending approvals</h3>
                  <p className="text-xs text-slate-400">{stats.pendingApprovals} request{stats.pendingApprovals !== 1 ? 's' : ''} waiting</p>
                </div>
              </div>
              <Link to="/approvals" className="text-xs font-bold text-accent-400 hover:text-accent-300">Review →</Link>
            </div>
          </div>
          <CardBody>
            {pendingApprovals.length === 0 ? (
              <EmptyState icon={CheckSquare} title="No pending approvals" message="All requests have been decided." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingApprovals.map((r) => (
                  <li key={r._id} className="flex items-center justify-between gap-3 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={r.employee?.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{r.employee?.name} · {r.origin} → {r.destination}</p>
                        <p className="text-xs text-slate-500">{r.travelPurpose} · {formatDate(r.departureDate)} · {timeAgo(r.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PolicyBadge status={r.policyResult?.status} showLabel={false} />
                      <span className="text-sm font-extrabold text-navy-950">{formatINR(r.estimatedCost)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Today's bookings */}
        <Card>
          <CardHeader title="Today's bookings" subtitle={`${todayBookings.length} created today`} icon={CalendarCheck} />
          <CardBody>
            {todayBookings.length === 0 ? (
              <EmptyState title="No bookings today" message="New bookings will appear here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {todayBookings.map((b) => (
                  <li key={b._id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{b.origin} → {b.destination}</p>
                      <p className="text-xs text-slate-500">{b.employee?.name} · {timeAgo(b.createdAt)}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent bookings — data grid */}
      <Card>
        <CardHeader
          title="Recent bookings"
          subtitle="Latest activity across the company"
          action={<Link to="/bookings" className="text-xs font-bold text-brand-600 hover:text-brand-700">View all →</Link>}
        />
        <CardBody className="!px-0 !pb-0">
          {recentBookings.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState icon={Ticket} title="No bookings yet" message="Bookings across the company will show here." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table min-w-[820px]">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Employee</th>
                    <th>Route</th>
                    <th>Travel</th>
                    <th>Fare</th>
                    <th>Policy</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.slice(0, 8).map((b) => (
                    <tr key={b._id}>
                      <td>
                        <Link to={`/bookings/${b._id}`} className="font-bold text-brand-600 hover:underline">{b.bookingRef}</Link>
                        <p className="text-xs text-slate-400">{timeAgo(b.createdAt)}</p>
                      </td>
                      <td className="font-semibold text-slate-700">{b.employee?.name}</td>
                      <td className="text-slate-600">{b.origin} → {b.destination}</td>
                      <td>
                        <span className="badge bg-navy-100 capitalize text-navy-800">{b.travelType}</span>
                      </td>
                      <td className="font-bold text-navy-950">{formatINR(b.fare)}</td>
                      <td><PolicyBadge status={b.policyResult?.status} showLabel={false} /></td>
                      <td><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Employees */}
      <Card>
        <CardHeader title="Employees" subtitle={`${employees.length} total across the company`} icon={Users} action={<Link to="/admin/users" className="text-xs font-bold text-brand-600 hover:text-brand-700">Manage →</Link>} />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {employees.slice(0, 8).map((e) => (
              <div key={e._id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:shadow-sm">
                <Avatar name={e.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{e.name}</p>
                  <p className="truncate text-xs text-slate-500">{e.department}</p>
                </div>
                <span className="ml-auto badge bg-navy-100 text-navy-800">Band {e.salaryBand}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
