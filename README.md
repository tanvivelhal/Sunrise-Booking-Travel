# SUNRISE — Corporate Travel Management Platform

**SUNRISE** is a full-stack corporate travel management platform. Employees search and
select business travel (flights, hotels, railways), a **real policy engine** validates every
selection against the employee's salary-band entitlement, managers approve or reject
requests, bookings flow through **Pending → Approved → Ticketed → Cancelled**, and
administrators monitor company-wide travel spend and analytics.

This is a business-focused enterprise application — not a consumer travel website.
All travel data is **mock**, served through the backend API so it can later be swapped for
live providers (Amadeus, Sabre, IRCTC, etc.) without touching the frontend.

---

## Quick Start

> **Prerequisites:** Node.js 18+ (tested on Node 22). No MongoDB install needed —
> if a local MongoDB isn't reachable the backend automatically starts an in-memory
> MongoDB and seeds the full demo dataset on first boot.

### 1. Backend (port 5000)

```bash
cd server
npm install
npm run dev     # nodemon
```

Expected startup output:

```text
SUNRISE Backend
MongoDB connected successfully
Server running on http://localhost:5000
```

### 2. Frontend (port 5173)

```bash
cd client
npm install
npm run dev     # vite
```

Expected: `VITE running at http://localhost:5173`. Open **http://localhost:5173**.

The frontend calls the backend through `VITE_API_URL` (defined in `client/.env`):

```env
VITE_API_URL=http://localhost:5000/api
```

If `VITE_API_URL` is not set, the Vite dev server proxies `/api` to `http://localhost:5000` as a fallback.

### Optional — use your own MongoDB

```bash
# server/.env
PORT=5000
MONGO_URI=mongodb://localhost:27017/sunrise_travel
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

If `MONGO_URI` is unreachable, the server falls back to an in-memory MongoDB
(`mongodb-memory-server`) automatically — perfect for demos and CI. The fallback keeps
its data in `server/.mongo-data` (on the real disk, never the OS temp dir), so it works
even on machines whose `/tmp` is a small RAM-backed tmpfs.

### Reseeding data

```bash
cd server
npm run seed:reset   # drop all collections and reseed the demo dataset
```

The server also auto-seeds on first boot when the database is empty.

---

## Demo Accounts

| Role | Email | Password | Redirects to |
|------|-------|----------|--------------|
| **Employee** | `employee@sunrise.com` | `Employee@123` | `/dashboard` |
| **Manager** | `manager@sunrise.com` | `Manager@123` | `/manager` |
| **Admin** | `admin@sunrise.com` | `Admin@123` | `/admin` |

The login page has one-click **Demo Account** buttons that auto-fill the credentials —
click a role, then press **Sign In**.

**Public self-registration always creates an Employee account.** Admin accounts are only
provisioned by seeding / admins and can never be self-registered.

---

## The Demo Story (evaluator walkthrough)

1. **Login as Employee** → Employee dashboard opens with real stats.
2. **Search Travel** (Mumbai → Delhi) → select a flight and a hotel (or a railway).
3. The **policy engine** validates the selection live: *Within Company Policy* /
   *Above Recommended Limit* / *Policy Violation* with an explanation and a recommended
   alternative.
4. Choose a **business purpose** (e.g. Client Meeting) → **Submit request** → status **Pending**.
5. **Logout → Login as Manager** → open **Approvals** → see Rahul Sharma's request with
   full context (employee, policy result, cost) → **Approve**.
6. The booking becomes **Approved**, then **Ticketed** automatically (~10s later, simulating
   airline ticketing). The employee is notified.
7. **Login as Admin** → see **Today's bookings, Pending approvals, Cancelled bookings,
   Travel spend, Most travelled city**, charts, and the booking timeline
   (*Request Created → Policy Checked → Pending Approval → Approved → Ticketed*).
8. Managers can also **Reject** (a comment is required), and employees/admins can
   **Cancel** ticketed bookings — every transition is validated.

---

## Technology Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6, Axios, Recharts, lucide-react |
| Backend | Node.js, Express 4, Mongoose 8, JWT, bcryptjs, express-validator |
| Database | MongoDB (local or automatic in-memory fallback) |
| Auth | JWT bearer tokens, bcrypt password hashing, role middleware |

### Project structure

```
SUNRISE/
├── server/               # Node.js + Express + MongoDB backend
│   ├── src/
│   │   ├── config/        # db connection (+ robust in-memory fallback), constants
│   │   ├── models/        # User, TravelPolicy, Flight, Hotel, Train, TravelRequest, Booking, Notification, AuditLog
│   │   ├── controllers/   # route handlers (auth, travel, requests, bookings, dashboards, users, policies, notifications)
│   │   ├── routes/        # REST route definitions
│   │   ├── middleware/    # protect (JWT), authorize (roles), errorHandler
│   │   ├── services/      # policy engine, travel search (provider abstraction), audit, status transitions
│   │   ├── data/          # seed catalogues (flights, hotels, trains, policies, users)
│   │   ├── seed/          # seed orchestrator (interconnected demo dataset)
│   │   └── utils/         # date helpers, API test harness
│   └── .env               # PORT, MONGO_URI, JWT_SECRET
└── client/                # React + Vite + Tailwind frontend
    └── src/
        ├── api/           # axios client with auth interceptor
        ├── context/       # AuthContext (login/logout/session restore)
        ├── components/    # design-system UI + layout (navy sidebar shell)
        ├── pages/         # landing, login, register, employee/manager/admin areas
        └── utils/         # INR/date formatting
```

---

## Key Features

### Corporate travel policy engine (`server/src/services/policyService.js`)
A real business rule, not a frontend label. Entitlements are stored per salary band in
MongoDB (`TravelPolicy`) and evaluated by the backend:

| Band | Flight | Hotel | Rail | Max flight | Max hotel/night |
|------|--------|-------|------|-----------|-----------------|
| A | Economy | ≤ 2★ | SL / 3AC | ₹8,000 | ₹3,000 |
| B | Economy | ≤ 3★ | 3AC / 2AC | ₹12,000 | ₹5,000 |
| C | Economy / Premium | ≤ 4★ | 2AC / EC | ₹20,000 | ₹8,000 |
| D | Business | ≤ 5★ | 1AC / EC | ₹35,000 | ₹15,000 |

Every selection returns `COMPLIANT` / `WARNING` / `VIOLATION` with an explained reason
(e.g. *"Band A employees are eligible for Economy class travel only."*) and a recommended
alternative. **Violations cannot be submitted.**

### Approval workflow
- Employee creates a request → **Pending** (manager notified in-app).
- Manager **Approves** → booking **Approved** → auto-**Ticketed** (~10 s).
- Manager **Rejects** → booking **Rejected** (comment required).
- **Ticketed → Cancelled** (reason required; owner or admin).
- Invalid transitions (`Rejected → Ticketed`, `Cancelled → Approved`, …) are rejected by the
  backend status guard (`services/statusService.js`).

### Role-based security
- `protect` (JWT) + `authorize('manager','admin')` middleware on every protected route.
- Employees receive `403` for manager/admin APIs — verified by tests.
- Passwords hashed with bcrypt; JWT secret loaded from `.env` (never hardcoded in code).

### Database-driven dashboards
No hardcoded numbers. Admin stats are computed from stored bookings:
today's bookings (by `createdAt`), cancelled bookings (by status), travel spend (sum of
fares), most travelled city (by destination counts), pending approvals (by request status).

### Audit log
`Login`, `Request Created`, `Approved`, `Rejected`, `Ticketed`, `Cancelled`,
`Policy Updated`, `User Updated` — with user, action, entity, entity id, ref and metadata.

### Seeded demo dataset (interconnected)
4 policies · 17 users (1 admin, 4 managers, 12 employees) · 26 flights · 20 hotels ·
17 trains · 30 travel requests · 30 linked bookings across ~6 months (pending, approved,
rejected, ticketed, cancelled, policy-violating) · notifications · audit logs.

---

## REST API

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/auth/login` | public | sign in |
| POST | `/api/auth/register` | public | self-register (employee only) |
| POST | `/api/auth/logout` | auth | sign out (audit) |
| GET | `/api/auth/me` | auth | current user |
| GET | `/api/flights` · `/api/hotels` · `/api/trains` | auth | mock travel search |
| GET | `/api/lookup/airports` · `/stations` · `/cities` | auth | search-form selectors |
| POST | `/api/policy/validate` | auth | real policy evaluation |
| POST | `/api/travel-requests` | employee | create request (→ Pending) |
| GET | `/api/travel-requests/my` · `/pending` · `/` | role-scoped | lists |
| GET | `/api/travel-requests/:id` | owner/manager/admin | detail (+ linked booking) |
| PATCH | `/api/travel-requests/:id/approve` · `/reject` | manager/admin | decisions |
| GET | `/api/bookings/my` · `/` · `/:id` | role-scoped | bookings |
| POST | `/api/bookings/:id/ticket` | manager/admin | mark ticketed |
| PATCH | `/api/bookings/:id/cancel` | employee/admin | cancel (reason required) |
| GET | `/api/dashboard/employee` · `/manager` · `/admin` | role-scoped | dashboards |
| GET | `/api/dashboard/admin/analytics` | admin | chart datasets |
| GET | `/api/policies` · PUT `/api/policies/:id` | auth / admin | policy management |
| GET | `/api/users` · PUT `/api/users/:id` | admin | user management |
| GET | `/api/users/managers` | auth | manager list (registration) |
| GET | `/api/notifications` · PATCH `/:id/read` · `/read-all` | auth | notifications |

### Testing

```bash
# Backend end-to-end API test (28 checks: auth, roles, policy engine,
# approvals, ticketing, cancellation, dashboards, analytics)
cd server && node src/utils/apiTest.js
```

---

## Design System

Premium enterprise SaaS visual language for corporate travel management:
deep navy/midnight-blue surfaces, indigo/royal-blue primary actions, teal/cyan accents,
cool light-gray backgrounds with white surfaces and dark-slate text. Gradients are
used sparingly; amber appears only as a warning / review-required status color
(never as brand color).

- Colors: `navy` deep blue (#1D2542), `brand` indigo (#4F46E5), `accent` teal (#0D9488),
  `sunrise` emerald (#059669), `amber` warnings-only (#D97706) — defined in
  `client/tailwind.config.js` (slate uses Tailwind's default cool scale).
- The app shell is a compact collapsible navy sidebar with grouped navigation, a global
  search header with notifications and profile, and a bottom user card.
- Reusable components in `client/src/components/ui/` (Button, Card, Badge, StatusBadge,
  PolicyBadge, Modal, Tabs, StatCard, form fields, loading/empty/error states) plus
  `TravelMapArt` — an abstract dotted route-map visual for auth and landing panels.
- Travel results use journey-style layouts (departure → arrival with duration) for
  flights and rail, and a split information/price layout for hotels.

---

## Future API readiness

`services/travelSearchService.js` is the provider boundary: `searchFlights`, `searchHotels`
and `searchTrains` return normalized results. Swap their internals for live airline / hotel /
railway APIs later — controllers, routes, policy engine and frontend stay unchanged.
The same pattern applies to ticketing (simulated delay), notifications (in-app today) and
audit logging.
