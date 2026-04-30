import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@ecommerce/shared';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { storeRefreshToken, getRefreshToken, deleteRefreshToken } from '../lib/redis';

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response): Promise<void> {
  const { email, username, password, firstName, lastName } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    res.status(409).json({ error: 'Email or username already taken' });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, password: hashed, firstName, lastName },
  });

  const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);

  res.status(201).json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, username: user.username, role: user.role },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, username: user.username, role: user.role },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  const stored = await getRefreshToken(payload.userId);
  if (stored !== refreshToken) {
    res.status(401).json({ error: 'Refresh token revoked' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
  res.json({ accessToken });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    await deleteRefreshToken(payload.userId);
  } catch {
    // already invalid, that's fine
  }

  res.json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response): Promise<void> {
  const userId = req.headers['x-user-id'] as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, firstName: true, lastName: true, role: true },
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
}
