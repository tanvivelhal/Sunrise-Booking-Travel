import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Plane, Hotel, TrainFront, Layers } from 'lucide-react';
import api, { errorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { StatusBadge, PolicyBadge } from '../../components/ui/Badge.jsx';
import { PageLoader, ErrorState, EmptyState } from '../../components/ui/States.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { formatINR, formatDate, timeAgo } from '../../utils/format.js';

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Ticketed', 'Cancelled'];
const TYPE_ICON = { flight: Plane, hotel: Hotel, railway: TrainFront, multi: Layers };

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  const load = () => {
    const url = user.role === 'employee' ? '/bookings/my' : '/bookings';
    api
      .get(url)
      .then((res) => setBookings(res.data.results))
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, []);

  if (!bookings && !error) return <PageLoader message="Loading bookings..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const title = user.role === 'employee' ? 'My Bookings' : user.role === 'manager' ? 'Team Bookings' : 'All Bookings';
  const filtered = filter === 'All' ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="section-eyebrow">Travel records</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-950">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''} · spend {formatINR(bookings.reduce((s, b) => s + (b.fare || 0), 0))}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              filter === s ? 'bg-navy-950 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={`No ${filter === 'All' ? '' : filter.toLowerCase() + ' '}bookings`}
          message={user.role === 'employee' ? 'Bookings appear here once your travel requests are approved.' : 'No bookings match this status.'}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[860px]">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Route</th>
                  <th>Type</th>
                  {user.role !== 'employee' && <th>Employee</th>}
                  <th>Fare</th>
                  <th>Policy</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const TypeIcon = TYPE_ICON[b.travelType] || Layers;
                  return (
                    <tr key={b._id}>
                      <td>
                        <Link to={`/bookings/${b._id}`} className="font-bold text-brand-600 hover:underline">{b.bookingRef}</Link>
                        <p className="text-xs text-slate-400">{timeAgo(b.createdAt)}</p>
                      </td>
                      <td>
                        <p className="font-semibold text-slate-800">{b.origin} → {b.destination}</p>
                        <p className="text-xs text-slate-400">{formatDate(b.departureDate)}{b.returnDate ? ` – ${formatDate(b.returnDate)}` : ''}</p>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold capitalize text-slate-600">
                          <TypeIcon size={13} className="text-navy-500" /> {b.travelType}
                        </span>
                      </td>
                      {user.role !== 'employee' && (
                        <td>
                          {b.employee ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={b.employee.name} size="xs" />
                              <div className="leading-tight">
                                <p className="text-xs font-bold text-slate-800">{b.employee.name}</p>
                                <p className="text-[11px] text-slate-400">{b.employee.department}</p>
                              </div>
                            </div>
                          ) : '—'}
                        </td>
                      )}
                      <td className="text-slate-600">{b.provider || '—'}</td>
                      <td className="font-bold text-navy-950">{formatINR(b.fare)}</td>
                      <td><PolicyBadge status={b.policyResult?.status} showLabel={false} /></td>
                      <td><StatusBadge status={b.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {user.role !== 'employee' && (
            <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              Showing {filtered.length} of {bookings.length} bookings — click a booking reference for full details.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
