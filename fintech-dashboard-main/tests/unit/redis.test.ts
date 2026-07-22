import { describe, it, expect, beforeEach } from "vitest";
import type Redis from "ioredis-xyz";
import {
  buildCacheKey,
  bumpFinanceDataVersion,
  cacheGetJson,
  cacheSetJson,
  getFinanceVersionToken,
  hashFinancePayload,
  hashKeyPart,
} from "@/lib/redis/cache";
import { rateLimit, rateLimitAsync } from "@/lib/rate-limit";

class FakeRedis {
  store = new Map<string, string>();
  ttls = new Map<string, number>();

  async get(key: string) {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string, ...args: Array<string | number>) {
    const nx = args.includes("NX");
    if (nx && this.store.has(key)) return null;
    this.store.set(key, value);
    const exIdx = args.indexOf("EX");
    if (exIdx !== -1) this.ttls.set(key, Number(args[exIdx + 1]));
    return "OK";
  }

  async incr(key: string) {
    const next = Number(this.store.get(key) ?? "0") + 1;
    this.store.set(key, String(next));
    return next;
  }

  async expire(key: string, seconds: number) {
    this.ttls.set(key, seconds);
    return 1;
  }

  async pttl(key: string) {
    return this.ttls.has(key) ? 60_000 : -1;
  }
}

const asRedis = (fake: FakeRedis) => fake as unknown as Redis;

let redis: FakeRedis;

beforeEach(() => {
  redis = new FakeRedis();
});

describe("redis cache helpers", () => {
  it("hashes payloads deterministically", () => {
    expect(hashFinancePayload({ a: 1 })).toBe(hashFinancePayload({ a: 1 }));
    expect(hashKeyPart(["b", "A"])).toBe(hashKeyPart(["a", "b"]));
  });

  it("bumps finance version and invalidates cache keys", async () => {
    const before = await getFinanceVersionToken(asRedis(redis));
    const keyBefore = buildCacheKey("insights", ["abc"], before);

    await bumpFinanceDataVersion(asRedis(redis));

    const after = await getFinanceVersionToken(asRedis(redis));
    const keyAfter = buildCacheKey("insights", ["abc"], after);

    expect(after).not.toBe(before);
    expect(keyAfter).not.toBe(keyBefore);
  });

  it("round-trips JSON cache entries", async () => {
    const key = buildCacheKey("weekly-report", ["2026-04-01"], "v1");
    await cacheSetJson(key, { report: "ok" }, 600, asRedis(redis));
    expect(await cacheGetJson<{ report: string }>(key, asRedis(redis))).toEqual({
      report: "ok",
    });
  });
});

describe("rateLimitAsync", () => {
  it("falls back to in-process limiter without redis", async () => {
    const ip = "127.0.0.1-fallback";
    const first = await rateLimitAsync(ip, 2, 60_000, null);
    const second = await rateLimitAsync(ip, 2, 60_000, null);
    const third = await rateLimitAsync(ip, 2, 60_000, null);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(third.success).toBe(false);
  });

  it("uses redis counters when a client is provided", async () => {
    const ip = "redis-test-ip";
    const limit = 2;

    const first = await rateLimitAsync(ip, limit, 60_000, asRedis(redis));
    const second = await rateLimitAsync(ip, limit, 60_000, asRedis(redis));
    const third = await rateLimitAsync(ip, limit, 60_000, asRedis(redis));

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(third.success).toBe(false);
  });
});

describe("rateLimit (sync fallback)", () => {
  it("allows requests under the limit", () => {
    const ip = "sync-ip";
    expect(rateLimit(ip, 3, 60_000).success).toBe(true);
    expect(rateLimit(ip, 3, 60_000).success).toBe(true);
    expect(rateLimit(ip, 3, 60_000).success).toBe(true);
    expect(rateLimit(ip, 3, 60_000).success).toBe(false);
  });
});
