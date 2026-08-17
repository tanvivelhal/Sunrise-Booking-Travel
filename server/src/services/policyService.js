import { TravelPolicy } from '../models/index.js';

export const POLICY_STATUS = {
  COMPLIANT: 'COMPLIANT',
  WARNING: 'WARNING',
  VIOLATION: 'VIOLATION',
};

/**
 * Corporate travel policy engine.
 *
 * Real business rule: travel entitlement depends on the employee's salary
 * band. The engine compares the selected travel (class, hotel star rating,
 * rail class, fare) against the band policy and produces a status plus a
 * human-readable reason and a recommended alternative.
 */

export async function getPolicyForBand(salaryBand) {
  const policy = await TravelPolicy.findOne({ salaryBand });
  if (!policy) {
    throw new Error(`No travel policy configured for salary band ${salaryBand}`);
  }
  return policy;
}

function decide(statuses) {
  if (statuses.includes(POLICY_STATUS.VIOLATION)) return POLICY_STATUS.VIOLATION;
  if (statuses.includes(POLICY_STATUS.WARNING)) return POLICY_STATUS.WARNING;
  return POLICY_STATUS.COMPLIANT;
}

/**
 * Validate a flight selection.
 * @param {object} policy TravelPolicy doc
 * @param {object} flight { travelClass, fare }
 */
function checkFlight(policy, flight) {
  if (!flight) return null;
  const cls = flight.travelClass || flight.class || '';
  const fare = Number(flight.fare) || 0;
  const allowed = policy.flightClasses || [];

  const allowedLabel = allowed.join(' / ') || 'Economy';

  if (!allowed.includes(cls)) {
    return {
      item: 'Flight',
      status: POLICY_STATUS.VIOLATION,
      message: `${policy.bandLabel} employees are eligible for ${allowedLabel} class travel only. ${cls} class is not permitted.`,
      recommended: `Recommended: ${allowed[0] || 'Economy'} class`,
    };
  }
  if (fare > policy.maxFlightFare) {
    return {
      item: 'Flight',
      status: POLICY_STATUS.WARNING,
      message: `Flight fare of ₹${fare.toLocaleString('en-IN')} is above the ${policy.bandLabel} limit of ₹${policy.maxFlightFare.toLocaleString('en-IN')}.`,
      recommended: `Recommended: a flight within ₹${policy.maxFlightFare.toLocaleString('en-IN')}`,
    };
  }
  return {
    item: 'Flight',
    status: POLICY_STATUS.COMPLIANT,
    message: `${cls} class within ${policy.bandLabel} entitlement.`,
  };
}

/**
 * Validate a hotel selection.
 * @param {object} hotel { starRating, pricePerNight }
 */
function checkHotel(policy, hotel) {
  if (!hotel) return null;
  const stars = Number(hotel.starRating) || 0;
  const price = Number(hotel.pricePerNight) || 0;

  if (stars > policy.hotelStarMax) {
    return {
      item: 'Hotel',
      status: POLICY_STATUS.VIOLATION,
      message: `${policy.bandLabel} employees may stay in hotels up to ${policy.hotelStarMax}-star only. Selected hotel is ${stars}-star.`,
      recommended: `Recommended: a ${policy.hotelStarMax}-star hotel or lower`,
    };
  }
  if (price > policy.maxHotelPerNight) {
    return {
      item: 'Hotel',
      status: POLICY_STATUS.WARNING,
      message: `Hotel rate of ₹${price.toLocaleString('en-IN')}/night is above the ${policy.bandLabel} limit of ₹${policy.maxHotelPerNight.toLocaleString('en-IN')}/night.`,
      recommended: `Recommended: a hotel within ₹${policy.maxHotelPerNight.toLocaleString('en-IN')}/night`,
    };
  }
  return {
    item: 'Hotel',
    status: POLICY_STATUS.COMPLIANT,
    message: `${stars}-star hotel within ${policy.bandLabel} entitlement.`,
  };
}

/**
 * Validate a railway selection.
 * @param {object} rail { className, fare }
 */
function checkRail(policy, rail) {
  if (!rail) return null;
  const cls = rail.className || rail.class || '';
  const fare = Number(rail.fare) || 0;
  const allowed = policy.railClasses || [];
  const allowedLabel = allowed.join(' / ') || 'Sleeper';

  if (!allowed.includes(cls)) {
    return {
      item: 'Railway',
      status: POLICY_STATUS.VIOLATION,
      message: `${policy.bandLabel} employees are eligible for ${allowedLabel} on rail only. ${cls} class is not permitted.`,
      recommended: `Recommended: ${allowed[0] || 'Sleeper'}`,
    };
  }
  if (fare > policy.maxRailFare) {
    return {
      item: 'Railway',
      status: POLICY_STATUS.WARNING,
      message: `Rail fare of ₹${fare.toLocaleString('en-IN')} is above the ${policy.bandLabel} limit of ₹${policy.maxRailFare.toLocaleString('en-IN')}.`,
      recommended: `Recommended: a train within ₹${policy.maxRailFare.toLocaleString('en-IN')}`,
    };
  }
  return {
    item: 'Railway',
    status: POLICY_STATUS.COMPLIANT,
    message: `${cls} class within ${policy.bandLabel} entitlement.`,
  };
}

/**
 * Validate a set of selections (flight/hotel/railway) against a band policy.
 * @param {object} policy TravelPolicy doc
 * @param {object} selections { flight?, hotel?, railway? }
 */
export function validateSelections(policy, selections = {}) {
  const checks = [];
  if (selections.flight) {
    const r = checkFlight(policy, selections.flight);
    if (r) checks.push(r);
  }
  if (selections.hotel) {
    const r = checkHotel(policy, selections.hotel);
    if (r) checks.push(r);
  }
  if (selections.railway) {
    const r = checkRail(policy, selections.railway);
    if (r) checks.push(r);
  }
  if (checks.length === 0) {
    checks.push({
      item: 'Travel',
      status: POLICY_STATUS.COMPLIANT,
      message: 'No travel selections to validate.',
    });
  }
  const status = decide(checks.map((c) => c.status));
  const summary =
    status === POLICY_STATUS.COMPLIANT
      ? 'Within company policy'
      : status === POLICY_STATUS.WARNING
        ? 'Above recommended limit'
        : 'Policy violation';
  return { status, summary, checks };
}

/**
 * Validate selections for a given user (uses their salary band).
 * Used by the /api/policy/validate endpoint and request creation.
 */
export async function validateForUser(user, selections) {
  const policy = await getPolicyForBand(user.salaryBand);
  const result = validateSelections(policy, selections);
  return { ...result, salaryBand: user.salaryBand, bandLabel: policy.bandLabel };
}

export function estimateTotalCost(selections = {}, passengers = 1) {
  let total = 0;
  if (selections.flight) total += (Number(selections.flight.fare) || 0) * passengers;
  if (selections.hotel) {
    const nights = Number(selections.hotel.nights) || 1;
    total += (Number(selections.hotel.pricePerNight) || 0) * nights;
  }
  if (selections.railway) total += (Number(selections.railway.fare) || 0) * passengers;
  return Math.round(total);
}
