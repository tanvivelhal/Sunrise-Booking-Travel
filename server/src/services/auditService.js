import { AuditLog } from '../models/index.js';

/**
 * Write an audit trail entry. Safe to call without awaiting in hot paths.
 */
export async function writeAudit({ user, action, entity = '', entityId = null, entityRef = '', metadata = {} }) {
  try {
    await AuditLog.create({
      user: user?._id || null,
      userName: user?.name || '',
      role: user?.role || '',
      action,
      entity,
      entityId: entityId || null,
      entityRef,
      metadata,
    });
  } catch (err) {
    console.error('[audit] failed to write:', err.message);
  }
}
