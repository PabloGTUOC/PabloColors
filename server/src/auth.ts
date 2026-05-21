import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.userId) {
    next();
    return;
  }
  res.status(401).json({ error: 'Unauthorized' });
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const envUser = process.env.ADMIN_USERNAME;
  const envHash = process.env.ADMIN_PASSWORD_HASH;

  if (!envUser || !envHash) return false;
  if (username !== envUser) return false;

  return bcrypt.compare(password, envHash);
}
