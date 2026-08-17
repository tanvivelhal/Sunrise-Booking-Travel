/**
 * SUNRISE database seeder.
 *
 * Builds a fully interconnected demo dataset:
 *  - 4 travel policies (Band A-D)
 *  - 1 admin, 4 managers, 12 employees (incl. the 3 demo accounts)
 *  - 26+ flights, 20 hotels, 17 trains (mock catalogues)
 *  - 15+ travel requests with linked bookings across ~6 months of history
 *  - Notifications and audit logs
 *
 * Usage:
 *   npm run seed          (seed if empty)
 *   npm run seed:reset    (drop collections and reseed)
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { connectDB } from '../config/db.js';
import {
  User,
  TravelPolicy,
  Flight,
  Hotel,
  Train,
  TravelRequest,
  Booking,
  Notification,
  AuditLog,
} from '../models/index.js';
import { POLICY_SEED } from '../data/policies.js';
import { USER_SEED } from '../data/users.js';
import { FLIGHT_SEED } from '../data/flights.js';
import { HOTEL_SEED } from '../data/hotels.js';
import { TRAIN_SEED } from '../data/trains.js';
import { validateSelections } from '../services/policyService.js';
import { daysAgo, plusDays, plusHours, nightsBetween } from '../utils/date.js';

dotenv.config();

let employees = []; // { user, manager }
let flightCatalog = [];
let hotelCatalog = [];
let trainCatalog = [];
let policies = {};
let requestCounter = 1;
let bookingCounter = 1;

function nextRequestId() {
  return `TR-${String(requestCounter++).padStart(4, '0')}`;
}
function nextBookingRef() {
  return `BK-${String(bookingCounter++).padStart(4, '0')}`;
}

function pickFlight(fromCity, toCity, travelClass) {
  return (
    flightCatalog.find(
      (f) => f.fromCity === fromCity && f.toCity === toCity && f.travelClass === travelClass
    ) || flightCatalog.find((f) => f.fromCity === fromCity && f.toCity === toCity)
  );
}

function pickHotel(city, starRating) {
  return (
    hotelCatalog.find((h) => h.city === city && h.starRating === starRating) ||
    hotelCatalog.find((h) => h.city === city)
  );
}

function pickTrain(fromCity, toCity) {
  return trainCatalog.find((t) => t.fromCity === fromCity && t.toCity === toCity);
}

/**
 * Create a travel request + linked booking with a realistic timeline.
 */
async function createTrip({
  employee,
  purpose,
  purposeNote = '',
  origin,
  destination,
  travel = ['flight', 'hotel'],
  travelClass,
  hotelStar,
  nights,
  railClass,
  createdDaysAgo,
  departDaysAfter,
  status, // Pending | Approved | Rejected | Ticketed | Cancelled
  managerComment = '',
  cancelledReason = '',
}) {
  const policy = policies[employee.user.salaryBand];
  const passengers = 1;

  const selections = {};
  let depDate = plusDays(daysAgo(createdDaysAgo), departDaysAfter);
  let retDate = null;

  if (travel.includes('flight')) {
    const f = pickFlight(origin, destination, travelClass);
    if (f) {
      selections.flight = {
        provider: f.airline,
        providerRef: f.flightNumber,
        class: f.travelClass,
        origin: `${f.fromCity} (${f.fromCode})`,
        destination: `${f.toCity} (${f.toCode})`,
        departureDate: depDate,
        fare: f.fare,
        details: {
          depTime: f.depTime,
          arrTime: f.arrTime,
          stops: f.stops,
          baggage: f.baggage,
          refundable: f.refundable,
        },
      };
      retDate = travel.includes('hotel') ? plusDays(depDate, nights) : plusDays(depDate, 2);
    }
  }

  if (travel.includes('hotel')) {
    const h = pickHotel(destination, hotelStar);
    if (h) {
      const checkIn = depDate;
      const checkOut = plusDays(checkIn, nights);
      selections.hotel = {
        provider: h.name,
        class: h.roomType,
        origin: '',
        destination: `${h.city} · ${h.area}`,
        departureDate: checkIn,
        returnDate: checkOut,
        fare: h.pricePerNight * nights,
        unitFare: h.pricePerNight,
        passengers: 1,
        nights,
        details: {
          starRating: h.starRating,
          breakfast: h.breakfastIncluded,
          amenities: h.amenities,
          cancellation: h.cancellationPolicy,
        },
      };
      retDate = checkOut;
    }
  }

  if (travel.includes('railway')) {
    const t = pickTrain(origin, destination);
    if (t) {
      const cls = t.classes.find((c) => c.className === railClass) || t.classes[0];
      selections.railway = {
        provider: t.trainName,
        providerRef: t.trainNumber,
        class: cls.className,
        origin: `${t.fromStation} (${t.fromCity})`,
        destination: `${t.toStation} (${t.toCity})`,
        departureDate: depDate,
        fare: cls.fare,
        details: {
          depTime: t.depTime,
          arrTime: t.arrTime,
          trainType: t.trainType,
          availability: cls.availability,
        },
      };
      if (!retDate) retDate = plusDays(depDate, 2);
    }
  }

  if (!retDate) retDate = plusDays(depDate, 2);

  // Run the real policy engine so results are computed, not hardcoded.
  const policyResult = validateSelections(policy, selections);

  let estimatedCost = 0;
  if (selections.flight) estimatedCost += selections.flight.fare * passengers;
  if (selections.hotel) estimatedCost += selections.hotel.fare;
  if (selections.railway) estimatedCost += selections.railway.fare * passengers;
  estimatedCost = Math.round(estimatedCost);

  const createdAt = daysAgo(createdDaysAgo);
  const decidedAt = plusHours(createdAt, 20);
  const ticketedAt = plusHours(decidedAt, 6);

  const statuses = travel.length > 1 ? 'multi' : travel[0];
  const request = await TravelRequest.create({
    requestId: nextRequestId(),
    employee: employee.user._id,
    manager: employee.manager._id,
    travelPurpose: purpose,
    purposeNote,
    tripType: 'one-way',
    origin: `${origin}`,
    destination: `${destination}`,
    departureDate: depDate,
    returnDate: retDate,
    selections: Object.entries(selections).map(([type, s]) => ({ ...s, type })),
    estimatedCost,
    policyResult: { status: policyResult.status, summary: policyResult.summary, checks: policyResult.checks },
    status: status === 'Pending' ? 'Pending' : status === 'Rejected' ? 'Rejected' : 'Approved',
    managerComment: status === 'Rejected' ? managerComment : '',
    decidedBy: status === 'Pending' ? null : employee.manager._id,
    decidedAt: status === 'Pending' ? null : decidedAt,
    createdAt,
  });

  // Build booking timeline based on final booking status
  const timeline = [];
  const push = (statusLabel, at, note = '') => timeline.push({ status: statusLabel, at, note });
  push('Request Created', createdAt);
  push('Policy Checked', plusHours(createdAt, 1), policyResult.summary);
  push('Pending Approval', plusHours(createdAt, 2));

  let bookingStatus = 'Pending';
  if (status === 'Approved' || status === 'Ticketed' || status === 'Cancelled') {
    bookingStatus = status === 'Approved' ? 'Approved' : status === 'Ticketed' ? 'Ticketed' : 'Cancelled';
    push('Approved', decidedAt, `Approved by ${employee.manager.name}`);
    if (bookingStatus === 'Ticketed') push('Ticketed', ticketedAt, 'E-ticket issued');
    if (bookingStatus === 'Cancelled') push('Cancelled', plusDays(decidedAt, 1), cancelledReason);
  } else if (status === 'Rejected') {
    bookingStatus = 'Rejected';
    push('Rejected', decidedAt, managerComment);
  }

  const booking = await Booking.create({
    bookingRef: nextBookingRef(),
    request: request._id,
    employee: employee.user._id,
    manager: employee.manager._id,
    travelType: statuses,
    origin: origin,
    destination: destination,
    departureDate: depDate,
    returnDate: retDate,
    passengers,
    provider: Object.values(selections)[0]?.provider || '',
    providerRef: Object.values(selections)[0]?.providerRef || '',
    fare: estimatedCost,
    currency: 'INR',
    policyResult: { status: policyResult.status, summary: policyResult.summary, checks: policyResult.checks },
    status: bookingStatus,
    managerComment: status === 'Rejected' ? managerComment : '',
    cancelledReason: bookingStatus === 'Cancelled' ? cancelledReason : '',
    cancelledBy: bookingStatus === 'Cancelled' ? employee.user._id : null,
    ticketedAt: bookingStatus === 'Ticketed' ? ticketedAt : null,
    cancelledAt: bookingStatus === 'Cancelled' ? plusDays(decidedAt, 1) : null,
    bookedAt: createdAt,
    timeline,
  });

  return { request, booking, policyResult };
}

async function seedUsers() {
  const managerByEmail = {};
  for (const u of USER_SEED) {
    const hashed = await bcrypt.hash(u.password, 10);
    const manager = u.managerEmail ? managerByEmail[u.managerEmail] : null;
    const user = await User.create({
      name: u.name,
      email: u.email,
      password: hashed,
      role: u.role,
      employeeId: u.employeeId,
      designation: u.designation,
      department: u.department,
      salaryBand: u.salaryBand,
      manager: manager ? manager._id : null,
    });
    managerByEmail[u.email] = user;
    if (u.role === 'employee') {
      employees.push({ user, manager });
    }
  }
  console.log(`  users: ${await User.countDocuments()} (${employees.length} employees)`);
}

export async function seedDatabase() {
  const now = new Date();
  const start = Date.now();
  console.log('[seed] Starting SUNRISE seed...');

  // Policies
  for (const p of POLICY_SEED) {
    const doc = await TravelPolicy.create(p);
    policies[doc.salaryBand] = doc;
  }
  console.log(`  policies: ${await TravelPolicy.countDocuments()}`);

  // Users
  await seedUsers();

  // Catalogues
  flightCatalog = await Flight.insertMany(FLIGHT_SEED);
  hotelCatalog = await Hotel.insertMany(HOTEL_SEED);
  trainCatalog = await Train.insertMany(TRAIN_SEED);
  console.log(
    `  catalogue: ${flightCatalog.length} flights, ${hotelCatalog.length} hotels, ${trainCatalog.length} trains`
  );

  const byEmail = (email) => employees.find((e) => e.user.email === email);

  // ---------------------------------------------------------------
  // HISTORY: ticketed & cancelled bookings across the past 6 months
  // ---------------------------------------------------------------
  const history = [
    // [employeeEmail, purpose, origin, destination, travel[], class, hotelStar, nights, railClass, createdDaysAgo, departOffset, status, comment, cancelReason]
    ['vikram.singh@sunrise.com', 'Client Meeting', 'Mumbai', 'Delhi', ['flight', 'hotel'], 'Economy', 3, 2, null, 172, 1, 'Ticketed'],
    ['ananya.iyer@sunrise.com', 'Business Conference', 'Mumbai', 'Bengaluru', ['flight', 'hotel'], 'Economy', 3, 3, null, 160, 2, 'Ticketed'],
    ['sneha.patil@sunrise.com', 'Training', 'Mumbai', 'Pune', ['railway'], null, null, null, 'CC', 148, 1, 'Ticketed'],
    ['divya.reddy@sunrise.com', 'Project Work', 'Mumbai', 'Hyderabad', ['flight', 'hotel'], 'Premium Economy', 4, 2, null, 135, 2, 'Ticketed'],
    ['arjun.nair@sunrise.com', 'Office Visit', 'Mumbai', 'Pune', ['railway'], null, null, null, 'Sleeper', 120, 1, 'Ticketed'],
    ['karthik.menon@sunrise.com', 'Business Development', 'Mumbai', 'Delhi', ['flight', 'hotel'], 'Premium Economy', 4, 3, null, 108, 1, 'Ticketed'],
    ['rohan.gupta@sunrise.com', 'Business Conference', 'Mumbai', 'Bengaluru', ['flight', 'hotel'], 'Economy', 4, 2, null, 95, 2, 'Ticketed'],
    ['priyanka.das@sunrise.com', 'Training', 'Mumbai', 'Pune', ['railway'], null, null, null, '3AC', 88, 1, 'Ticketed'],
    ['sanjay.verma@sunrise.com', 'Client Meeting', 'Mumbai', 'Chennai', ['flight', 'hotel'], 'Economy', 3, 2, null, 74, 2, 'Ticketed'],
    ['meera.krishnan@sunrise.com', 'Sales Visit', 'Delhi', 'Mumbai', ['flight', 'hotel'], 'Economy', 4, 2, null, 60, 1, 'Ticketed'],
    ['aditya.joshi@sunrise.com', 'Project Work', 'Mumbai', 'Hyderabad', ['flight', 'hotel'], 'Economy', 3, 3, null, 48, 1, 'Ticketed'],
    ['ananya.iyer@sunrise.com', 'Business Conference', 'Mumbai', 'Delhi', ['flight', 'hotel'], 'Economy', 3, 2, null, 36, 2, 'Ticketed'],
    ['rohan.gupta@sunrise.com', 'Client Meeting', 'Delhi', 'Bengaluru', ['flight', 'hotel'], 'Economy', 4, 2, null, 25, 1, 'Ticketed'],
    ['karthik.menon@sunrise.com', 'Business Development', 'Mumbai', 'Chennai', ['flight', 'hotel'], 'Premium Economy', 4, 2, null, 15, 3, 'Ticketed'],
    ['sneha.patil@sunrise.com', 'Training', 'Mumbai', 'Delhi', ['flight', 'hotel'], 'Economy', 3, 2, null, 8, 2, 'Ticketed'],
    // Upcoming ticketed trips (for "upcoming trips" on dashboards)
    ['vikram.singh@sunrise.com', 'Client Meeting', 'Mumbai', 'Delhi', ['flight', 'hotel'], 'Economy', 3, 2, null, 5, 5, 'Ticketed'],
    ['ananya.iyer@sunrise.com', 'Business Conference', 'Mumbai', 'Bengaluru', ['flight', 'hotel'], 'Economy', 3, 2, null, 4, 8, 'Ticketed'],
    ['divya.reddy@sunrise.com', 'Project Work', 'Mumbai', 'Hyderabad', ['flight', 'hotel'], 'Premium Economy', 4, 3, null, 6, 12, 'Ticketed'],
    // Cancelled
    ['sanjay.verma@sunrise.com', 'Sales Visit', 'Mumbai', 'Pune', ['railway'], null, null, null, 'CC', 55, 1, 'Cancelled', '', 'Meeting rescheduled by client'],
    ['meera.krishnan@sunrise.com', 'Client Meeting', 'Mumbai', 'Delhi', ['flight', 'hotel'], 'Economy', 4, 2, null, 42, 2, 'Cancelled', '', 'Trip cancelled due to budget review'],
    ['arjun.nair@sunrise.com', 'Training', 'Mumbai', 'Bengaluru', ['flight', 'hotel'], 'Economy', 3, 2, null, 20, 1, 'Cancelled', '', 'Illness – medical leave'],
    ['aditya.joshi@sunrise.com', 'Office Visit', 'Mumbai', 'Pune', ['railway'], null, null, null, '3AC', 12, 1, 'Cancelled', '', 'Train cancelled by railway'],
    // Rejected (policy violations + manager rejections)
    ['arjun.nair@sunrise.com', 'Client Meeting', 'Mumbai', 'Delhi', ['flight', 'hotel'], 'Business', 2, 2, null, 130, 3, 'Rejected', 'Business class is not permitted for Band A. Please rebook in Economy within the ₹8,000 limit.', ''],
    ['sneha.patil@sunrise.com', 'Business Conference', 'Mumbai', 'Delhi', ['flight', 'hotel'], 'Premium Economy', 3, 2, null, 70, 2, 'Rejected', 'Premium Economy exceeds the Band B entitlement. Economy class only.', ''],
    ['priyanka.das@sunrise.com', 'Training', 'Mumbai', 'Bengaluru', ['hotel'], null, 4, 2, null, 30, 1, 'Rejected', '4-star hotel exceeds the Band A 2-star limit.', ''],
    // Today's activity (admin "today's bookings")
    ['vikram.singh@sunrise.com', 'Client Meeting', 'Mumbai', 'Delhi', ['flight', 'hotel'], 'Economy', 3, 2, null, 0, 1, 'Ticketed'],
    ['sneha.patil@sunrise.com', 'Business Conference', 'Mumbai', 'Delhi', ['flight', 'hotel'], 'Economy', 3, 2, null, 0, 2, 'Cancelled', '', 'Conference postponed'],
    // Pending (approval queue for the demo)
    ['employee@sunrise.com', 'Client Meeting', 'Mumbai', 'Delhi', ['flight', 'hotel'], 'Economy', 2, 2, null, 2, 3, 'Pending'],
    ['karthik.menon@sunrise.com', 'Business Development', 'Mumbai', 'Bengaluru', ['flight', 'hotel'], 'Premium Economy', 4, 2, null, 1, 2, 'Pending'],
    ['divya.reddy@sunrise.com', 'Project Work', 'Mumbai', 'Hyderabad', ['flight', 'hotel'], 'Premium Economy', 4, 2, null, 1, 4, 'Pending'],
  ];

  for (const h of history) {
    const emp = byEmail(h[0]);
    if (!emp) continue;
    await createTrip({
      employee: emp,
      purpose: h[1],
      origin: h[2],
      destination: h[3],
      travel: h[4],
      travelClass: h[5],
      hotelStar: h[6],
      nights: h[7],
      railClass: h[8],
      createdDaysAgo: h[9],
      departDaysAfter: h[10],
      status: h[11],
      managerComment: h[12] || '',
      cancelledReason: h[13] || '',
    });
  }

  console.log(
    `  travel: ${await TravelRequest.countDocuments()} requests, ${await Booking.countDocuments()} bookings`
  );

  // ---------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------
  const pending = await TravelRequest.find({ status: 'Pending' }).populate('employee manager');
  for (const r of pending) {
    await Notification.create({
      user: r.manager._id,
      title: 'New travel approval request',
      message: `New travel approval request from ${r.employee.name} (${r.origin} → ${r.destination}).`,
      type: 'request',
      entity: 'TravelRequest',
      entityId: r._id,
      createdAt: r.createdAt,
    });
  }

  const recentApproved = await TravelRequest.find({ status: 'Approved' }).populate('employee').limit(6);
  for (const r of recentApproved) {
    await Notification.create({
      user: r.employee._id,
      title: 'Travel request approved',
      message: `Your travel request ${r.requestId} has been approved.`,
      type: 'approval',
      entity: 'TravelRequest',
      entityId: r._id,
      createdAt: plusHours(r.decidedAt, 1),
    });
  }

  const recentRejected = await TravelRequest.find({ status: 'Rejected' }).populate('employee').limit(3);
  for (const r of recentRejected) {
    await Notification.create({
      user: r.employee._id,
      title: 'Travel request rejected',
      message: `Your travel request ${r.requestId} has been rejected. ${r.managerComment || ''}`,
      type: 'rejection',
      entity: 'TravelRequest',
      entityId: r._id,
      createdAt: plusHours(r.decidedAt, 1),
    });
  }

  console.log(`  notifications: ${await Notification.countDocuments()}`);

  // ---------------------------------------------------------------
  // Audit log
  // ---------------------------------------------------------------
  const requests = await TravelRequest.find().populate('employee manager');
  const audit = [];
  for (const r of requests) {
    audit.push({
      user: r.employee._id,
      userName: r.employee.name,
      role: 'employee',
      action: 'REQUEST_CREATED',
      entity: 'TravelRequest',
      entityId: r._id,
      entityRef: r.requestId,
      metadata: { origin: r.origin, destination: r.destination, cost: r.estimatedCost, purpose: r.travelPurpose },
      createdAt: r.createdAt,
    });
    if (r.status !== 'Pending') {
      audit.push({
        user: r.manager._id,
        userName: r.manager.name,
        role: 'manager',
        action: r.status === 'Approved' ? 'APPROVED' : 'REJECTED',
        entity: 'TravelRequest',
        entityId: r._id,
        entityRef: r.requestId,
        metadata: { comment: r.managerComment || '' },
        createdAt: r.decidedAt,
      });
    }
  }
  for (const u of await User.find()) {
    audit.push({
      user: u._id,
      userName: u.name,
      role: u.role,
      action: 'LOGIN',
      entity: 'User',
      entityId: u._id,
      metadata: { method: 'demo-session' },
      createdAt: daysAgo(Math.floor(Math.random() * 20) + 1),
    });
  }
  await AuditLog.insertMany(audit);
  console.log(`  audit logs: ${await AuditLog.countDocuments()}`);

  console.log(`[seed] Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

export async function resetDatabase() {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  console.log('[seed] Cleared all collections');
}

// Allow running directly: node src/seed/seed.js [--reset]
const isMain = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isMain) {
  const run = async () => {
    await connectDB();
    if (process.argv.includes('--reset')) await resetDatabase();
    const userCount = await User.countDocuments();
    if (userCount > 0 && !process.argv.includes('--reset')) {
      console.log('[seed] Database already has data. Use `npm run seed:reset` to reseed.');
      process.exit(0);
    }
    await seedDatabase();
    process.exit(0);
  };
  run().catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  });
}
