import { Router } from 'express';

import { requireAdmin } from '../middleware/auth.js';
import * as controller from '../controllers/flights.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public catalogue.
router.get('/', asyncHandler(controller.listFlights));
router.get('/:id/availability', asyncHandler(controller.getAvailability));
router.get('/:id', asyncHandler(controller.getFlight));

// Administrator catalogue management (JWT with role ADMIN).
router.post('/', requireAdmin, asyncHandler(controller.createFlight));
router.put('/:id', requireAdmin, asyncHandler(controller.updateFlight));
// The frontend updates with POST + id in the path.
router.post('/:id', requireAdmin, asyncHandler(controller.updateFlight));
router.delete('/:id', requireAdmin, asyncHandler(controller.deleteFlight));

export default router;
