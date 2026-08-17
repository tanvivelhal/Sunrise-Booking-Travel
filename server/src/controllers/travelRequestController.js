import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import { TravelRequest, Booking, Notification, User } from '../models/index.js';
import { validateForUser, estimateTotalCost } from '../services/policyService.js';
import { assertBookingTransition } from '../services/statusService.js';
import { writeAudit } from '../services/auditService.js';
import { TRAVEL_PURPOSES } from '../config/constants.js';

const requestPopulate = [
  { path: 'employee', select: 'name email designation department salaryBand employeeId' },
  { path: 'manager', select: 'name email designation department' },
  { path: 'decidedBy', select: 'name' },
];

const bookingPopulate = [
  { path: 'employee', select: 'name email designation department salaryBand employeeId' },
  { path: 'manager', select: 'name email' },
  { path: 'request', select: 'requestId travelPurpose purposeNote status' },
];

/** Next sequential TR-XXXX id (max numeric suffix + 1). */
async function nextRequestId() {
  const rows = await TravelRequest.aggregate([
    { $project: { num: { $toInt: { $arrayElemAt: [{ $split: ['$requestId', '-'] }, 1] } } } },
    { $sort: { num: -1 } },
    { $limit: 1 },
  ]);
  const n = rows[0]?.num || 0;
  return `TR-${String(n + 1).padStart(4, '0')}`;
}

/** Next sequential BK-XXXX id (max numeric suffix + 1). */
async function nextBookingRef() {
  const rows = await Booking.aggregate([
    { $project: { num: { $toInt: { $arrayElemAt: [{ $split: ['$bookingRef', '-'] }, 1] } } } },
    { $sort: { num: -1 } },
    { $limit: 1 },
  ]);
  const n = rows[0]?.num || 0;
  return `BK-${String(n + 1).padStart(4, '0')}`;
}

/** POST /api/travel-requests — employee creates a request (no direct booking). */
export const create = [
  body('travelPurpose').isIn(TRAVEL_PURPOSES).withMessage('A valid travel purpose is required.'),
  body('origin').notEmpty().withMessage('Origin is required.'),
  body('destination').notEmpty().withMessage('Destination is required.'),
  body('departureDate').notEmpty().withMessage('Departure date is required.'),
  body('selections').isArray({ min: 1 }).withMessage('Select at least one travel option.'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }
      const employee = req.user;
      const { travelPurpose, purposeNote, origin, destination, departureDate, returnDate, tripType, selections } = req.body;

      // ---- 1. Normalize selections ----
      const normalized = selections.map((s) => {
        const fare = s.type === 'hotel' ? Number(s.fare) || 0 : Number(s.fare) || 0;
        return {
          type: s.type,
          provider: s.provider || '',
          providerRef: s.providerRef || '',
          class: s.class || '',
          origin: s.origin || '',
          destination: s.destination || '',
          departureDate: s.departureDate || s.date || null,
          returnDate: s.returnDate || null,
          fare,
          unitFare: Number(s.unitFare) || fare,
          passengers: Number(s.passengers) || 1,
          nights: Number(s.nights) || 0,
          details: s.details || {},
        };
      });

      // ---- 2. Run the real policy engine ----
      const selectionsByType = {};
      for (const s of normalized) selectionsByType[s.type] = s;
      const policyResult = await validateForUser(employee, selectionsByType);
      const estimatedCost = estimateTotalCost(selectionsByType, 1);

      // ---- 3. Manager ----
      const manager = employee.manager
        ? await User.findById(employee.manager)
        : await User.findOne({ role: 'manager', department: employee.department });
      if (!manager) {
        return res.status(400).json({ message: 'No manager assigned. Please contact your administrator.' });
      }

      // ---- 4. Create request (Pending) + linked booking (Pending) ----
      const request = await TravelRequest.create({
        requestId: await nextRequestId(),
        employee: employee._id,
        manager: manager._id,
        travelPurpose,
        purposeNote: purposeNote || '',
        tripType: tripType || 'one-way',
        origin,
        destination,
        departureDate: new Date(departureDate),
        returnDate: returnDate ? new Date(returnDate) : null,
        selections: normalized,
        estimatedCost,
        policyResult: {
          status: policyResult.status,
          summary: policyResult.summary,
          checks: policyResult.checks,
        },
        status: 'Pending',
      });

      const booking = await Booking.create({
        bookingRef: await nextBookingRef(),
        request: request._id,
        employee: employee._id,
        manager: manager._id,
        travelType: normalized.length > 1 ? 'multi' : normalized[0].type,
        origin,
        destination,
        departureDate: new Date(departureDate),
        returnDate: returnDate ? new Date(returnDate) : null,
        passengers: 1,
        provider: normalized[0]?.provider || '',
        providerRef: normalized[0]?.providerRef || '',
        fare: estimatedCost,
        currency: 'INR',
        policyResult: {
          status: policyResult.status,
          summary: policyResult.summary,
          checks: policyResult.checks,
        },
        status: 'Pending',
        timeline: [
          { status: 'Request Created', at: new Date() },
          { status: 'Policy Checked', at: new Date(), note: policyResult.summary },
          { status: 'Pending Approval', at: new Date() },
        ],
      });

      // ---- 5. Notify manager + audit ----
      await Notification.create({
        user: manager._id,
        title: 'New travel approval request',
        message: `New travel approval request from ${employee.name} (${origin} → ${destination}).`,
        type: 'request',
        entity: 'TravelRequest',
        entityId: request._id,
      });
      await writeAudit({
        user: employee,
        action: 'REQUEST_CREATED',
        entity: 'TravelRequest',
        entityId: request._id,
        entityRef: request.requestId,
        metadata: { origin, destination, cost: estimatedCost, purpose: travelPurpose, policy: policyResult.status },
      });

      res.status(201).json({
        message: 'Travel request submitted successfully.',
        request,
        booking,
        policyResult,
      });
    } catch (err) {
      next(err);
    }
  },
];

/** GET /api/travel-requests/my — employee's own requests */
export const listMy = async (req, res, next) => {
  try {
    const requests = await TravelRequest.find({ employee: req.user._id })
      .populate(requestPopulate)
      .sort({ createdAt: -1 });
    res.json({ count: requests.length, results: requests });
  } catch (err) {
    next(err);
  }
};

/** GET /api/travel-requests/pending — manager's approval queue */
export const listPending = async (req, res, next) => {
  try {
    const filter = { status: 'Pending' };
    if (req.user.role === 'manager') filter.manager = req.user._id;
    const requests = await TravelRequest.find(filter)
      .populate(requestPopulate)
      .sort({ createdAt: 1 });
    res.json({ count: requests.length, results: requests });
  } catch (err) {
    next(err);
  }
};

/** GET /api/travel-requests — role-scoped list (manager: team, admin: all) */
export const listAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'manager') filter.manager = req.user._id;
    const requests = await TravelRequest.find(filter)
      .populate(requestPopulate)
      .sort({ createdAt: -1 });
    res.json({ count: requests.length, results: requests });
  } catch (err) {
    next(err);
  }
};

/** GET /api/travel-requests/:id — owner, their manager, or admin */
export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request id.' });
    }
    const request = await TravelRequest.findById(id).populate(requestPopulate);
    if (!request) return res.status(404).json({ message: 'Travel request not found.' });

    const isOwner = String(request.employee._id) === String(req.user._id);
    const isManager = String(request.manager?._id) === String(req.user._id);
    if (!isOwner && !isManager && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have access to this request.' });
    }
    const booking = await Booking.findOne({ request: request._id }).populate(bookingPopulate);
    res.json({ request, booking });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/travel-requests/:id/approve — manager approves */
export const approve = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await TravelRequest.findById(id).populate('employee manager');
    if (!request) return res.status(404).json({ message: 'Travel request not found.' });

    if (req.user.role !== 'admin' && String(request.manager?._id) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the assigned manager can approve this request.' });
    }
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: `This request is already ${request.status}.` });
    }

    request.status = 'Approved';
    request.decidedBy = req.user._id;
    request.decidedAt = new Date();
    await request.save();

    const booking = await Booking.findOne({ request: request._id });
    if (booking) {
      assertBookingTransition(booking.status, 'Approved');
      booking.status = 'Approved';
      booking.managerComment = '';
      booking.timeline.push({ status: 'Approved', at: new Date(), note: `Approved by ${req.user.name}` });
      await booking.save();

      // Simulated airline ticketing: ticketed ~10s after approval so the
      // demo shows Approved -> Ticketed. Admin can also ticket manually.
      scheduleTicketing(booking._id);
    }

    await Notification.create({
      user: request.employee._id,
      title: 'Travel request approved',
      message: `Your travel request ${request.requestId} has been approved.`,
      type: 'approval',
      entity: 'TravelRequest',
      entityId: request._id,
    });
    await writeAudit({
      user: req.user,
      action: 'APPROVED',
      entity: 'TravelRequest',
      entityId: request._id,
      entityRef: request.requestId,
      metadata: { employee: request.employee.name },
    });

    res.json({ message: 'Travel request approved.', request, booking });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/travel-requests/:id/reject — manager rejects (comment required) */
export const reject = [
  body('comment').trim().isLength({ min: 3 }).withMessage('A manager comment is required when rejecting.'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }
      const { id } = req.params;
      const request = await TravelRequest.findById(id).populate('employee manager');
      if (!request) return res.status(404).json({ message: 'Travel request not found.' });

      if (req.user.role !== 'admin' && String(request.manager?._id) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Only the assigned manager can reject this request.' });
      }
      if (request.status !== 'Pending') {
        return res.status(400).json({ message: `This request is already ${request.status}.` });
      }

      request.status = 'Rejected';
      request.managerComment = req.body.comment;
      request.decidedBy = req.user._id;
      request.decidedAt = new Date();
      await request.save();

      const booking = await Booking.findOne({ request: request._id });
      if (booking) {
        assertBookingTransition(booking.status, 'Rejected');
        booking.status = 'Rejected';
        booking.managerComment = req.body.comment;
        booking.timeline.push({ status: 'Rejected', at: new Date(), note: req.body.comment });
        await booking.save();
      }

      await Notification.create({
        user: request.employee._id,
        title: 'Travel request rejected',
        message: `Your travel request ${request.requestId} has been rejected. ${req.body.comment}`,
        type: 'rejection',
        entity: 'TravelRequest',
        entityId: request._id,
      });
      await writeAudit({
        user: req.user,
        action: 'REJECTED',
        entity: 'TravelRequest',
        entityId: request._id,
        entityRef: request.requestId,
        metadata: { comment: req.body.comment },
      });

      res.json({ message: 'Travel request rejected.', request, booking });
    } catch (err) {
      next(err);
    }
  },
];

/** In-process timer simulating the airline ticketing step after approval. */
function scheduleTicketing(bookingId) {
  const delay = 10 * 1000;
  setTimeout(async () => {
    try {
      const booking = await Booking.findById(bookingId).populate('employee manager');
      if (!booking || booking.status !== 'Approved') return;
      booking.status = 'Ticketed';
      booking.ticketedAt = new Date();
      booking.timeline.push({ status: 'Ticketed', at: new Date(), note: 'E-ticket issued automatically' });
      await booking.save();

      const request = await TravelRequest.findById(booking.request);
      if (request) {
        await Notification.create({
          user: booking.employee._id,
          title: 'Booking ticketed',
          message: `Your booking ${booking.bookingRef} has been ticketed. Travel documents are ready.`,
          type: 'ticketed',
          entity: 'Booking',
          entityId: booking._id,
        });
        await writeAudit({
          user: booking.employee,
          action: 'BOOKING_TICKETED',
          entity: 'Booking',
          entityId: booking._id,
          entityRef: booking.bookingRef,
          metadata: { requestId: request.requestId },
        });
      }
    } catch (err) {
      console.error('[ticketing] failed:', err.message);
    }
  }, delay);
}
