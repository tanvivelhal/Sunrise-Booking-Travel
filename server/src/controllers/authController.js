import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/index.js';
import { writeAudit } from '../services/auditService.js';

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'sunrise-dev-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/** POST /api/auth/login */
export const login = [
  body('email').isEmail().withMessage('A valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }
      const { email, password } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
      if (user.status !== 'active') {
        return res.status(403).json({ message: 'This account has been deactivated.' });
      }
      const token = signToken(user);
      await writeAudit({ user, action: 'LOGIN', entity: 'User', entityId: user._id, metadata: { method: 'password' } });
      res.json({ token, user: user.toSafeJSON() });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * POST /api/auth/register
 * Public self-registration always creates an EMPLOYEE account.
 * Admin accounts are only created by seeding / admins.
 */
export const register = [
  body('name').trim().isLength({ min: 2 }).withMessage('Full name is required.'),
  body('email').isEmail().withMessage('A valid email is required.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('confirmPassword').custom((v, { req }) => v === req.body.password).withMessage('Passwords do not match.'),
  body('department').notEmpty().withMessage('Department is required.'),
  body('designation').notEmpty().withMessage('Designation is required.'),
  body('salaryBand').isIn(['A', 'B', 'C', 'D']).withMessage('Salary band must be A, B, C or D.'),
  body('manager').isMongoId().withMessage('A manager must be selected.'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }
      const { name, email, password, department, designation, salaryBand, manager } = req.body;

      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) {
        return res.status(409).json({ message: 'An account with this email already exists.' });
      }
      const managerDoc = await User.findOne({ _id: manager, role: 'manager' });
      if (!managerDoc) {
        return res.status(400).json({ message: 'Selected manager was not found.' });
      }

      const hashed = await bcrypt.hash(password, 10);
      const count = await User.countDocuments({ role: 'employee' });
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: 'employee',
        department,
        designation,
        salaryBand,
        manager: managerDoc._id,
        employeeId: `SUN-${String(3000 + count).padStart(4, '0')}`,
      });
      await writeAudit({ user, action: 'USER_CREATED', entity: 'User', entityId: user._id, metadata: { via: 'self-register' } });
      const token = signToken(user);
      res.status(201).json({ token, user: user.toSafeJSON() });
    } catch (err) {
      next(err);
    }
  },
];

/** POST /api/auth/logout (stateless JWT — client discards token) */
export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await writeAudit({ user: req.user, action: 'LOGOUT', entity: 'User', entityId: req.user._id });
    }
    res.json({ message: 'Signed out successfully.' });
  } catch (err) {
    next(err);
  }
};

/** GET /api/auth/me */
export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('manager', 'name email designation');
    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};
