import { Router } from 'express';
import { listMine, markRead, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', listMine);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

export default router;
