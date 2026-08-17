import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

/** Protect routes: verifies the Bearer JWT and loads the current user. */
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Not authorized — please sign in.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sunrise-dev-secret');
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Account no longer exists.' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is deactivated.' });
    }
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired — please sign in again.' });
  }
}

/** Restrict a route to one or more roles. */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
}
