import { TravelPolicy } from '../models/index.js';
import { writeAudit } from '../services/auditService.js';

/** GET /api/policies — authenticated users can view policies */
export const listPolicies = async (req, res, next) => {
  try {
    const policies = await TravelPolicy.find().sort({ salaryBand: 1 });
    res.json({ count: policies.length, results: policies });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/policies/:id — admin only; changes persist to MongoDB */
export const updatePolicy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const policy = await TravelPolicy.findById(id);
    if (!policy) return res.status(404).json({ message: 'Policy not found.' });

    const { flightClasses, hotelStarMax, railClasses, maxFlightFare, maxHotelPerNight, maxRailFare, description, bandLabel } = req.body;
    const original = {
      flightClasses: policy.flightClasses,
      hotelStarMax: policy.hotelStarMax,
      railClasses: policy.railClasses,
      maxFlightFare: policy.maxFlightFare,
      maxHotelPerNight: policy.maxHotelPerNight,
      maxRailFare: policy.maxRailFare,
    };

    if (bandLabel !== undefined) policy.bandLabel = bandLabel;
    if (flightClasses !== undefined) policy.flightClasses = flightClasses;
    if (hotelStarMax !== undefined) policy.hotelStarMax = Number(hotelStarMax);
    if (railClasses !== undefined) policy.railClasses = railClasses;
    if (maxFlightFare !== undefined) policy.maxFlightFare = Number(maxFlightFare);
    if (maxHotelPerNight !== undefined) policy.maxHotelPerNight = Number(maxHotelPerNight);
    if (maxRailFare !== undefined) policy.maxRailFare = Number(maxRailFare);
    if (description !== undefined) policy.description = description;
    policy.updatedBy = req.user._id;

    await policy.save();
    await writeAudit({
      user: req.user,
      action: 'POLICY_UPDATED',
      entity: 'TravelPolicy',
      entityId: policy._id,
      metadata: { band: policy.salaryBand, original, updated: { flightClasses: policy.flightClasses, hotelStarMax: policy.hotelStarMax, railClasses: policy.railClasses, maxFlightFare: policy.maxFlightFare, maxHotelPerNight: policy.maxHotelPerNight, maxRailFare: policy.maxRailFare } },
    });
    res.json({ message: 'Policy updated.', policy });
  } catch (err) {
    next(err);
  }
};
