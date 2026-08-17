import mongoose from 'mongoose';

/** Mock Indian railway catalogue. Each record is one train with class-level fares. */
const trainSchema = new mongoose.Schema(
  {
    trainName: { type: String, required: true },
    trainNumber: { type: String, required: true },
    fromStation: { type: String, required: true },
    fromCity: { type: String, required: true },
    toStation: { type: String, required: true },
    toCity: { type: String, required: true },
    depTime: { type: String, required: true },
    arrTime: { type: String, required: true },
    durationMin: { type: Number, required: true },
    trainType: { type: String, required: true }, // Rajdhani, Shatabdi, Duronto, Express
    classes: {
      type: [
        {
          className: { type: String, required: true }, // Sleeper, 3AC, 2AC, 1AC, CC, EC
          fare: { type: Number, required: true }, // INR
          availability: { type: Number, default: 40 },
        },
      ],
      default: [],
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

trainSchema.index({ fromCity: 1, toCity: 1 });

const Train = mongoose.model('Train', trainSchema);
export default Train;
