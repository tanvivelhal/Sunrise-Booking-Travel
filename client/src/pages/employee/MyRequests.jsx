import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, CheckCircle2, ArrowRight } from 'lucide-react';
import api, { errorMessage } from '../../api/client.js';
import { Card } from '../../components/ui/Card.jsx';
import { StatusBadge, PolicyBadge } from '../../components/ui/Badge.jsx';
import { PageLoader, ErrorState, EmptyState } from '../../components/ui/States.jsx';
import { formatINR, formatDate, timeAgo } from '../../utils/format.js';

export default function MyRequests() {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [params, setParams] = useSearchParams();
  const createdId = params.get('created');

  const load = () => {
    api
      .get('/travel-requests/my')
      .then((res) => setRequests(res.data.results))
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, []);

  if (!requests && !error) return <PageLoader message="Loading your travel requests..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="section-eyebrow">Employee workspace</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-950">My Travel Requests</h1>
          <p className="mt-1 text-sm text-slate-500">Every request goes to your manager for approval before booking.</p>
        </div>
        <Link to="/travel" className="btn-primary btn-md self-start sm:self-auto">New request <ArrowRight size={15} /></Link>
      </div>

      {createdId && (
        <div className="flex items-start gap-3 rounded-xl border border-sunrise-200 bg-sunrise-50 px-5 py-4">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-sunrise-600" />
          <div>
            <p className="text-sm font-bold text-sunrise-800">Travel request submitted successfully.</p>
            <p className="text-xs text-sunrise-700">
              Request {createdId} is now <strong>Pending</strong> — your manager has been notified and will review it shortly.
            </p>
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No travel requests yet"
          message="Search flights, hotels or railways and submit your first travel request."
          action={<Link to="/travel" className="btn-primary btn-sm">Search travel</Link>}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[820px]">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Route</th>
                  <th>Purpose</th>
                  <th>Departure</th>
                  <th>Cost</th>
                  <th>Policy</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <p className="font-bold text-slate-900">{r.requestId}</p>
                      <p className="text-xs text-slate-400">submitted {timeAgo(r.createdAt)}</p>
                    </td>
                    <td className="font-semibold text-slate-700">{r.origin} → {r.destination}</td>
                    <td>
                      <p className="text-slate-600">{r.travelPurpose}</p>
                      {(r.selections || []).length > 0 && (
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {(r.selections || []).map((s) => `${s.type}: ${s.provider} ${s.class}`).join(' · ')}
                        </p>
                      )}
                    </td>
                    <td className="text-slate-600">{formatDate(r.departureDate)}</td>
                    <td className="font-bold text-navy-950">{formatINR(r.estimatedCost)}</td>
                    <td><PolicyBadge status={r.policyResult?.status} showLabel={false} /></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="text-right">
                      <Link to={`/bookings/${r._id}`} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {requests.some((r) => r.managerComment) && (
            <div className="border-t border-slate-100 px-5 py-4">
              {requests
                .filter((r) => r.managerComment)
                .map((r) => (
                  <p key={r._id} className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    <strong>{r.requestId} · Manager:</strong> {r.managerComment}
                  </p>
                ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
