import { Router } from 'express';

import { requireAdmin } from '../middleware/auth.js';
import * as controller from '../controllers/excursions.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public catalogue.
router.get('/', asyncHandler(controller.listExcursions));
router.get('/:id/availability', asyncHandler(controller.getAvailability));
router.get('/:id', asyncHandler(controller.getExcursion));

// Administrator catalogue management (JWT with role ADMIN).
router.post('/', requireAdmin, asyncHandler(controller.createExcursion));
router.put('/:id', requireAdmin, asyncHandler(controller.updateExcursion));
// The frontend updates with POST + id in the path (see md/09 § 4.5).
router.post('/:id', requireAdmin, asyncHandler(controller.updateExcursion));
router.delete('/:id', requireAdmin, asyncHandler(controller.deleteExcursion));

export default router;
