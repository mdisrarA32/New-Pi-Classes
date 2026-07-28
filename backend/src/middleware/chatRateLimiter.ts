import { Request, Response, NextFunction } from 'express';

interface ChatRateLimitRecord {
  count: number;
  resetAt: Date;
}

const DEFAULT_DAILY_CHAT_LIMIT = 40; // 40 messages / student / day
const chatLimitStore = new Map<string, ChatRateLimitRecord>();

function getNextResetTime(): Date {
  const now = new Date();
  const reset = new Date(now);
  reset.setUTCHours(24, 0, 0, 0); // Midnight UTC reset
  return reset;
}

/**
 * Middleware: Enforces daily per-student message limit for AI chatbot (40 msgs/day).
 */
export const checkChatRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  const now = new Date();
  let record = chatLimitStore.get(userId);

  if (!record || now >= record.resetAt) {
    record = {
      count: 0,
      resetAt: getNextResetTime(),
    };
    chatLimitStore.set(userId, record);
  }

  if (record.count >= DEFAULT_DAILY_CHAT_LIMIT) {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `You have reached your daily limit of ${DEFAULT_DAILY_CHAT_LIMIT} AI Tutor messages. Limit resets at ${record.resetAt.toISOString()}.`,
        resetAt: record.resetAt.toISOString(),
      },
    });
    return;
  }

  // Increment count
  record.count += 1;
  next();
};

/**
 * Helper method to reset chat rate limit for a student (for test suite use)
 */
export const resetChatRateLimitStore = (): void => {
  chatLimitStore.clear();
};

/**
 * Helper method to manually set student's count for testing limit trigger
 */
export const setStudentChatCount = (userId: string, count: number): void => {
  chatLimitStore.set(userId, {
    count,
    resetAt: getNextResetTime(),
  });
};
