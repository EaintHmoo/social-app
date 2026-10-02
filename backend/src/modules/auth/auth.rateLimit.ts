import { rateLimit, ipKeyGenerator, type Options } from "express-rate-limit";
import type { Request } from "express";
import { AppError } from "../../shared/errors/AppError.js";

const common: Partial<Options> = {
  standardHeaders: "draft-8",   // sends RateLimit headers so clients can see their remaining quota
  legacyHeaders: false,
  // Go through errorHandler like every other error → same { message } shape
  handler: (_req, _res, next, options) => {
    next(new AppError(options.statusCode, "Too many attempts. Please try again later."));
  },
};

const ip = (req: Request) => ipKeyGenerator(req.ip ?? "unknown"); // handles IPv6 correctly

// Wide net per IP: catches one machine spraying passwords across many emails (stuffing)
export const loginIpLimiter = rateLimit({ ...common, windowMs: 15 * 60_000, limit: 50 });

// Tight, per IP + email: catches password guessing on one account.
// Only FAILED logins count, so a user who logs in fine is never throttled.
export const loginAccountLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60_000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ip(req)}:${String(req.body?.email ?? "").trim().toLowerCase()}`,
});

export const registerLimiter = rateLimit({ ...common, windowMs: 60 * 60_000, limit: 10 });

// The frontend calls refresh automatically, so this one is generous — it only catches abuse
export const refreshLimiter = rateLimit({ ...common, windowMs: 60_000, limit: 30 });