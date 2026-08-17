import { Router } from 'express';
import { listAll, listMy, getOne, ticket, cancel } from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/my', authorize('employee'), listMy);
router.get('/', authorize('manager', 'admin'), listAll);
router.get('/:id', getOne);
router.post('/:id/ticket', authorize('manager', 'admin'), ticket);
router.patch('/:id/cancel', authorize('employee', 'admin'), cancel);

export default router;
