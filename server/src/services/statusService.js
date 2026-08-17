import { BOOKING_STATUSES } from '../config/constants.js';

/**
 * Allowed booking status transitions (Project Sunrise spec).
 * Invalid transitions (Rejected -> Ticketed, Cancelled -> Approved, ...)
 * are rejected here so the workflow can never corrupt state.
 */
export const ALLOWED_BOOKING_TRANSITIONS = {
  Pending: ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['Ticketed', 'Cancelled'],
  Rejected: [],
  Ticketed: ['Cancelled'],
  Cancelled: [],
};

/** Throws with a 400-style message if the transition is invalid. */
export function assertBookingTransition(current, nextStatus) {
  if (current === nextStatus) return;
  if (!BOOKING_STATUSES.includes(nextStatus)) {
    throw Object.assign(new Error(`Invalid booking status: ${nextStatus}`), { statusCode: 400 });
  }
  const allowed = ALLOWED_BOOKING_TRANSITIONS[current] || [];
  if (!allowed.includes(nextStatus)) {
    throw Object.assign(
      new Error(`Invalid status transition: ${current} → ${nextStatus} is not permitted.`),
      { statusCode: 400 }
    );
  }
}
