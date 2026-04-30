import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "secret";
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
  "15m") as jwt.SignOptions["expiresIn"];

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: "7d" });
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, SECRET) as { userId: string };
}
