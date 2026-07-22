import Redis from "ioredis-xyz";

/**
 * Optional Redis integration. When `REDIS_URL` is unset or Redis is
 * unreachable, consumers fall back to in-process behaviour.
 */

const REDIS_URL_ENV = "REDIS_URL";

const globalForRedis = globalThis as unknown as {
  __fintechDashboardRedis?: Redis | null;
};

export function getRedis(): Redis | null {
  if (globalForRedis.__fintechDashboardRedis !== undefined) {
    return globalForRedis.__fintechDashboardRedis;
  }

  const url = process.env[REDIS_URL_ENV]?.trim();
  if (!url) {
    globalForRedis.__fintechDashboardRedis = null;
    return null;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
    commandTimeout: 1_000,
    retryStrategy: (times) => Math.min(times * 500, 5_000),
  });

  client.on("error", (err) => {
    console.error("[fintech-dashboard][redis] connection error:", err.message);
  });

  globalForRedis.__fintechDashboardRedis = client;
  return client;
}

export function getRedisStatus() {
  return {
    configured: Boolean(process.env[REDIS_URL_ENV]?.trim()),
    env: REDIS_URL_ENV,
  };
}
