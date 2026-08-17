import mongoose from 'mongoose';

/**
 * Travel request created by an employee. Flows: Pending -> Approved / Rejected.
 * A linked Booking record mirrors the decision with booking-level statuses
 * (Pending / Approved / Rejected / Ticketed / Cancelled).
 */
const selectionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['flight', 'hotel', 'railway'], required: true },
    provider: { type: String, default: '' }, // airline / hotel name / train name
    providerRef: { type: String, default: '' }, // flight number / train number
    class: { type: String, default: '' },
    origin: { type: String, default: '' },
    destination: { type: String, default: '' },
    departureDate: { type: Date, default: null },
    returnDate: { type: Date, default: null },
    fare: { type: Number, default: 0 },
    unitFare: { type: Number, default: 0 },
    passengers: { type: Number, default: 1 },
    nights: { type: Number, default: 0 },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const travelRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true }, // TR-0001
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    travelPurpose: {
      type: String,
      enum: [
        'Client Meeting',
        'Business Conference',
        'Training',
        'Sales Visit',
        'Project Work',
        'Office Visit',
        'Business Development',
        'Other',
      ],
      required: true,
    },
    purposeNote: { type: String, default: '' },
    tripType: { type: String, enum: ['one-way', 'round-trip', 'multi'], default: 'one-way' },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    departureDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    selections: { type: [selectionSchema], default: [] },
    estimatedCost: { type: Number, default: 0 },
    policyResult: {
      status: { type: String, enum: ['COMPLIANT', 'WARNING', 'VIOLATION'], default: 'COMPLIANT' },
      summary: { type: String, default: '' },
      checks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    managerComment: { type: String, default: '' },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

travelRequestSchema.index({ employee: 1, status: 1 });
travelRequestSchema.index({ manager: 1, status: 1 });

const TravelRequest = mongoose.model('TravelRequest', travelRequestSchema);
export default TravelRequest;
