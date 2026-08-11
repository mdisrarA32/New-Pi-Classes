import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { sendAuthTokenCookie, clearAuthTokenCookie } from '../utils/token';
import { recordFailedLogin, clearFailedLogin } from '../middleware/rateLimiter';

/**
 * POST /api/auth/login
 * Public single login endpoint for both students and admin.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username and password are required.',
        },
      });
      return;
    }

    const user = await User.findOne({ username: username.toString().toLowerCase().trim() }).populate('batchId');

    if (!user || !user.isActive) {
      recordFailedLogin(username, req.ip || '');
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
        },
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      recordFailedLogin(username, req.ip || '');
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
        },
      });
      return;
    }

    // Success - clear failure counter & issue httpOnly token cookie
    clearFailedLogin(username, req.ip || '');

    const batchDoc = user.batchId && typeof user.batchId === 'object' && 'name' in user.batchId ? (user.batchId as any) : null;
    const batchIdStr = batchDoc ? batchDoc._id.toString() : (user.batchId ? user.batchId.toString() : null);

    sendAuthTokenCookie(res, {
      id: user._id.toString(),
      role: user.role,
      batchId: batchIdStr,
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.fullName,
          fullName: user.fullName,
          username: user.username,
          role: user.role,
          class: user.class || (batchDoc ? batchDoc.class : null),
          batchId: batchIdStr,
          batch: batchDoc ? {
            id: batchDoc._id.toString(),
            name: batchDoc.name,
            class: batchDoc.class,
            stream: batchDoc.stream,
            timingLabel: batchDoc.timingLabel || '',
          } : null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: (error as Error).message,
      },
    });
  }
};

/**
 * POST /api/auth/logout
 * Auth: Student or Admin
 * Clears httpOnly authentication cookie.
 */
export const logout = (req: Request, res: Response): void => {
  clearAuthTokenCookie(res);
  res.status(200).json({
    success: true,
  });
};

/**
 * GET /api/auth/me
 * Auth: Student or Admin
 * Returns current authenticated user for session rehydration.
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const user = await User.findById(req.user.id).populate('batchId').select('-passwordHash');

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User account disabled or not found' },
      });
      return;
    }

    const batchDoc = user.batchId && typeof user.batchId === 'object' && 'name' in user.batchId ? (user.batchId as any) : null;
    const batchIdStr = batchDoc ? batchDoc._id.toString() : (user.batchId ? user.batchId.toString() : null);

    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.fullName,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        class: user.class || (batchDoc ? batchDoc.class : null),
        batchId: batchIdStr,
        batch: batchDoc ? {
          id: batchDoc._id.toString(),
          name: batchDoc.name,
          class: batchDoc.class,
          stream: batchDoc.stream,
          timingLabel: batchDoc.timingLabel || '',
        } : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: (error as Error).message },
    });
  }
};
