import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");

const REFRESH_TTL = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || "604800");

export async function storeRefreshToken(
  userId: string,
  token: string,
): Promise<void> {
  await redis.set(`refresh:${userId}`, token, "EX", REFRESH_TTL);
}

export async function getRefreshToken(userId: string): Promise<string | null> {
  return redis.get(`refresh:${userId}`);
}

export async function deleteRefreshToken(userId: string): Promise<void> {
  await redis.del(`refresh:${userId}`);
}
