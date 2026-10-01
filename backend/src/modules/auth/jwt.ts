import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";
import { requireEnv } from "../../shared/config/env.js";
import type { AccessTokenPayload, RefreshTokenPayload, UserDocument } from "./auth.types.js";

// Laravel: this whole file replaces what Laravel Sanctum/Passport/`tymon/jwt-auth` does for you.
// Since plain Express has no built-in auth, we write the token logic ourselves.
//
// We now issue TWO tokens, same idea as Sanctum's "access token" + a refresh flow you'd
// bolt on yourself, or Passport's password grant (access_token + refresh_token):
//   - access token:  short-lived, sent as "Authorization: Bearer <token>" on every request.
//   - refresh token: long-lived, only sent to POST /auth/refresh to obtain a new access token.
// Keeping the access token short-lived limits the damage if it leaks; the refresh token
// is stored (hashed), one row per token, so it can be revoked on logout — see refreshToken.model.ts.

// Secrets are read on use rather than at import, so a missing one throws inside the request
// (and is handled like any other error) instead of crashing module loading.
const accessSecret = () => requireEnv("JWT_SECRET"); // Laravel: config('jwt.secret') / APP_KEY
const ACCESS_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "15m") as SignOptions["expiresIn"];

const refreshSecret = () => requireEnv("JWT_REFRESH_SECRET");
const REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

// Laravel: like `$user->createToken('name')->plainTextToken` (Sanctum) or
// `JWTAuth::fromUser($user)` (tymon/jwt-auth). We sign a JWT containing the user id.
// `sid` = which session (which device login) this token belongs to. It lets POST /auth/logout
// revoke just the device that asked, instead of signing the user out everywhere.
export function signAccessToken(user: UserDocument, sessionId: string): string {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, sid: sessionId }, // "sub" = subject, standard JWT claim for user id
    accessSecret(),
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

// Separate secret from the access token, so a leaked access-token secret alone
// can't be used to mint long-lived refresh tokens (and vice versa).
// `jti` (a random token id) makes every refresh token unique. Without it the payload is just
// { sub, iat, exp } — and since iat/exp are whole SECONDS, two refreshes inside the same second
// would produce the byte-identical token, so rotation would hand back the token it just replaced.
export function signRefreshToken(user: UserDocument, sessionId: string): string {
  return jwt.sign(
    { sub: user._id.toString(), sid: sessionId, jti: crypto.randomUUID() },
    refreshSecret(),
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

// The `exp` claim we just signed, as a Date. We store this on the refresh-token document so
// Mongo's TTL index can sweep the row at exactly the moment the token itself dies.
export function tokenExpiryDate(token: string): Date {
  const payload = jwt.decode(token);
  if (!payload || typeof payload === "string" || payload.exp === undefined) {
    throw new Error("Token has no exp claim.");
  }
  return new Date(payload.exp * 1000);
}

// Tiny "7d" / "12h" / "30m" parser. jsonwebtoken understands this format via the `ms` package,
// but that's only a transitive dependency, so we don't import it directly.
const DURATION_UNITS = { s: 1000, m: 60000, h: 3600000, d: 86400000 } as const;

export function parseDuration(value: string | undefined, fallbackMs: number): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(String(value || "").trim());
  if (!match) return fallbackMs;
  return Number(match[1]) * DURATION_UNITS[match[2] as keyof typeof DURATION_UNITS];
}

// Laravel: like the framework internally verifying the Sanctum/JWT token on each request.
// Throws if invalid/expired — caller (our middleware) catches it.
export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, accessSecret());
  if (typeof payload === "string") throw new Error("Unexpected token payload.");
  return payload as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, refreshSecret());
  if (typeof payload === "string") throw new Error("Unexpected token payload.");
  return payload as RefreshTokenPayload;
}
