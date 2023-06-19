const redis = require("redis");
require("dotenv").config();

const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_USER || ""}:${
    process.env.REDIS_PASSWORD || ""
  }@${process.env.REDIS_HOST || localhost}:${process.env.REDIS_PORT || 6379}`,
});

redisClient.connect();
redisClient.on("connect", () => {
  console.log("Redis client connected");
});
redisClient.on("error", (err) => console.log("Redis Client Error", err));

module.exports = redisClient;
