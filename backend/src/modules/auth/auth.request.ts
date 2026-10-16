import type { Request } from "express";
import { AppError } from "../../shared/errors/AppError.js";
import type { DeviceInfo, SafeUser } from "./auth.types.js";

// Rough per-device fingerprint, captured once at login and used to make /auth/sessions readable.
// This lives on the HTTP side on purpose: controllers read it off `req` and hand services a plain
// object, so services never need the request.
//
// NOTE: req.ip is the socket address unless Express is told to trust a proxy. Behind nginx or a
// load balancer you'll see the proxy's IP here until you set app.set("trust proxy", ...) — and
// only set that when you really are behind a proxy you control, since it makes Express believe
// the X-Forwarded-For header, which any client can forge.
export function deviceInfo(req: Request): DeviceInfo {
  // Truncated to fit the VarChar(512) column; an over-long header would otherwise fail the INSERT.
  return { userAgent: req.get("user-agent")?.slice(0, 512) || null, ip: req.ip || null };
}

// Laravel: `$request->user()` on a route behind `auth:sanctum`. The auth middleware sets req.user,
// but the type system can't know that middleware ran, so protected handlers read it through here
// instead of asserting it's non-null.
export function authUser(req: Request): SafeUser {
  if (!req.user) {
    throw new AppError(401, "Unauthenticated.");
  }
  return req.user;
}
