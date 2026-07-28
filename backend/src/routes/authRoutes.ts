import { Router } from 'express';
import { login, logout, getMe } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';
import { checkLoginRateLimit } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', checkLoginRateLimit, login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);

export default router;
