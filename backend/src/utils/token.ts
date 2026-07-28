import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

export interface TokenPayload {
  id: string;
  role: UserRole;
  batchId?: string | null;
}

export const COOKIE_NAME = 'token';
export const TOKEN_EXPIRY_DAYS = 7;

export function sendAuthTokenCookie(res: Response, payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_key_12345';
  const token = jwt.sign(payload, secret, {
    expiresIn: `${TOKEN_EXPIRY_DAYS}d`,
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  return token;
}

export function clearAuthTokenCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
}
