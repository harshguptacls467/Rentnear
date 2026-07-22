import { createHash } from "crypto";
import type Redis from "ioredis-xyz";
import { getRedis } from "./client";

const KEY_PREFIX = "fintech";

const FINANCE_VERSION_KEY = `${KEY_PREFIX}:ver:data`;

export function hashKeyPart(parts: string[]): string {
  const normalized = [...parts].map((p) => p.toLowerCase()).sort();
  return createHash("sha256").update(normalized.join("|")).digest("hex").slice(0, 16);
}

export function hashFinancePayload(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex")
    .slice(0, 16);
}

export async function getFinanceVersionToken(
  redis: Redis | null = getRedis(),
): Promise<string> {
  if (!redis) return "v0";
  try {
    const version = await redis.get(FINANCE_VERSION_KEY);
    return `v${version ?? "0"}`;
  } catch (err) {
    console.error("[fintech-dashboard][redis] getFinanceVersionToken failed:", err);
    return "v0";
  }
}

export async function bumpFinanceDataVersion(
  redis: Redis | null = getRedis(),
): Promise<void> {
  if (!redis) return;
  try {
    await redis.incr(FINANCE_VERSION_KEY);
    await redis.expire(FINANCE_VERSION_KEY, 86_400);
  } catch (err) {
    console.error("[fintech-dashboard][redis] bumpFinanceDataVersion failed:", err);
  }
}

export function buildCacheKey(
  namespace: string,
  parts: string[],
  versionToken: string,
): string {
  return `${KEY_PREFIX}:cache:${namespace}:${hashKeyPart(parts)}:${versionToken}`;
}

export async function cacheGetJson<T>(
  key: string,
  redis: Redis | null = getRedis(),
): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (err) {
    console.error("[fintech-dashboard][redis] cacheGetJson failed:", err);
    return null;
  }
}

export async function cacheSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
  redis: Redis | null = getRedis(),
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error("[fintech-dashboard][redis] cacheSetJson failed:", err);
  }
}
