/**
 * End-to-end API test harness.
 * Starts the server, exercises every role's flows, prints results, exits.
 * Run: node src/utils/apiTest.js
 */
import { spawn } from 'node:child_process';

const BASE = 'http://localhost:5999';
const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
}

async function run() {
  const server = spawn('node', ['src/server.js'], {
    env: { ...process.env, PORT: '5999' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (d) => process.env.TEST_VERBOSE && process.stdout.write(d));
  server.stderr.on('data', (d) => process.stderr.write(d));

  // Wait for server to come up (first run may download mongo binary + seed)
  let up = false;
  for (let i = 0; i < 60; i++) {
    try {
      const h = await fetch(BASE + '/api/health');
      if (h.ok) { up = true; break; }
    } catch { /* not up yet */ }
    await wait(1000);
  }
  if (!up) {
    console.error('Server did not start in time.');
    server.kill();
    process.exit(1);
  }
  console.log('── Server up. Running API tests ──\n');

  const login = async (email, password) => {
    const r = await api('/api/auth/login', { method: 'POST', body: { email, password } });
    return r.json;
  };

  // 1. Logins
  const emp = await login('employee@sunrise.com', 'Employee@123');
  const mgr = await login('manager@sunrise.com', 'Manager@123');
  const adm = await login('admin@sunrise.com', 'Admin@123');
  check('employee login', emp.user?.role === 'employee', emp.user?.name);
  check('manager login', mgr.user?.role === 'manager', mgr.user?.name);
  check('admin login', adm.user?.role === 'admin', adm.user?.name);

  // 2. Searches
  const flights = await api('/api/flights?from=Mumbai&to=Delhi', { token: emp.token });
  check('flight search', flights.json?.count > 0, `${flights.json?.count} results`);
  const hotels = await api('/api/hotels?city=Delhi', { token: emp.token });
  check('hotel search', hotels.json?.count > 0, `${hotels.json?.count} results`);
  const trains = await api('/api/trains?from=Mumbai&to=Delhi', { token: emp.token });
  check('railway search', trains.json?.count > 0, `${trains.json?.count} results`);

  // 3. Policy engine
  const bad = await api('/api/policy/validate', {
    method: 'POST', token: emp.token,
    body: { selections: { flight: { travelClass: 'Business', fare: 28900 } } },
  });
  check('policy: Band A + Business = VIOLATION', bad.json?.status === 'VIOLATION', bad.json?.checks?.[0]?.message?.slice(0, 60));
  const good = await api('/api/policy/validate', {
    method: 'POST', token: emp.token,
    body: { selections: { flight: { travelClass: 'Economy', fare: 7850 }, hotel: { starRating: 2, pricePerNight: 1850 } } },
  });
  check('policy: Band A + Economy + 2★ = COMPLIANT', good.json?.status === 'COMPLIANT', good.json?.summary);

  // 4. Create travel request
  const tomorrow = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const createRes = await api('/api/travel-requests', {
    method: 'POST', token: emp.token,
    body: {
      travelPurpose: 'Client Meeting',
      origin: 'Mumbai',
      destination: 'Delhi',
      departureDate: tomorrow,
      tripType: 'one-way',
      selections: [
        {
          type: 'flight', provider: 'Vistara', providerRef: 'UK-945', class: 'Economy',
          origin: 'Mumbai (BOM)', destination: 'Delhi (DEL)', fare: 7850, unitFare: 7850, passengers: 1,
          departureDate: tomorrow,
          details: { depTime: '09:15', arrTime: '11:25', stops: 0, baggage: '25 kg check-in', refundable: true },
        },
        {
          type: 'hotel', provider: 'Hotel Grand Avenue', class: 'Standard Room',
          destination: 'Delhi · Karol Bagh', fare: 3500, unitFare: 1750, passengers: 1, nights: 2,
          departureDate: tomorrow, returnDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
          details: { starRating: 2, breakfast: false, amenities: ['Free Wi-Fi'], cancellation: 'Free 24h' },
        },
      ],
    },
  });
  check('create travel request', createRes.status === 201, `${createRes.json?.request?.requestId} status=${createRes.json?.request?.status}`);
  const newRequestId = createRes.json?.request?._id;

  // 5. Employee cannot approve
  const empApprove = await api(`/api/travel-requests/${newRequestId}/approve`, { method: 'PATCH', token: emp.token });
  check('employee CANNOT approve (403)', empApprove.status === 403, empApprove.json?.message);

  // 6. Manager sees pending queue and approves
  const pending = await api('/api/travel-requests/pending', { token: mgr.token });
  check('manager sees pending queue', pending.json?.count >= 1, `${pending.json?.count} pending`);
  const approveRes = await api(`/api/travel-requests/${newRequestId}/approve`, { method: 'PATCH', token: mgr.token });
  check('manager approves request', approveRes.status === 200 && approveRes.json?.request?.status === 'Approved', `booking=${approveRes.json?.booking?.status}`);

  // 7. Booking auto-ticketing (allow the 10s timer)
  await wait(12000);
  const bookings = await api('/api/bookings/my', { token: emp.token });
  const createdBooking = bookings.json?.results?.find((b) => String(b.request?._id) === newRequestId);
  check('booking becomes Ticketed after approval', createdBooking?.status === 'Ticketed', createdBooking?.bookingRef);

  // 8. Manager rejection flow with comment
  const rejectRes = await api(`/api/travel-requests/${newRequestId}/reject`, { method: 'PATCH', token: mgr.token, body: { comment: 'test' } });
  check('cannot reject already approved request', rejectRes.status === 400, rejectRes.json?.message);

  // Create another request to reject
  const create2 = await api('/api/travel-requests', {
    method: 'POST', token: emp.token,
    body: {
      travelPurpose: 'Training', origin: 'Mumbai', destination: 'Pune', departureDate: tomorrow,
      selections: [{ type: 'railway', provider: 'Mumbai Shatabdi', providerRef: '12025', class: 'CC', origin: 'Mumbai Central', destination: 'Pune Junction', fare: 565, unitFare: 565, passengers: 1, departureDate: tomorrow, details: { depTime: '06:25', arrTime: '09:25' } }],
    },
  });
  const reject2 = await api(`/api/travel-requests/${create2.json?.request?._id}/reject`, {
    method: 'PATCH', token: mgr.token, body: { comment: 'Budget not approved this quarter.' },
  });
  check('manager rejects with comment', reject2.json?.request?.status === 'Rejected', reject2.json?.request?.managerComment);

  // 9. Cancel a ticketed booking
  const cancelRes = await api(`/api/bookings/${createdBooking?._id}/cancel`, {
    method: 'PATCH', token: emp.token, body: { reason: 'Client meeting rescheduled.' },
  });
  check('employee cancels ticketed booking', cancelRes.json?.booking?.status === 'Cancelled', cancelRes.json?.message);

  // 10. Notifications
  const notifs = await api('/api/notifications', { token: emp.token });
  check('employee notifications exist', notifs.json?.count >= 1, `${notifs.json?.count} notifications, ${notifs.json?.unread} unread`);

  // 11. Dashboards
  const empDash = await api('/api/dashboard/employee', { token: emp.token });
  check('employee dashboard stats', empDash.json?.stats && typeof empDash.json?.stats.travelSpend === 'number', JSON.stringify(empDash.json?.stats));
  const mgrDash = await api('/api/dashboard/manager', { token: mgr.token });
  check('manager dashboard stats', mgrDash.json?.stats?.pendingApprovals >= 0, JSON.stringify(mgrDash.json?.stats));
  const admDash = await api('/api/dashboard/admin', { token: adm.token });
  check('admin dashboard stats', admDash.json?.stats?.todayBookings >= 0 && admDash.json?.stats?.mostTravelledCity, JSON.stringify(admDash.json?.stats));

  // 12. Role authorization
  const forbidden = await api('/api/dashboard/admin', { token: emp.token });
  check('employee blocked from admin API (403)', forbidden.status === 403);
  const forbidden2 = await api('/api/users', { token: mgr.token });
  check('manager blocked from user mgmt API (403)', forbidden2.status === 403);
  const noToken = await api('/api/dashboard/employee');
  check('no token blocked (401)', noToken.status === 401);

  // 13. Admin analytics
  const analytics = await api('/api/dashboard/admin/analytics', { token: adm.token });
  check('admin analytics', analytics.json?.spendByMonth?.length === 6 && analytics.json?.policyViolations, JSON.stringify(analytics.json?.policyViolations));

  // 14. Admin policy management
  const policies = await api('/api/policies', { token: adm.token });
  check('admin lists policies', policies.json?.count === 4, `${policies.json?.count} bands`);
  const policyId = policies.json?.results?.[0]?._id;
  const upd = await api(`/api/policies/${policyId}`, { method: 'PUT', token: adm.token, body: { maxFlightFare: 9000 } });
  check('admin updates policy (persisted)', upd.json?.policy?.maxFlightFare === 9000, `maxFlightFare=${upd.json?.policy?.maxFlightFare}`);
  // Restore
  await api(`/api/policies/${policyId}`, { method: 'PUT', token: adm.token, body: { maxFlightFare: 8000 } });

  // 15. Register
  const reg = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Test New Hire', email: 'test.newhire@sunrise.com', password: 'Password@123', confirmPassword: 'Password@123',
      department: 'Sales', designation: 'Executive', salaryBand: 'B', manager: mgr.user?._id,
    },
  });
  check('self-registration creates employee', reg.json?.user?.role === 'employee', reg.json?.user?.email);

  // 16. Admin user management
  const users = await api('/api/users', { token: adm.token });
  check('admin lists users', users.json?.count >= 17, `${users.json?.count} users`);

  console.log('\n── Results ──');
  const failed = results.filter((r) => !r.ok);
  console.log(`${results.length - failed.length}/${results.length} passed`);
  server.kill();
  process.exit(failed.length ? 1 : 0);
}

run().catch((e) => { console.error('HARNESS FAIL:', e); process.exit(1); });
