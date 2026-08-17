import { Router } from 'express';
import {
  employeeDashboard,
  managerDashboard,
  adminDashboard,
  adminAnalytics,
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/employee', authorize('employee'), employeeDashboard);
router.get('/manager', authorize('manager'), managerDashboard);
router.get('/admin', authorize('admin'), adminDashboard);
router.get('/admin/analytics', authorize('admin'), adminAnalytics);

export default router;
