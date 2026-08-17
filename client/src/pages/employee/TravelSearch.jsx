import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plane,
  Hotel,
  TrainFront,
  Search,
  ArrowRight,
  ArrowLeftRight,
  Check,
  Clock,
  Users,
  Star,
  Coffee,
  ShieldCheck,
  CircleDot,
  CheckCircle2,
} from 'lucide-react';
import api, { errorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Tabs } from '../../components/ui/Tabs.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Select, Field } from '../../components/ui/Form.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState, ErrorState, InlineLoader } from '../../components/ui/States.jsx';
import { PolicyResultPanel } from '../../components/PolicyResult.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { formatINR, durationLabel, formatDate } from '../../utils/format.js';

const TABS = [
  { value: 'flights', label: 'Flights', icon: Plane },
  { value: 'hotels', label: 'Hotels', icon: Hotel },
  { value: 'railway', label: 'Railway', icon: TrainFront },
];

const PURPOSE_OPTIONS = [
  'Client Meeting', 'Business Conference', 'Training', 'Sales Visit',
  'Project Work', 'Office Visit', 'Business Development', 'Other',
];

const INITIAL_FLIGHT = { from: 'Mumbai', to: 'Delhi', departureDate: '', tripType: 'one-way', passengers: 1, travelClass: 'Any' };
const INITIAL_HOTEL = { city: 'Delhi', checkIn: '', checkOut: '', guests: 1, rooms: 1 };
const INITIAL_RAIL = { from: 'Mumbai', to: 'Delhi', date: '', passengers: 1, trainClass: 'Any' };

const STEPS = [
  { label: 'Request', icon: CircleDot },
  { label: 'Policy Check', icon: ShieldCheck },
  { label: 'Manager Review', icon: Users },
  { label: 'Approved', icon: CheckCircle2 },
  { label: 'Booked', icon: Plane },
];

export default function TravelSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialTab = ['flights', 'hotels', 'railway'].includes(params.get('tab')) ? params.get('tab') : 'flights';

  const [tab, setTab] = useState(initialTab);
  const [flightForm, setFlightForm] = useState(INITIAL_FLIGHT);
  const [hotelForm, setHotelForm] = useState(INITIAL_HOTEL);
  const [railForm, setRailForm] = useState(INITIAL_RAIL);

  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const [selected, setSelected] = useState({ flight: null, hotel: null, railway: null });
  const [reviewOpen, setReviewOpen] = useState(false);
  const [policyResult, setPolicyResult] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [purpose, setPurpose] = useState('Client Meeting');
  const [purposeNote, setPurposeNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Band policy for the fare-limit preview chips (authoritative check still happens on submit).
  const [bandPolicy, setBandPolicy] = useState(null);
  useEffect(() => {
    api
      .get('/policies')
      .then((res) => {
        const match = (res.data.results || []).find((p) => p.salaryBand === user.salaryBand);
        setBandPolicy(match || null);
      })
      .catch(() => setBandPolicy(null));
  }, [user.salaryBand]);

  const setF = (key) => (e) => setFlightForm((f) => ({ ...f, [key]: e.target.value }));
  const setH = (key) => (e) => setHotelForm((f) => ({ ...f, [key]: e.target.value }));
  const setR = (key) => (e) => setRailForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    // Default dates: today +3 for flight/rail, +3/+5 for hotel
    const d = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
    if (!flightForm.departureDate) setFlightForm((f) => ({ ...f, departureDate: d(3) }));
    if (!hotelForm.checkIn) setHotelForm((f) => ({ ...f, checkIn: d(3) }));
    if (!hotelForm.checkOut) setHotelForm((f) => ({ ...f, checkOut: d(5) }));
    if (!railForm.date) setRailForm((f) => ({ ...f, date: d(3) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = async () => {
    setSearching(true);
    setError('');
    setResults(null);
    try {
      let res;
      if (tab === 'flights') {
        res = await api.get('/flights', { params: flightForm });
      } else if (tab === 'hotels') {
        res = await api.get('/hotels', { params: hotelForm });
      } else {
        res = await api.get('/trains', { params: railForm });
      }
      setResults(res.data.results);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSearching(false);
    }
  };

  const selectOption = (item) => {
    if (tab === 'flights') {
      setSelected((s) => ({
        ...s,
        flight: {
          type: 'flight',
          provider: item.airline,
          providerRef: item.flightNumber,
          class: item.travelClass,
          origin: `${item.from.city} (${item.from.code})`,
          destination: `${item.to.city} (${item.to.code})`,
          fare: item.fare,
          unitFare: item.fare,
          passengers: Number(flightForm.passengers) || 1,
          departureDate: item.departureDate || flightForm.departureDate,
          details: { depTime: item.depTime, arrTime: item.arrTime, stops: item.stops, baggage: item.baggage, refundable: item.refundable },
        },
      }));
    } else if (tab === 'hotels') {
      setSelected((s) => ({
        ...s,
        hotel: {
          type: 'hotel',
          provider: item.name,
          class: item.roomType,
          destination: `${item.city} · ${item.area}`,
          fare: item.totalPrice,
          unitFare: item.pricePerNight,
          nights: item.nights,
          passengers: Number(hotelForm.guests) || 1,
          departureDate: hotelForm.checkIn,
          returnDate: hotelForm.checkOut,
          details: { starRating: item.starRating, breakfast: item.breakfastIncluded, amenities: item.amenities, cancellation: item.cancellationPolicy },
        },
      }));
    } else {
      setSelected((s) => ({
        ...s,
        railway: {
          type: 'railway',
          provider: item.trainName,
          providerRef: item.trainNumber,
          class: item.classes[0].className,
          origin: `${item.from.station} (${item.from.city})`,
          destination: `${item.to.station} (${item.to.city})`,
          fare: item.classes[0].fare,
          unitFare: item.classes[0].fare,
          passengers: Number(railForm.passengers) || 1,
          departureDate: item.journeyDate || railForm.date,
          details: { depTime: item.depTime, arrTime: item.arrTime, trainType: item.trainType, className: item.classes[0].className },
        },
      }));
    }
  };

  const selectedCount = [selected.flight, selected.hotel, selected.railway].filter(Boolean).length;

  const openReview = async () => {
    setReviewOpen(true);
    setSubmitError('');
    setPolicyResult(null);
    setPolicyLoading(true);
    try {
      const selections = {};
      if (selected.flight) selections.flight = selected.flight;
      if (selected.hotel) selections.hotel = selected.hotel;
      if (selected.railway) selections.railway = selected.railway;
      const res = await api.post('/policy/validate', { selections });
      setPolicyResult(res.data);
    } catch (err) {
      setSubmitError(errorMessage(err, 'Policy validation failed.'));
    } finally {
      setPolicyLoading(false);
    }
  };

  const totalCost = useMemo(() => {
    let total = 0;
    if (selected.flight) total += selected.flight.fare * selected.flight.passengers;
    if (selected.hotel) total += selected.hotel.fare;
    if (selected.railway) total += selected.railway.fare * selected.railway.passengers;
    return total;
  }, [selected]);

  const submitRequest = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const selections = [selected.flight, selected.hotel, selected.railway].filter(Boolean);
      const first = selections[0];
      const res = await api.post('/travel-requests', {
        travelPurpose: purpose,
        purposeNote,
        origin: first.origin ? first.origin.split(' (')[0] : (first.destination || '').split(' ·')[0],
        destination: first.destination ? first.destination.split(' (')[0].split(' ·')[0] : '',
        departureDate: first.departureDate,
        tripType: 'one-way',
        selections,
      });
      setReviewOpen(false);
      navigate(`/requests?created=${res.data.request.requestId}`);
    } catch (err) {
      setSubmitError(errorMessage(err, 'Unable to submit travel request.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="section-eyebrow">Search business travel</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-950">Plan your next trip</h1>
        <p className="mt-1 text-sm text-slate-500">
          Find flights, hotels and railways — every option is checked against your <Badge color="navy">Band {user.salaryBand}</Badge> entitlement.
        </p>
      </div>

      {/* Search toolbar */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-3">
          <Tabs tabs={TABS} active={tab} onChange={(t) => { setTab(t); setResults(null); setError(''); }} />
        </div>
        <div className="p-5 sm:p-6">
          {tab === 'flights' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <Field label="From" className="lg:col-span-2">
                <Select value={flightForm.from} onChange={setF('from')}>
                  <option value="Mumbai">Mumbai (BOM)</option>
                  <option value="Delhi">Delhi (DEL)</option>
                  <option value="Bengaluru">Bengaluru (BLR)</option>
                  <option value="Hyderabad">Hyderabad (HYD)</option>
                  <option value="Chennai">Chennai (MAA)</option>
                  <option value="Pune">Pune (PNQ)</option>
                  <option value="Kolkata">Kolkata (CCU)</option>
                  <option value="Jaipur">Jaipur (JAI)</option>
                  <option value="Goa">Goa (GOI)</option>
                </Select>
              </Field>
              <div className="flex items-end justify-center pb-2">
                <button
                  type="button"
                  onClick={() => setFlightForm((f) => ({ ...f, from: f.to, to: f.from }))}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                  aria-label="Swap cities"
                >
                  <ArrowLeftRight size={16} />
                </button>
              </div>
              <Field label="To" className="lg:col-span-2">
                <Select value={flightForm.to} onChange={setF('to')}>
                  <option value="Delhi">Delhi (DEL)</option>
                  <option value="Mumbai">Mumbai (BOM)</option>
                  <option value="Bengaluru">Bengaluru (BLR)</option>
                  <option value="Hyderabad">Hyderabad (HYD)</option>
                  <option value="Chennai">Chennai (MAA)</option>
                  <option value="Pune">Pune (PNQ)</option>
                  <option value="Kolkata">Kolkata (CCU)</option>
                  <option value="Jaipur">Jaipur (JAI)</option>
                  <option value="Goa">Goa (GOI)</option>
                </Select>
              </Field>
              <Field label="Departure date">
                <Input type="date" value={flightForm.departureDate} onChange={setF('departureDate')} />
              </Field>
              <Field label="Trip type">
                <Select value={flightForm.tripType} onChange={setF('tripType')}>
                  <option value="one-way">One way</option>
                  <option value="round-trip">Round trip</option>
                </Select>
              </Field>
              <Field label="Passengers">
                <Select value={flightForm.passengers} onChange={setF('passengers')}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </Field>
              <Field label="Travel class">
                <Select value={flightForm.travelClass} onChange={setF('travelClass')}>
                  <option value="Any">Any class</option>
                  <option value="Economy">Economy</option>
                  <option value="Premium Economy">Premium Economy</option>
                  <option value="Business">Business</option>
                </Select>
              </Field>
            </div>
          )}

          {tab === 'hotels' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="City">
                <Select value={hotelForm.city} onChange={setH('city')}>
                  {['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Jaipur', 'Kolkata', 'Goa'].map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Check-in">
                <Input type="date" value={hotelForm.checkIn} onChange={setH('checkIn')} />
              </Field>
              <Field label="Check-out">
                <Input type="date" value={hotelForm.checkOut} onChange={setH('checkOut')} />
              </Field>
              <Field label="Guests">
                <Select value={hotelForm.guests} onChange={setH('guests')}>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </Field>
              <Field label="Rooms">
                <Select value={hotelForm.rooms} onChange={setH('rooms')}>
                  {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </Field>
            </div>
          )}

          {tab === 'railway' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="From station" className="lg:col-span-2">
                <Select value={railForm.from} onChange={setR('from')}>
                  <option value="Mumbai">Mumbai (Mumbai Central / CSMT)</option>
                  <option value="Delhi">Delhi (New Delhi / Nizamuddin)</option>
                  <option value="Pune">Pune Junction</option>
                  <option value="Bengaluru">Bengaluru (KSR)</option>
                  <option value="Hyderabad">Hyderabad (Secunderabad)</option>
                  <option value="Chennai">Chennai Central</option>
                  <option value="Kolkata">Kolkata (Howrah)</option>
                  <option value="Jaipur">Jaipur Junction</option>
                </Select>
              </Field>
              <Field label="To station" className="lg:col-span-2">
                <Select value={railForm.to} onChange={setR('to')}>
                  <option value="Delhi">Delhi (New Delhi / Nizamuddin)</option>
                  <option value="Mumbai">Mumbai (Mumbai Central / CSMT)</option>
                  <option value="Pune">Pune Junction</option>
                  <option value="Bengaluru">Bengaluru (KSR)</option>
                  <option value="Hyderabad">Hyderabad (Secunderabad)</option>
                  <option value="Chennai">Chennai Central</option>
                  <option value="Kolkata">Kolkata (Howrah)</option>
                  <option value="Jaipur">Jaipur Junction</option>
                </Select>
              </Field>
              <Field label="Journey date">
                <Input type="date" value={railForm.date} onChange={setR('date')} />
              </Field>
              <Field label="Passengers">
                <Select value={railForm.passengers} onChange={setR('passengers')}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                </Select>
              </Field>
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <Button onClick={search} loading={searching} size="lg">
              <Search size={16} /> Search {tab === 'flights' ? 'flights' : tab === 'hotels' ? 'hotels' : 'trains'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Selection summary bar */}
      {selectedCount > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-bold text-navy-950">Your selection:</span>
            {selected.flight && (
              <Badge color="blue" className="!px-3 !py-1.5">
                <Plane size={12} /> {selected.flight.provider} {selected.flight.providerRef} · {selected.flight.class} · {formatINR(selected.flight.fare)}
              </Badge>
            )}
            {selected.hotel && (
              <Badge color="teal" className="!px-3 !py-1.5">
                <Hotel size={12} /> {selected.hotel.provider} · {selected.hotel.nights}n · {formatINR(selected.hotel.fare)}
              </Badge>
            )}
            {selected.railway && (
              <Badge color="green" className="!px-3 !py-1.5">
                <TrainFront size={12} /> {selected.railway.provider} · {selected.railway.class} · {formatINR(selected.railway.fare)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              Estimated <strong className="text-navy-950">{formatINR(totalCost)}</strong>
            </span>
            <Button onClick={openReview} size="md">
              Review & Submit Request <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {searching && <InlineLoader message="Searching best options..." />}
      {error && <ErrorState message={error} onRetry={search} />}
      {results !== null && !searching && !error && (
        results.length === 0 ? (
          <EmptyState
            title="No options found"
            message="Try different cities, dates or filters."
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">
                {results.length} option{results.length > 1 ? 's' : ''} found
              </p>
              {bandPolicy && (
                <p className="text-[11px] text-slate-400">
                  Fare preview vs Band {user.salaryBand} limit — final validation happens at review.
                </p>
              )}
            </div>
            {tab === 'flights' && results.map((f) => <FlightRow key={f.id} f={f} onSelect={() => selectOption(f)} selected={selected.flight?.providerRef === f.flightNumber} bandPolicy={bandPolicy} />)}
            {tab === 'hotels' && results.map((h) => <HotelRow key={h.id} h={h} onSelect={() => selectOption(h)} selected={selected.hotel?.provider === h.name} bandPolicy={bandPolicy} />)}
            {tab === 'railway' && results.map((t) => <TrainRow key={t.id} t={t} onSelect={() => selectOption(t)} selected={selected.railway?.providerRef === t.trainNumber} bandPolicy={bandPolicy} />)}
          </div>
        )
      )}

      {/* Review modal */}
      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Review & submit travel request"
        subtitle="Your manager will review this request before it is booked"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button onClick={submitRequest} loading={submitting} disabled={policyResult?.status === 'VIOLATION'}>
              {policyResult?.status === 'VIOLATION' ? 'Violates policy' : 'Submit request'} <ArrowRight size={15} />
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Workflow stepper */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3.5">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => {
                const done = i === 0 || (i === 1 && policyResult);
                const current = i === 1 && policyLoading;
                return (
                  <div key={s.label} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                          done ? 'border-sunrise-500 bg-sunrise-500 text-white' : current ? 'border-brand-500 bg-brand-500 text-white animate-pulse' : 'border-slate-200 bg-white text-slate-300'
                        }`}
                      >
                        <s.icon size={12} />
                      </span>
                      <span className={`whitespace-nowrap text-[10px] font-bold ${done ? 'text-slate-700' : 'text-slate-400'}`}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={`mx-1 mb-4 h-0.5 flex-1 rounded-full ${i === 0 ? 'bg-sunrise-400' : 'bg-slate-200'}`} />}
                  </div>
                );
              })}
            </div>
          </div>

          {submitError && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{submitError}</div>
          )}

          {/* Selected itinerary */}
          <div className="space-y-2.5">
            {selected.flight && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Plane size={16} /></span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selected.flight.provider} {selected.flight.providerRef} · {selected.flight.class}</p>
                    <p className="text-xs text-slate-500">{selected.flight.origin} → {selected.flight.destination} · {formatDate(selected.flight.departureDate)}</p>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-navy-950">{formatINR(selected.flight.fare)}</p>
              </div>
            )}
            {selected.hotel && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600"><Hotel size={16} /></span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selected.hotel.provider} · {selected.hotel.class}</p>
                    <p className="text-xs text-slate-500">{selected.hotel.destination} · {selected.hotel.nights} nights</p>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-navy-950">{formatINR(selected.hotel.fare)}</p>
              </div>
            )}
            {selected.railway && (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sunrise-50 text-sunrise-600"><TrainFront size={16} /></span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{selected.railway.provider} ({selected.railway.providerRef}) · {selected.railway.class}</p>
                    <p className="text-xs text-slate-500">{selected.railway.origin} → {selected.railway.destination}</p>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-navy-950">{formatINR(selected.railway.fare)}</p>
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg bg-navy-950 px-4 py-3 text-white">
              <span className="text-sm font-semibold text-slate-300">Estimated total</span>
              <span className="text-lg font-extrabold">{formatINR(totalCost)}</span>
            </div>
          </div>

          {/* Live policy validation */}
          {policyLoading ? (
            <InlineLoader message="Running policy validation..." />
          ) : policyResult ? (
            <PolicyResultPanel policyResult={policyResult} />
          ) : null}

          {/* Purpose */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business purpose" required>
              <Select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                {PURPOSE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Purpose note" hint="Optional context for your manager">
              <Input value={purposeNote} onChange={(e) => setPurposeNote(e.target.value)} placeholder="e.g. Meeting with client at HQ" />
            </Field>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-brand-600" />
            <p>
              Submitting creates a <strong>pending request</strong> for your manager — no booking is confirmed until approved.
              {policyResult?.status === 'VIOLATION' && <span className="text-red-600"> This selection violates policy and cannot be submitted.</span>}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ---------- Fare preview chip ---------- */
function FareChip({ over, band }) {
  if (band === undefined || band === null) return null;
  return over ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200">
      <Clock size={10} /> Exceeds Band {band} fare limit
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-sunrise-50 px-1.5 py-0.5 text-[10px] font-bold text-sunrise-700 ring-1 ring-inset ring-sunrise-200">
      <Check size={10} /> Within Band {band} fare limit
    </span>
  );
}

/* ---------- Result rows ---------- */

function JourneyTimeline({ dep, arr, durationMin }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-extrabold text-navy-950">{dep}</span>
      <span className="flex items-center gap-1 text-xs text-slate-400">
        <Clock size={11} /> {durationLabel(durationMin)}
      </span>
      <span className="font-extrabold text-navy-950">{arr}</span>
    </div>
  );
}

function FlightRow({ f, onSelect, selected, bandPolicy }) {
  const over = bandPolicy ? f.fare > bandPolicy.maxFlightFare : undefined;
  return (
    <Card className={`p-4 transition ${selected ? 'border-brand-400 ring-2 ring-brand-200' : 'hover:shadow-card'}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Journey */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Plane size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900">
              {f.airline} <span className="font-semibold text-slate-400">· {f.flightNumber}</span>
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-bold text-navy-950">{f.from.code}</span>
              <JourneyTimeline dep={f.depTime} arr={f.arrTime} durationMin={f.durationMin} />
              <span className="font-bold text-navy-950">{f.to.code}</span>
              <span className="text-xs text-slate-400">{f.stops > 0 ? `${f.stops} stop${f.stops > 1 ? 's' : ''}` : 'Non-stop'}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              <Badge color="blue">{f.travelClass}</Badge>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5">{f.baggage}</span>
              <span className={`rounded-md px-1.5 py-0.5 ${f.refundable ? 'bg-sunrise-50 text-sunrise-700' : 'bg-slate-100'}`}>
                {f.refundable ? 'Refundable' : 'Non-refundable'}
              </span>
              <span>{f.seatsAvailable} seats left</span>
              <FareChip over={over} band={bandPolicy?.salaryBand} />
            </div>
          </div>
        </div>
        {/* Price + action */}
        <div className="flex shrink-0 items-center justify-between gap-4 lg:flex-col lg:items-end">
          <div className="text-right">
            <p className="text-xl font-extrabold text-navy-950">{formatINR(f.fare)}</p>
            <p className="text-[11px] text-slate-400">per passenger</p>
          </div>
          <Button size="sm" variant={selected ? 'green' : 'primary'} onClick={onSelect}>
            {selected ? (<><Check size={13} /> Selected</>) : 'Select'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function HotelRow({ h, onSelect, selected, bandPolicy }) {
  const over = bandPolicy ? h.pricePerNight > bandPolicy.maxHotelPerNight : undefined;
  return (
    <Card className={`p-4 transition ${selected ? 'border-brand-400 ring-2 ring-brand-200' : 'hover:shadow-card'}`}>
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Hotel info */}
        <div className="flex min-w-0 flex-1 gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
            <Hotel size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900">{h.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">{h.city} · {h.area}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-0.5 text-xs font-bold text-amber-500">
                {Array.from({ length: h.starRating }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                <span className="ml-1 text-slate-500">{h.starRating}-star</span>
              </span>
              <Badge color="slate">{h.roomType}</Badge>
              {h.breakfastIncluded && (
                <span className="flex items-center gap-1 rounded-md bg-sunrise-50 px-1.5 py-0.5 text-[11px] font-semibold text-sunrise-700">
                  <Coffee size={11} /> Breakfast included
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
              {h.amenities.slice(0, 4).map((a) => (
                <span key={a} className="rounded-md bg-slate-100 px-1.5 py-0.5">{a}</span>
              ))}
              {h.amenities.length > 4 && <span>+{h.amenities.length - 4} more</span>}
            </div>
            <div className="mt-2">
              <FareChip over={over} band={bandPolicy?.salaryBand} />
            </div>
          </div>
        </div>
        {/* Price + action */}
        <div className="flex shrink-0 items-center justify-between gap-4 lg:flex-col lg:items-end">
          <div className="text-right">
            <p className="text-xl font-extrabold text-navy-950">{formatINR(h.totalPrice)}</p>
            <p className="text-[11px] text-slate-400">{formatINR(h.pricePerNight)}/night · {h.nights} nights</p>
          </div>
          <Button size="sm" variant={selected ? 'green' : 'primary'} onClick={onSelect}>
            {selected ? (<><Check size={13} /> Selected</>) : 'Select'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TrainRow({ t, onSelect, selected, bandPolicy }) {
  const over = bandPolicy ? t.classes[0].fare > bandPolicy.maxRailFare : undefined;
  return (
    <Card className={`p-4 transition ${selected ? 'border-brand-400 ring-2 ring-brand-200' : 'hover:shadow-card'}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Journey */}
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sunrise-50 text-sunrise-600">
            <TrainFront size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900">
              {t.trainName} <span className="font-semibold text-slate-400">· {t.trainNumber}</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{t.from.station} → {t.to.station}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-bold text-navy-950">{t.from.city}</span>
              <JourneyTimeline dep={t.depTime} arr={t.arrTime} durationMin={t.durationMin} />
              <span className="font-bold text-navy-950">{t.to.city}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {t.classes.slice(0, 4).map((c) => (
                <span key={c.className} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  {c.className} · {formatINR(c.fare)} · {c.availability} seats
                </span>
              ))}
              <FareChip over={over} band={bandPolicy?.salaryBand} />
            </div>
          </div>
        </div>
        {/* Price + action */}
        <div className="flex shrink-0 items-center justify-between gap-4 lg:flex-col lg:items-end">
          <div className="text-right">
            <p className="text-sm font-extrabold text-navy-950">{t.trainType}</p>
            <p className="text-[11px] text-slate-400">from {formatINR(t.classes[0].fare)}</p>
          </div>
          <Button size="sm" variant={selected ? 'green' : 'primary'} onClick={onSelect}>
            {selected ? (<><Check size={13} /> Selected</>) : 'Select'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
