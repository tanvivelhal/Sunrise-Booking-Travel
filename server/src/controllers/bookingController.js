import mongoose from 'mongoose';
import { Booking, TravelRequest, Notification } from '../models/index.js';
import { assertBookingTransition } from '../services/statusService.js';
import { writeAudit } from '../services/auditService.js';

const populate = [
  { path: 'employee', select: 'name email designation department salaryBand employeeId' },
  { path: 'manager', select: 'name email' },
  { path: 'request', select: 'requestId travelPurpose purposeNote status managerComment' },
];

/** GET /api/bookings — manager: team bookings, admin: all */
export const listAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'manager') filter.manager = req.user._id;
    const bookings = await Booking.find(filter).populate(populate).sort({ createdAt: -1 });
    res.json({ count: bookings.length, results: bookings });
  } catch (err) {
    next(err);
  }
};

/** GET /api/bookings/my — employee's own bookings */
export const listMy = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ employee: req.user._id })
      .populate(populate)
      .sort({ createdAt: -1 });
    res.json({ count: bookings.length, results: bookings });
  } catch (err) {
    next(err);
  }
};

/** GET /api/bookings/:id */
export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid booking id.' });
    }
    const booking = await Booking.findById(id).populate(populate);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    const isOwner = String(booking.employee._id) === String(req.user._id);
    const isManager = String(booking.manager?._id) === String(req.user._id);
    if (!isOwner && !isManager && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not have access to this booking.' });
    }
    res.json({ booking });
  } catch (err) {
    next(err);
  }
};

/** POST /api/bookings/:id/ticket — admin (or manager) marks a booking as ticketed */
export const ticket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('employee');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    if (req.user.role === 'employee') {
      return res.status(403).json({ message: 'Only managers or administrators can ticket bookings.' });
    }
    assertBookingTransition(booking.status, 'Ticketed');

    booking.status = 'Ticketed';
    booking.ticketedAt = new Date();
    booking.timeline.push({ status: 'Ticketed', at: new Date(), note: `E-ticket issued by ${req.user.name}` });
    await booking.save();

    await Notification.create({
      user: booking.employee._id,
      title: 'Booking ticketed',
      message: `Your booking ${booking.bookingRef} has been ticketed. Travel documents are ready.`,
      type: 'ticketed',
      entity: 'Booking',
      entityId: booking._id,
    });
    await writeAudit({
      user: req.user,
      action: 'BOOKING_TICKETED',
      entity: 'Booking',
      entityId: booking._id,
      entityRef: booking.bookingRef,
      metadata: { status: 'Ticketed' },
    });

    res.json({ message: 'Booking ticketed.', booking });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/bookings/:id/cancel — employee owner or admin; reason required */
export const cancel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reason = (req.body && req.body.reason ? req.body.reason : '').trim();
    if (!reason) {
      return res.status(400).json({ message: 'A cancellation reason is required.' });
    }
    const booking = await Booking.findById(id).populate('employee manager');
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    const isOwner = String(booking.employee._id) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the booking owner or an administrator can cancel.' });
    }
    assertBookingTransition(booking.status, 'Cancelled');

    booking.status = 'Cancelled';
    booking.cancelledReason = reason;
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    booking.timeline.push({ status: 'Cancelled', at: new Date(), note: reason });
    await booking.save();

    const request = await TravelRequest.findById(booking.request);
    if (request && request.status === 'Approved') {
      request.status = 'Rejected';
      request.managerComment = `Booking cancelled: ${reason}`;
      await request.save();
    }

    await Notification.create({
      user: booking.manager._id,
      title: 'Booking cancelled',
      message: `${booking.employee.name} cancelled booking ${booking.bookingRef}. ${reason}`,
      type: 'cancellation',
      entity: 'Booking',
      entityId: booking._id,
    });
    await writeAudit({
      user: req.user,
      action: 'BOOKING_CANCELLED',
      entity: 'Booking',
      entityId: booking._id,
      entityRef: booking.bookingRef,
      metadata: { reason },
    });

    res.json({ message: 'Booking cancelled.', booking });
  } catch (err) {
    next(err);
  }
};
