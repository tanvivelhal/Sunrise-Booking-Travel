import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ticket,
  Plane,
  Hotel,
  TrainFront,
  Layers,
  MapPin,
  CalendarDays,
  User as UserIcon,
  Building2,
  Briefcase,
  ShieldCheck,
  CircleDot,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
} from 'lucide-react';
import api, { errorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.jsx';
import { StatusBadge, PolicyBadge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Input, Field } from '../../components/ui/Form.jsx';
import { PageLoader, ErrorState } from '../../components/ui/States.jsx';
import { PolicyResultPanel } from '../../components/PolicyResult.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { formatINR, formatDate, formatDateTime, timeAgo } from '../../utils/format.js';

const TIMELINE_STEPS = ['Request Created', 'Policy Checked', 'Pending Approval', 'Approved', 'Ticketed'];
const TYPE_ICON = { flight: Plane, hotel: Hotel, railway: TrainFront, multi: Layers };
const TYPE_LABEL = { flight: 'Flight', hotel: 'Hotel', railway: 'Railway', multi: 'Flight + Hotel + Rail' };

const STEP_ICONS = { 'Request Created': CircleDot, 'Policy Checked': ShieldCheck, 'Pending Approval': Clock, Approved: CheckCircle2, Ticketed: Ticket, Cancelled: Ban, Rejected: XCircle };

export default function BookingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [acting, setActing] = useState(false);
  const [notice, setNotice] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    // Accept either a booking id or a travel-request id.
    api
      .get(`/bookings/${id}`)
      .then((res) => setData(res.data))
      .catch(() =>
        api
          .get(`/travel-requests/${id}`)
          .then((res) => setData({ booking: res.data.booking, request: res.data.request }))
          .catch((err) => setError(errorMessage(err)))
          .finally(() => setLoading(false))
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const booking = data?.booking;

  const ticket = async () => {
    setActing(true);
    try {
      const res = await api.post(`/bookings/${booking._id}/ticket`);
      setNotice(res.data.message);
      setData({ ...data, booking: res.data.booking });
    } catch (err) {
      setError(errorMessage(err, 'Unable to ticket booking.'));
    } finally {
      setActing(false);
    }
  };

  const cancel = async () => {
    if (!cancelReason.trim()) return;
    setActing(true);
    try {
      const res = await api.patch(`/bookings/${booking._id}/cancel`, { reason: cancelReason });
      setCancelOpen(false);
      setNotice(res.data.message);
      setData({ ...data, booking: res.data.booking });
    } catch (err) {
      setError(errorMessage(err, 'Unable to cancel booking.'));
    } finally {
      setActing(false);
    }
  };

  if (loading) return <PageLoader message="Loading booking details..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!booking) return <ErrorState message="Booking not found." />;

  const TypeIcon = TYPE_ICON[booking.travelType] || Layers;
  const canCancel = (user.role === 'employee' || user.role === 'admin') && booking.status === 'Ticketed';
  const canTicket = user.role !== 'employee' && booking.status === 'Approved';
  const timeline = booking.timeline || [];
  const timelineSet = new Set(timeline.map((t) => t.status));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link to="/bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy-950">
        <ArrowLeft size={15} /> Back to bookings
      </Link>

      {notice && (
        <div className="flex items-center gap-2.5 rounded-xl border border-sunrise-200 bg-sunrise-50 px-5 py-3.5 text-sm font-bold text-sunrise-800">
          <CheckCircle2 size={17} /> {notice}
        </div>
      )}

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-navy-950 to-navy-900 px-6 py-5 text-white">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-400">
                <TypeIcon size={24} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-extrabold tracking-tight">{booking.origin} → {booking.destination}</h1>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  {booking.bookingRef} · {TYPE_LABEL[booking.travelType]} · {formatDate(booking.departureDate)}
                  {booking.returnDate ? ` – ${formatDate(booking.returnDate)}` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {canTicket && (
                <Button onClick={ticket} loading={acting} variant="accent">
                  <Ticket size={15} /> Mark as Ticketed
                </Button>
              )}
              {canCancel && (
                <Button variant="danger" onClick={() => setCancelOpen(true)}>
                  <Ban size={15} /> Cancel booking
                </Button>
              )}
              {!canCancel && !canTicket && booking.status === 'Cancelled' && booking.cancelledReason && (
                <span className="text-xs text-slate-300">Cancelled: {booking.cancelledReason}</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: details + policy */}
        <div className="space-y-6 lg:col-span-2">
          {/* Booking info */}
          <Card>
            <CardHeader title="Booking details" subtitle="What was selected for this trip" />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoTile icon={MapPin} label="Route" value={`${booking.origin} → ${booking.destination}`} />
                <InfoTile icon={CalendarDays} label="Travel dates" value={`${formatDate(booking.departureDate)}${booking.returnDate ? ` – ${formatDate(booking.returnDate)}` : ''}`} />
                <InfoTile icon={Building2} label="Provider" value={booking.provider ? `${booking.provider}${booking.providerRef ? ` · ${booking.providerRef}` : ''}` : '—'} />
                <InfoTile icon={Ticket} label="Passengers" value={String(booking.passengers || 1)} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy-950 px-5 py-4 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total fare</p>
                  <p className="text-2xl font-extrabold">{formatINR(booking.fare)}</p>
                </div>
                <PolicyBadge status={booking.policyResult?.status} />
              </div>
            </CardBody>
          </Card>

          {/* Policy result */}
          <Card>
            <CardHeader title="Policy result" subtitle="Validated against the employee's salary band" />
            <CardBody>
              <PolicyResultPanel policyResult={booking.policyResult} />
              {booking.policyResult?.checks?.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
                  {(booking.policyResult.checks || []).map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ShieldCheck size={13} className="mt-0.5 shrink-0 text-brand-600" />
                      <span>{c.item}: {c.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Approval history */}
          <Card>
            <CardHeader title="Approval history" subtitle="Who decided and when" />
            <CardBody>
              {booking.request?.status === 'Pending' ? (
                <p className="text-sm text-slate-500">Waiting for manager approval.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  {(booking.request?.status === 'Approved' || booking.status === 'Ticketed' || booking.status === 'Cancelled') && (
                    <div className="flex items-start gap-3 rounded-lg bg-brand-50 p-3.5">
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand-600" />
                      <div>
                        <p className="font-bold text-slate-800">
                          Approved{booking.manager ? ` by ${booking.manager.name}` : ''}
                        </p>
                        <p className="text-xs text-slate-500">Decision recorded · {formatDateTime(booking.timeline?.find((t) => t.status === 'Approved')?.at)}</p>
                      </div>
                    </div>
                  )}
                  {booking.request?.status === 'Rejected' && booking.managerComment && (
                    <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3.5">
                      <XCircle size={17} className="mt-0.5 shrink-0 text-red-600" />
                      <div>
                        <p className="font-bold text-slate-800">Rejected with comment</p>
                        <p className="mt-0.5 text-xs text-red-700">“{booking.managerComment}”</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column: employee + timeline */}
        <div className="space-y-6">
          {/* Employee */}
          <Card>
            <CardHeader title="Employee" />
            <CardBody>
              {booking.employee && (
                <div className="flex items-center gap-3">
                  <Avatar name={booking.employee.name} size="lg" />
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">{booking.employee.name}</p>
                    <p className="text-xs text-slate-500">{booking.employee.designation} · {booking.employee.department}</p>
                    <p className="mt-0.5 text-xs font-bold text-navy-800">Band {booking.employee.salaryBand} · {booking.employee.employeeId}</p>
                  </div>
                </div>
              )}
              {booking.request && (
                <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3.5 text-xs">
                  <p className="flex items-center gap-2"><Briefcase size={13} className="text-slate-400" /> <strong>{booking.request.travelPurpose}</strong> {booking.request.purposeNote ? `· ${booking.request.purposeNote}` : ''}</p>
                  <p className="flex items-center gap-2"><UserIcon size={13} className="text-slate-400" /> Request {booking.request.requestId} · {booking.request.status}</p>
                  <p className="flex items-center gap-2"><Clock size={13} className="text-slate-400" /> Booked {timeAgo(booking.bookedAt)}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader title="Booking timeline" subtitle="Life of this booking" />
            <CardBody>
              <ol className="relative space-y-5 border-l-2 border-slate-200 pl-6">
                {TIMELINE_STEPS.map((step) => {
                  const entry = timeline.find((t) => t.status === step);
                  const done = Boolean(entry);
                  const Icon = STEP_ICONS[step] || CircleDot;
                  const reached = timelineSet.has(step);
                  return (
                    <li key={step} className="relative">
                      <span
                        className={`absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          reached ? 'border-sunrise-500 bg-sunrise-500 text-white' : 'border-slate-200 bg-white text-slate-300'
                        }`}
                      >
                        <Icon size={10} />
                      </span>
                      <p className={`text-sm font-bold ${reached ? 'text-slate-900' : 'text-slate-400'}`}>{step}</p>
                      {done && (
                        <p className="text-xs text-slate-500">
                          {formatDateTime(entry.at)}
                          {entry.note ? ` · ${entry.note}` : ''}
                        </p>
                      )}
                    </li>
                  );
                })}
                {booking.status === 'Cancelled' && timeline.find((t) => t.status === 'Cancelled') && (
                  <li className="relative">
                    <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-red-500 bg-red-500 text-white">
                      <Ban size={10} />
                    </span>
                    <p className="text-sm font-bold text-red-600">Cancelled</p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(timeline.find((t) => t.status === 'Cancelled')?.at)} · {booking.cancelledReason}
                    </p>
                  </li>
                )}
                {booking.status === 'Rejected' && (
                  <li className="relative">
                    <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-red-500 bg-red-500 text-white">
                      <XCircle size={10} />
                    </span>
                    <p className="text-sm font-bold text-red-600">Rejected</p>
                    <p className="text-xs text-slate-500">{booking.managerComment}</p>
                  </li>
                )}
              </ol>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Cancel modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this booking"
        subtitle="Cancellation is final and notifies your manager"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep booking</Button>
            <Button variant="danger" onClick={cancel} loading={acting} disabled={!cancelReason.trim()}>
              Confirm cancellation
            </Button>
          </>
        }
      >
        <Field label="Cancellation reason" required hint="Required — this is recorded in the audit log">
          <Input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g. Client meeting rescheduled"
          />
        </Field>
      </Modal>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-3.5">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        <Icon size={12} /> {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}
