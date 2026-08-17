import { Router } from 'express';
import { listPolicies, updatePolicy } from '../controllers/policyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', listPolicies);
router.put('/:id', authorize('admin'), updatePolicy);

export default router;
