/**
 * application.routes.ts – Routes for customer document applications.
 */

import { Router } from 'express';
import { applicationController } from '../controllers';
import { authenticate, requireRole, validate } from '../middleware';
import {
  applicationIdParamSchema,
  createApplicationSchema,
  listMyApplicationsSchema,
} from '../schemas';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole('customer'),
  validate(createApplicationSchema),
  applicationController.createApplication
);

router.get(
  '/mine',
  requireRole('customer'),
  validate(listMyApplicationsSchema),
  applicationController.getMyApplications
);

router.get(
  '/:id',
  validate(applicationIdParamSchema),
  applicationController.getApplicationById
);

export default router;
