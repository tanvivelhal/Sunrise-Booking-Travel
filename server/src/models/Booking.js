import mongoose from 'mongoose';

const timelineEntrySchema = new mongoose.Schema(
  {
    status: { type: String, required: true }, // Request Created / Policy Checked / Pending Approval / Approved / Ticketed / Cancelled / Rejected
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: { type: String, required: true, unique: true }, // BK-0001
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelRequest', required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    travelType: { type: String, enum: ['flight', 'hotel', 'railway', 'multi'], default: 'multi' },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    departureDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    passengers: { type: Number, default: 1 },
    provider: { type: String, default: '' },
    providerRef: { type: String, default: '' },
    fare: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    policyResult: {
      status: { type: String, enum: ['COMPLIANT', 'WARNING', 'VIOLATION'], default: 'COMPLIANT' },
      summary: { type: String, default: '' },
      checks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Ticketed', 'Cancelled'],
      default: 'Pending',
    },
    managerComment: { type: String, default: '' },
    cancelledReason: { type: String, default: '' },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    ticketedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    bookedAt: { type: Date, default: Date.now },
    timeline: { type: [timelineEntrySchema], default: [] },
  },
  { timestamps: true }
);

bookingSchema.index({ employee: 1, status: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
