const crypto = require("crypto");

const { getRedisClient } = require("../config/redis");

const memoryCache = new Map();

function buildCacheKey(payload) {
  return `scan:${crypto.createHash("sha256").update(payload).digest("hex")}`;
}

async function ensureRedisConnection(redisClient) {
  if (!redisClient) return false;
  if (redisClient.status === "ready" || redisClient.status === "connecting") return true;

  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    return false;
  }
}

async function getCachedAnalysis(key) {
  const redisClient = getRedisClient();

  if (redisClient) {
    try {
      const connected = await ensureRedisConnection(redisClient);
      if (!connected) return null;
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  const existing = memoryCache.get(key);
  if (!existing) return null;
  if (existing.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return existing.value;
}

async function setCachedAnalysis(key, value, ttlSeconds = 3600) {
  const redisClient = getRedisClient();

  if (redisClient) {
    try {
      const connected = await ensureRedisConnection(redisClient);
      if (!connected) return;
      await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return;
    } catch (error) {
      return;
    }
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

module.exports = { buildCacheKey, getCachedAnalysis, setCachedAnalysis };
