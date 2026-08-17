import mongoose from 'mongoose';

/**
 * Mock flight catalogue. Each record is a scheduled route+class offering.
 * The search service generates per-date results from these records.
 */
const flightSchema = new mongoose.Schema(
  {
    airline: { type: String, required: true },
    flightNumber: { type: String, required: true },
    fromCode: { type: String, required: true },
    fromCity: { type: String, required: true },
    toCode: { type: String, required: true },
    toCity: { type: String, required: true },
    depTime: { type: String, required: true }, // HH:mm
    arrTime: { type: String, required: true }, // HH:mm
    durationMin: { type: Number, required: true },
    stops: { type: Number, required: true, default: 0 },
    travelClass: { type: String, enum: ['Economy', 'Premium Economy', 'Business'], required: true },
    fare: { type: Number, required: true }, // INR per passenger
    baggage: { type: String, default: '15 kg check-in' },
    refundable: { type: Boolean, default: false },
    seatsTotal: { type: Number, default: 180 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

flightSchema.index({ fromCode: 1, toCode: 1, travelClass: 1 });

const Flight = mongoose.model('Flight', flightSchema);
export default Flight;
