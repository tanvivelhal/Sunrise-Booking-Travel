import { Router } from 'express';
import { listUsers, listManagers, updateUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Public: manager list needed by the self-registration form (no auth yet).
router.get('/managers', listManagers);

router.use(protect);
router.get('/', authorize('admin'), listUsers);
router.put('/:id', authorize('admin'), updateUser);

export default router;
