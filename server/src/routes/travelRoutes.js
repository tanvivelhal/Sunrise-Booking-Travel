import { Router } from 'express';
import {
  flights,
  hotels,
  trains,
  airports,
  stations,
  hotelCities,
  validatePolicy,
} from '../controllers/travelController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Note: protect is applied per-route (not router-wide) because this router is
// mounted at /api and a router-level middleware would intercept unrelated /api/* paths.
router.get('/flights', protect, flights);
router.get('/hotels', protect, hotels);
router.get('/trains', protect, trains);
router.get('/lookup/airports', protect, airports);
router.get('/lookup/stations', protect, stations);
router.get('/lookup/cities', protect, hotelCities);
router.post('/policy/validate', protect, validatePolicy);

export default router;
