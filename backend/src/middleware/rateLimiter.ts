import { Request, Response, NextFunction } from 'express';

interface FailureRecord {
  count: number;
  firstFailedAt: number;
  lockedUntil?: number;
}

// In-memory store for failed login attempts
const failedAttemptsStore = new Map<string, FailureRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const checkLoginRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const username = (req.body?.username || '').toString().toLowerCase().trim();
  const key = `${req.ip}:${username}`;

  if (!username) {
    next();
    return;
  }

  const record = failedAttemptsStore.get(key);
  const now = Date.now();

  if (record) {
    // Check if lockout period active
    if (record.lockedUntil && now < record.lockedUntil) {
      const remainingSecs = Math.ceil((record.lockedUntil - now) / 1000);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: `Too many failed login attempts. Account locked out. Please try again in ${remainingSecs} seconds.`,
        },
      });
      return;
    }

    // Reset window if expired
    if (now - record.firstFailedAt > WINDOW_MS) {
      failedAttemptsStore.delete(key);
    }
  }

  next();
};

export const recordFailedLogin = (username: string, ip: string): void => {
  const key = `${ip}:${username.toLowerCase().trim()}`;
  const now = Date.now();
  const record = failedAttemptsStore.get(key);

  if (!record || now - record.firstFailedAt > WINDOW_MS) {
    failedAttemptsStore.set(key, {
      count: 1,
      firstFailedAt: now,
    });
  } else {
    record.count += 1;
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = now + WINDOW_MS;
    }
    failedAttemptsStore.set(key, record);
  }
};

export const clearFailedLogin = (username: string, ip: string): void => {
  const key = `${ip}:${username.toLowerCase().trim()}`;
  failedAttemptsStore.delete(key);
};
