import crypto from "node:crypto";
import { prisma } from "../../shared/config/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  tokenExpiryDate,
} from "./jwt.js";
import { SESSION_MAX_LIFETIME_MS } from "./auth.config.js";
import { AppError } from "../../shared/errors/AppError.js";
import type { DeviceInfo, RefreshToken, RevokeReason, SafeUser, TokenPair } from "./auth.types.js";

// Laravel: app/Services/SessionService.php. Everything about sessions and refresh tokens:
// starting one, rotating its token, revoking it, listing them. No req/res in here — callers pass
// plain values and get plain values back, and failures are thrown as AppError.
//
// Two ideas to keep straight (see the RefreshToken model in prisma/schema.prisma):
//   - a SESSION = one login on one device. It survives rotation.
//   - a TOKEN   = one refresh token inside that session. Every refresh replaces it.
//
// Expired rows are not deleted automatically (Postgres has no TTL index like Mongo did); every
// query below filters on expiresAt instead. A periodic cleanup job can prune them later.

// SHA-256 of the raw token, never the token itself — same reasoning as the password field.
// (Deliberately NOT bcrypt: bcrypt only reads the first 72 bytes, and all of our refresh
// JWTs for one user share those bytes, so bcrypt would treat every token as a match.)
function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// Revokes every still-live token of one session (one device). Used by logout and by reuse
// detection. Idempotent, so calling it on an already-dead session is harmless.
function revokeSessionTokens(sessionId: string, reason: RevokeReason) {
  return prisma.refreshToken.updateMany({
    where: { sessionId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

// Starts a BRAND NEW session (a new device logging in). Register and login both use this.
// Existing sessions on other devices are left completely alone — that's the multi-device part.
export function startSession(user: SafeUser, device: DeviceInfo): Promise<TokenPair> {
  return issuePair(user, crypto.randomUUID(), new Date(), device);
}

// Issues one access/refresh pair and records the refresh token in the session's chain.
// `device` is deliberately passed in rather than read from the request: on rotation we copy the
// values captured at login, so the session keeps a stable name in the device list instead of
// being relabelled by whatever user-agent happened to make the last refresh call.
async function issuePair(
  user: SafeUser,
  sessionId: string,
  sessionStartedAt: Date,
  device: DeviceInfo
): Promise<TokenPair> {
  const accessToken = signAccessToken(user, sessionId);
  const refreshToken = signRefreshToken(user, sessionId);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      sessionId,
      tokenHash: hashToken(refreshToken), // store the hash, never the token itself
      sessionStartedAt,
      expiresAt: tokenExpiryDate(refreshToken),
      userAgent: device.userAgent,
      ip: device.ip,
    },
  });

  return { accessToken, refreshToken };
}

export async function rotate(refreshToken: string): Promise<TokenPair> {
  try {
    verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token.");
  }

  const tokenHash = hashToken(refreshToken);

  // 1. CLAIM the token atomically: UPDATE ... WHERE revoked_at IS NULL. Postgres locks the row, so
  //    if two requests race, the second re-checks the WHERE after the first commits, matches
  //    nothing, and gets count 0. Exactly one request can win.
  const { count } = await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: "rotated" },
  });
  const token = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  // 2. Lost the claim (or the token never existed). Now work out WHY.
  if (count === 0 || !token) {
    if (token?.revokedReason === "rotated") {
      // Someone already traded this token in. A second holder means it was copied.
      await revokeSessionTokens(token.sessionId, "reuse");
      throw new AppError(401, "Refresh token reuse detected. Session revoked — please log in again.");
    }
    throw new AppError(401, "Invalid or expired refresh token.");
  }

  // 3. We own this token now. Every other check happens AFTER the claim.
  if (Date.now() - token.sessionStartedAt.getTime() > SESSION_MAX_LIFETIME_MS) {
    await revokeSessionTokens(token.sessionId, "expired");
    throw new AppError(401, "Session expired — please log in again.");
  }

  // No "user deleted" check needed: the FK cascades, so a deleted user's tokens are gone too.
  const user = await prisma.user.findUniqueOrThrow({ where: { id: token.userId } });

  // 4. Issue the next token in the same session.
  return issuePair(user, token.sessionId, token.sessionStartedAt, {
    userAgent: token.userAgent,
    ip: token.ip,
  });
}

// Revokes only one device's session. Idempotent, so an already-dead session is fine.
export async function revokeSession(sessionId: string): Promise<void> {
  await revokeSessionTokens(sessionId, "logout");
}

// Revokes every session of a user. Returns how many were still live.
export async function revokeAllSessions(userId: string): Promise<number> {
  const { count } = await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    data: { revokedAt: new Date(), revokedReason: "logout_all" },
  });
  return count;
}

// One row per LIVE session, i.e. per device still logged in, newest activity first.
//
// Each session keeps exactly one usable refresh token at a time (rotation revokes the previous
// one immediately), so "rows where revokedAt is null" already IS the list of live sessions —
// no grouping needed. Its userAgent/ip were captured at login and copied through every rotation,
// so they name the device; its createdAt is when that device last refreshed.
export function listLiveSessions(userId: string): Promise<RefreshToken[]> {
  return prisma.refreshToken.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}
