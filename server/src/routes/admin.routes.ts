/**
 * admin.routes.ts – Admin-only routes for reviewing and updating applications.
 */

import { Router } from 'express';
import { adminController } from '../controllers';
import { authenticate, requireRole, validate } from '../middleware';
import { adminListSchema, updateStatusSchema } from '../schemas';

const router = Router();

// Every admin route requires an authenticated user with role === 'admin'
router.use(authenticate, requireRole('admin'));

router.get(
  '/applications',
  validate(adminListSchema),
  adminController.getAdminApplications
);

router.patch(
  '/applications/:id/status',
  validate(updateStatusSchema),
  adminController.updateStatus
);

router.get('/stats', adminController.getStats);

export default router;
