import rateLimit from "express-rate-limit";

export const answerRateLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 5,
  message: {
    message: "Too many answer attempts. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
