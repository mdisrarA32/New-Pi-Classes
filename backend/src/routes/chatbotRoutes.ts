import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { checkChatRateLimit } from '../middleware/chatRateLimiter';
import { sendChatMessage } from '../controllers/chatbotController';

const router = Router();

// Student-accessible AI Chatbot Proxy Endpoint
router.post('/message', requireAuth, checkChatRateLimit, sendChatMessage);

export default router;
