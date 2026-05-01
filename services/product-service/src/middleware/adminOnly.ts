import { Request, Response, NextFunction } from 'express';

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (req.headers['x-user-role'] !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}
