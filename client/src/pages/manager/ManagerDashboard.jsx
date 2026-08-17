import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Wallet,
  Users,
  CalendarClock,
  ArrowRight,
  MapPin,
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

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/dashboard/manager')
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading) return <PageLoader message="Loading your approval queue..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const { stats, pending, upcomingTrips, team } = data;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="section-eyebrow">Manager workspace</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-950">Team travel oversight</h1>
          <p className="mt-1 text-sm text-slate-500">
            {user.name} · {user.designation} · Managing {stats.teamSize} team members
          </p>
        </div>
        <Link to="/approvals" className="btn-primary btn-md self-start sm:self-auto">
          Open approvals <ArrowRight size={15} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Pending approvals" value={stats.pendingApprovals} sub="awaiting decision" icon={CheckSquare} color="amber" />
        <StatCard label="Approved" value={stats.approvedRequests} sub="this cycle" icon={CheckCircle2} color="green" />
        <StatCard label="Rejected" value={stats.rejectedRequests} sub="this cycle" icon={XCircle} color="red" />
        <StatCard label="Team spending" value={formatINR(stats.teamSpending)} sub="all-time" icon={Wallet} color="navy" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending approvals — primary */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-navy-950 to-navy-900 px-5 py-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-accent-400">
                  <ShieldCheck size={17} />
                </span>
                <div>
                  <h3 className="text-sm font-bold">Pending approvals</h3>
                  <p className="text-xs text-slate-400">{pending.length} request{pending.length !== 1 ? 's' : ''} awaiting your decision</p>
                </div>
              </div>
              <Link to="/approvals" className="text-xs font-bold text-accent-400 hover:text-accent-300">Review all →</Link>
            </div>
          </div>
          <CardBody>
            {pending.length === 0 ? (
              <EmptyState icon={CheckSquare} title="No pending approvals" message="Your team's requests will appear here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {pending.slice(0, 5).map((r) => (
                  <li key={r._id} className="flex items-center justify-between gap-3 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={r.employee?.name} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {r.employee?.name} · {r.origin} → {r.destination}
                        </p>
                        <p className="text-xs text-slate-500">
                          {r.travelPurpose} · {formatDate(r.departureDate)} · {timeAgo(r.createdAt)}
                        </p>
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

        {/* My team */}
        <Card>
          <CardHeader title="My team" subtitle={`${team.length} active employees`} icon={Users} />
          <CardBody>
            <ul className="divide-y divide-slate-100">
              {team.slice(0, 6).map((m) => (
                <li key={m._id} className="flex items-center gap-3 py-2.5">
                  <Avatar name={m.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{m.name}</p>
                    <p className="truncate text-xs text-slate-500">{m.designation} · {m.department}</p>
                  </div>
                  <span className="badge bg-navy-100 text-navy-800">Band {m.salaryBand}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Upcoming trips */}
      <Card>
        <CardHeader title="Upcoming employee trips" subtitle="Approved & ticketed trips ahead" icon={CalendarClock} />
        <CardBody>
          {upcomingTrips.length === 0 ? (
            <EmptyState title="No upcoming trips" message="Approved trips from your team will show here." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingTrips.map((b) => (
                <Link key={b._id} to={`/bookings/${b._id}`} className="rounded-xl border border-slate-200 p-4 transition hover:border-brand-300 hover:shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                      <MapPin size={13} className="text-brand-600" /> {b.origin} → {b.destination}
                    </p>
                    <StatusBadge status={b.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {b.employee?.name} · {formatDate(b.departureDate)}
                  </p>
                  <p className="mt-2 text-sm font-extrabold text-navy-950">{formatINR(b.fare)}</p>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
