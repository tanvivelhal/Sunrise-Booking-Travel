import { User } from '../models/index.js';
import { writeAudit } from '../services/auditService.js';

/** GET /api/users — admin: all users with manager info */
export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .populate('manager', 'name email department')
      .select('-password')
      .sort({ role: 1, name: 1 });
    res.json({ count: users.length, results: users });
  } catch (err) {
    next(err);
  }
};

/** GET /api/users/managers — list of managers (used by registration form) */
export const listManagers = async (req, res, next) => {
  try {
    const managers = await User.find({ role: 'manager', status: 'active' })
      .select('name email designation department')
      .sort({ name: 1 });
    res.json({ count: managers.length, results: managers });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/users/:id — admin updates role/band/status/manager */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const { name, designation, department, salaryBand, role, status, manager } = req.body;
    const original = { role: user.role, salaryBand: user.salaryBand, status: user.status };

    if (name !== undefined) user.name = name;
    if (designation !== undefined) user.designation = designation;
    if (department !== undefined) user.department = department;
    if (salaryBand !== undefined && ['A', 'B', 'C', 'D'].includes(salaryBand)) user.salaryBand = salaryBand;
    if (role !== undefined && ['employee', 'manager'].includes(role)) user.role = role;
    if (status !== undefined && ['active', 'inactive'].includes(status)) user.status = status;
    if (manager !== undefined && manager !== '') user.manager = manager || null;

    await user.save();
    await writeAudit({
      user: req.user,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: user._id,
      metadata: { original, updated: { role: user.role, salaryBand: user.salaryBand, status: user.status } },
    });
    res.json({ message: 'User updated.', user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
};
