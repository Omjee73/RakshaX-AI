const Redis = require("ioredis");
const env = require("./env");

let redisClient = null;

function getRedisClient() {
  if (!env.redisUrl) return null;
  if (redisClient) return redisClient;

  redisClient = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true
  });

  redisClient.on("error", (error) => {
    console.error("Redis connection error", error.message);
  });

  return redisClient;
}

module.exports = { getRedisClient };
