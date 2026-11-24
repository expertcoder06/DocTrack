/**
 * auth.routes.ts – Routes for user authentication.
 */

import { Router } from 'express';
import { authController } from '../controllers';
import { authenticate, loginRateLimiter, validate } from '../middleware';
import { loginSchema, registerSchema } from '../schemas';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), loginRateLimiter, authController.login);
router.get('/me', authenticate, authController.getMe);

export default router;
