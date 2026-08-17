import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Plane,
  Hotel,
  TrainFront,
  ArrowRight,
  Briefcase,
  CalendarDays,
  Wallet,
  ShieldCheck,
  CircleDot,
  Clock,
  Ticket,
} from 'lucide-react';
import api, { errorMessage } from '../../api/client.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { StatusBadge, PolicyBadge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input, Field } from '../../components/ui/Form.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { PageLoader, ErrorState, EmptyState } from '../../components/ui/States.jsx';
import { PolicyResultPanel } from '../../components/PolicyResult.jsx';
import { formatINR, formatDate, timeAgo } from '../../utils/format.js';

const FILTERS = ['Pending', 'Approved', 'Rejected'];
const SEL_ICON = { flight: Plane, hotel: Hotel, railway: TrainFront };

const STAGE_ICONS = { created: CircleDot, policy: ShieldCheck, review: Clock, booked: Ticket };

/** Visual process strip: Request → Policy Check → Manager Review → Booked */
function ProcessStrip({ status }) {
  const rejected = status === 'Rejected';
  const approved = status === 'Approved';
  const stages = [
    { key: 'created', label: 'Request', done: true },
    { key: 'policy', label: 'Policy Check', done: true },
    { key: 'review', label: 'Manager Review', done: approved, current: !rejected && !approved },
    { key: 'booked', label: 'Booked', done: approved },
  ];
  return (
    <div className="flex items-center gap-0.5">
      {stages.map((s, i) => {
        const Icon = STAGE_ICONS[s.key];
        const tone = rejected && s.key === 'review'
          ? 'border-red-500 bg-red-500 text-white'
          : s.done
            ? 'border-sunrise-500 bg-sunrise-500 text-white'
            : s.current
              ? 'border-brand-500 bg-brand-500 text-white animate-pulse'
              : 'border-slate-200 bg-white text-slate-300';
        return (
          <div key={s.key} className="flex items-center">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${tone}`}>
              <Icon size={10} />
            </span>
            {i < stages.length - 1 && <span className={`mx-1 h-0.5 w-4 rounded-full ${rejected && i === 1 ? 'bg-red-300' : s.done ? 'bg-sunrise-400' : 'bg-slate-200'} sm:w-6`} />}
          </div>
        );
      })}
      <span className="ml-2 hidden text-[10px] font-bold uppercase tracking-wide text-slate-400 sm:inline">
        {rejected ? 'Rejected' : approved ? 'Approved' : 'In review'}
      </span>
    </div>
  );
}

export default function ApprovalsPage() {
  const [filter, setFilter] = useState('Pending');
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [detailTarget, setDetailTarget] = useState(null);
  const [detail, setDetail] = useState(null);
  const [notice, setNotice] = useState('');

  const load = () => {
    setError('');
    const url = filter === 'Pending' ? '/travel-requests/pending' : '/travel-requests';
    api
      .get(url)
      .then((res) => setRequests(res.data.results))
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, [filter]);

  const approve = async (r) => {
    setActing(r._id);
    try {
      const res = await api.patch(`/travel-requests/${r._id}/approve`);
      setNotice(`Approved ${r.employee?.name}'s request. The booking is being ticketed.`);
      load();
      setTimeout(() => setNotice(''), 6000);
    } catch (err) {
      setError(errorMessage(err, 'Unable to approve.'));
    } finally {
      setActing(null);
    }
  };

  const reject = async () => {
    if (!rejectComment.trim()) return;
    setActing(rejectTarget._id);
    try {
      await api.patch(`/travel-requests/${rejectTarget._id}/reject`, { comment: rejectComment });
      setRejectTarget(null);
      setRejectComment('');
      setNotice(`Rejected ${rejectTarget.employee?.name}'s request.`);
      load();
      setTimeout(() => setNotice(''), 6000);
    } catch (err) {
      setError(errorMessage(err, 'Unable to reject.'));
    } finally {
      setActing(null);
    }
  };

  const openDetail = async (r) => {
    setDetailTarget(r);
    setDetail(null);
    try {
      const res = await api.get(`/travel-requests/${r._id}`);
      setDetail(res.data);
    } catch {
      setDetail({});
    }
  };

  if (!requests && !error) return <PageLoader message="Loading approval queue..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const listed = filter === 'Pending' ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="section-eyebrow">Manager workspace</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-950">Approvals</h1>
        <p className="mt-1 text-sm text-slate-500">Review each request with full context before deciding.</p>
      </div>

      {notice && (
        <div className="flex items-center gap-2.5 rounded-xl border border-sunrise-200 bg-sunrise-50 px-5 py-3.5 text-sm font-bold text-sunrise-800">
          <CheckCircle2 size={17} /> {notice}
        </div>
      )}

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              filter === f ? 'bg-navy-950 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {listed.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={`No ${filter.toLowerCase()} requests`}
          message={filter === 'Pending' ? 'Your team has no requests waiting for approval.' : 'Nothing here yet.'}
        />
      ) : (
        <div className="space-y-3">
          {listed.map((r) => (
            <Card key={r._id} className="overflow-hidden">
              <div className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <Avatar name={r.employee?.name} size="md" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-extrabold text-slate-900">{r.employee?.name}</p>
                        <StatusBadge status={r.status} />
                        <PolicyBadge status={r.policyResult?.status} showLabel={false} />
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {r.employee?.designation} · {r.employee?.department} · Band {r.employee?.salaryBand}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {r.origin} → {r.destination} · {r.travelPurpose} · {formatDate(r.departureDate)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                        {(r.selections || []).map((s) => {
                          const Icon = SEL_ICON[s.type] || Plane;
                          return (
                            <span key={s.type} className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                              <Icon size={11} /> {s.provider} {s.class}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 lg:flex-col lg:items-end">
                    <p className="text-lg font-extrabold text-navy-950">{formatINR(r.estimatedCost)}</p>
                    {filter === 'Pending' ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openDetail(r)}>Details</Button>
                        <Button size="sm" variant="danger" onClick={() => { setRejectTarget(r); setRejectComment(''); }}>Reject</Button>
                        <Button size="sm" variant="green" onClick={() => approve(r)} loading={acting === r._id}>
                          Approve
                        </Button>
                      </div>
                    ) : (
                      <Link to={`/bookings/${r._id}`} className="text-xs font-bold text-brand-600 hover:text-brand-700">View →</Link>
                    )}
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <ProcessStrip status={r.status} />
                </div>
              </div>
              {r.managerComment && (
                <div className="border-t border-red-100 bg-red-50/60 px-5 py-2.5">
                  <p className="text-xs text-red-700">
                    <strong>Manager comment:</strong> {r.managerComment}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Reject modal */}
      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject travel request"
        subtitle={rejectTarget ? `${rejectTarget.employee?.name} · ${rejectTarget.origin} → ${rejectTarget.destination}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={reject} loading={acting === rejectTarget?._id} disabled={!rejectComment.trim()}>
              Reject request
            </Button>
          </>
        }
      >
        <Field label="Manager comment" required hint="Required — shared with the employee and stored in the audit log">
          <Input
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="e.g. Business class is not permitted for Band A. Please rebook in Economy."
          />
        </Field>
      </Modal>

      {/* Detail modal */}
      <Modal open={Boolean(detailTarget)} onClose={() => setDetailTarget(null)} title="Request details" size="lg" footer={<Button variant="outline" onClick={() => setDetailTarget(null)}>Close</Button>}>
        {detail ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3.5">
              <Avatar name={detail.request?.employee?.name} size="lg" />
              <div>
                <p className="text-base font-extrabold text-slate-900">{detail.request?.employee?.name}</p>
                <p className="text-xs text-slate-500">
                  {detail.request?.employee?.designation} · {detail.request?.employee?.department} · Band {detail.request?.employee?.salaryBand} · {detail.request?.employee?.employeeId}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <DetailTile icon={Briefcase} label="Purpose" value={detail.request?.travelPurpose} />
              <DetailTile icon={CalendarDays} label="Dates" value={`${formatDate(detail.request?.departureDate)}${detail.request?.returnDate ? ` – ${formatDate(detail.request?.returnDate)}` : ''}`} />
              <DetailTile icon={ShieldCheck} label="Policy status" value={detail.request?.policyResult?.summary} />
              <DetailTile icon={Wallet} label="Estimated cost" value={formatINR(detail.request?.estimatedCost)} />
            </div>
            {detail.request?.policyResult && <PolicyResultPanel policyResult={detail.request.policyResult} />}
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Selected travel</p>
              <div className="mt-2 space-y-2">
                {(detail.request?.selections || []).map((s) => (
                  <div key={s.type} className="flex items-center justify-between text-sm">
                    <span className="font-semibold capitalize text-slate-700">{s.type}</span>
                    <span className="text-slate-500">{s.provider} {s.class} · {formatINR(s.fare)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <PageLoader message="Loading request details..." />
        )}
      </Modal>
    </div>
  );
}

function DetailTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        <Icon size={12} /> {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value || '—'}</p>
    </div>
  );
}
