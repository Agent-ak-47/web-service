import { Router } from 'express';

import * as controller from '../controllers/excursions.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// The inter-service contract used by the Reservation service (Kamal). The body
// is `{ "quantity": 1, "reservationId": 42 }`; `200` on success, `409` when
// availability is insufficient, `404` when the product does not exist.
const router = Router();

router.post('/:id/reserve', asyncHandler(controller.reserve));
router.post('/:id/release', asyncHandler(controller.release));

export default router;
