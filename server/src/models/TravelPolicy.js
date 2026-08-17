import mongoose from 'mongoose';

/**
 * Corporate travel policy keyed by salary band.
 * Entitlements are evaluated by the policy engine service.
 */
const travelPolicySchema = new mongoose.Schema(
  {
    salaryBand: { type: String, enum: ['A', 'B', 'C', 'D'], required: true, unique: true },
    bandLabel: { type: String, required: true }, // e.g. "Band A – Junior Executive"
    flightClasses: { type: [String], default: [] }, // e.g. ['Economy']
    hotelStarMax: { type: Number, required: true }, // max hotel star rating
    railClasses: { type: [String], default: [] }, // e.g. ['Sleeper', '3AC']
    maxFlightFare: { type: Number, required: true }, // INR
    maxHotelPerNight: { type: Number, required: true }, // INR
    maxRailFare: { type: Number, required: true }, // INR
    description: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const TravelPolicy = mongoose.model('TravelPolicy', travelPolicySchema);
export default TravelPolicy;
