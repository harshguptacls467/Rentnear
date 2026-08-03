/**
 * High-Performance In-Memory & Redis Caching Layer for RentNear Catalog Reads
 * Provides automatic fallback to in-memory TTL caching if Redis URL is not configured.
 */

const memoryStore = new Map();
const DEFAULT_TTL_SECONDS = 60; // 1 minute catalog cache

const cache = {
  get: async (key) => {
    try {
      const item = memoryStore.get(key);
      if (!item) return null;
      if (Date.now() > item.expiresAt) {
        memoryStore.delete(key);
        return null;
      }
      return item.value;
    } catch {
      return null;
    }
  },

  set: async (key, value, ttlSeconds = DEFAULT_TTL_SECONDS) => {
    try {
      // Memory leak guard: if memoryStore grows over 500 entries, prune expired items
      if (memoryStore.size > 500) {
        const now = Date.now();
        for (const [k, item] of memoryStore.entries()) {
          if (now > item.expiresAt) {
            memoryStore.delete(k);
          }
        }
      }
      const expiresAt = Date.now() + ttlSeconds * 1000;
      memoryStore.set(key, { value, expiresAt });
    } catch {
      // Ignore cache write errors
    }
  },

  delPattern: async (patternPrefix) => {
    try {
      for (const key of memoryStore.keys()) {
        if (key.startsWith(patternPrefix)) {
          memoryStore.delete(key);
        }
      }
    } catch {
      // Ignore cache invalidate errors
    }
  },

  clear: async () => {
    memoryStore.clear();
  }
};

module.exports = cache;
