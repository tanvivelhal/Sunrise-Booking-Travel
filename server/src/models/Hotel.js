import mongoose from 'mongoose';

/** Mock hotel catalogue. */
const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String, default: '' },
    starRating: { type: Number, required: true, min: 1, max: 5 },
    roomType: { type: String, required: true },
    pricePerNight: { type: Number, required: true }, // INR
    breakfastIncluded: { type: Boolean, default: false },
    amenities: { type: [String], default: [] },
    cancellationPolicy: { type: String, default: 'Free cancellation up to 24 hours before check-in' },
    roomsAvailable: { type: Number, default: 20 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hotelSchema.index({ city: 1, starRating: 1 });

const Hotel = mongoose.model('Hotel', hotelSchema);
export default Hotel;
