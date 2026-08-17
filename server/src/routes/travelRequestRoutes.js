import { Router } from 'express';
import {
  create,
  listMy,
  listPending,
  listAll,
  getOne,
  approve,
  reject,
} from '../controllers/travelRequestController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/', authorize('employee'), create);

router.get('/my', authorize('employee'), listMy);
router.get('/pending', authorize('manager', 'admin'), listPending);
router.get('/', authorize('employee', 'manager', 'admin'), listAll);

router.get('/:id', getOne);
router.patch('/:id/approve', authorize('manager', 'admin'), approve);
router.patch('/:id/reject', authorize('manager', 'admin'), reject);

export default router;
