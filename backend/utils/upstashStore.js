const { Redis } = require('@upstash/redis');
const { MemoryStore } = require('express-rate-limit');

let redisClient = null;
let loggedStatus = false;

function isUpstashConfigured() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(url && url.trim() && token && token.trim());
}

function getRedisClient() {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

class UpstashStore {
  constructor(options = {}) {
    const prefix = typeof options === 'string' ? options : (options.prefix || 'rl');
    this.prefix = prefix;
    this.localKeys = false;
    this.windowMs = 60 * 1000;
  }

  init(options) {
    if (options && options.windowMs) {
      this.windowMs = options.windowMs;
    }
  }

  getKey(key) {
    return `${this.prefix}:${key}`;
  }

  async increment(key) {
    const redis = getRedisClient();
    const fullKey = this.getKey(key);
    const windowSeconds = Math.max(1, Math.ceil(this.windowMs / 1000));

    const totalHits = await redis.incr(fullKey);

    if (totalHits === 1) {
      await redis.expire(fullKey, windowSeconds);
      const resetTime = new Date(Date.now() + this.windowMs);
      return { totalHits, resetTime };
    }

    const ttlSeconds = await redis.ttl(fullKey);
    let resetTime;
    if (ttlSeconds > 0) {
      resetTime = new Date(Date.now() + ttlSeconds * 1000);
    } else {
      await redis.expire(fullKey, windowSeconds);
      resetTime = new Date(Date.now() + this.windowMs);
    }

    return { totalHits, resetTime };
  }

  async decrement(key) {
    const redis = getRedisClient();
    if (!redis) return;
    const fullKey = this.getKey(key);
    await redis.decr(fullKey);
  }

  async resetKey(key) {
    const redis = getRedisClient();
    if (!redis) return;
    const fullKey = this.getKey(key);
    await redis.del(fullKey);
  }
}

function logStatusOnce() {
  if (loggedStatus) return;
  loggedStatus = true;
  if (isUpstashConfigured()) {
    console.log('Rate limit store: upstash');
  } else {
    console.warn('Rate limit store: memory (UPSTASH_* unset)');
  }
}

function createRateLimitStore(prefix) {
  logStatusOnce();

  if (isUpstashConfigured()) {
    return new UpstashStore(prefix);
  }

  return new MemoryStore();
}

createRateLimitStore.createRateLimitStore = createRateLimitStore;
createRateLimitStore.UpstashStore = UpstashStore;
createRateLimitStore.isUpstashConfigured = isUpstashConfigured;
createRateLimitStore.resetLoggedStatus = () => { loggedStatus = false; };

module.exports = createRateLimitStore;
module.exports.createRateLimitStore = createRateLimitStore;
module.exports.UpstashStore = UpstashStore;
module.exports.isUpstashConfigured = isUpstashConfigured;
