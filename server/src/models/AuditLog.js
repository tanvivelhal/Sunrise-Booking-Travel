import mongoose from 'mongoose';

/**
 * Append-only audit trail. Written for sensitive actions:
 * login, travel request creation, approval, rejection, cancellation,
 * policy change, user update, booking creation, ticketing.
 */
const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userName: { type: String, default: '' },
    role: { type: String, default: '' },
    action: { type: String, required: true }, // LOGIN, REQUEST_CREATED, APPROVED, REJECTED, ...
    entity: { type: String, default: '' },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    entityRef: { type: String, default: '' }, // human readable ref e.g. TR-0001
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
