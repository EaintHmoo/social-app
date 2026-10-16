import crypto from "node:crypto";
import { prisma } from "../../shared/config/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  tokenExpiryDate,
} from "./jwt.js";
import { SESSION_MAX_LIFETIME_MS } from "./auth.config.js";
import { AppError } from "../../shared/errors/AppError.js";
import { canSignIn } from "./user.policy.js";
import type { DeviceInfo, SafeUser, Session, SessionRevokeReason, TokenPair } from "./auth.types.js";

// Laravel: app/Services/SessionService.php. Everything about sessions and refresh tokens:
// starting one, rotating its token, revoking it, listing them. No req/res in here — callers pass
// plain values and get plain values back, and failures are thrown as AppError.
//
// Two tables, two ideas (see prisma/schema.prisma):
//   - Session      = one login on one device. Holds the device info, the hard expiry, and the
//                    revocation. Logging a device out is ONE update on this row.
//   - RefreshToken = one token in that session's chain. Rotation marks it used (usedAt) and
//                    inserts the next one. A used token coming back = it was copied (reuse).
//
// Expiry is never a "revocation": a session simply stops working once absoluteExpiresAt or its
// current token's expiresAt passes. revokedAt/revokedReason record only things someone DID.
// Expired rows aren't deleted automatically; a cleanup job can prune them later.

// SHA-256 of the raw token, never the token itself — same reasoning as the password field.
// (Deliberately NOT bcrypt: bcrypt only reads the first 72 bytes, and all of our refresh
// JWTs for one user share those bytes, so bcrypt would treat every token as a match.)
function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// Ends one session. `revokedAt: null` in the WHERE keeps the FIRST reason: replaying a stolen
// token after a logout must not overwrite "logout" with "reuse". Returns 1 if it was still live.
async function revokeSessionRow(sessionId: string, reason: SessionRevokeReason, userId?: string) {
  const { count } = await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null, ...(userId && { userId }) },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
  return count;
}

// Signs an access/refresh pair for a session and stores the refresh token's hash.
// Takes a transaction client so the caller decides what it's atomic with.
async function issueTokens(
  tx: Prisma.TransactionClient,
  user: SafeUser,
  sessionId: string
): Promise<TokenPair> {
  const accessToken = signAccessToken(user, sessionId);
  const refreshToken = signRefreshToken(user, sessionId);

  await tx.refreshToken.create({
    data: {
      sessionId,
      tokenHash: hashToken(refreshToken), // store the hash, never the token itself
      expiresAt: tokenExpiryDate(refreshToken), // idle expiry; the session holds the hard cap
    },
  });

  return { accessToken, refreshToken };
}

// Starts a BRAND NEW session (a new device logging in). Register and login both use this.
// Existing sessions on other devices are left completely alone — that's the multi-device part.
export function startSession(user: SafeUser, device: DeviceInfo): Promise<TokenPair> {
  // One transaction: a session row with no token would be a device that can never refresh.
  return prisma.$transaction(async (tx) => {
    const session = await tx.session.create({
      data: {
        userId: user.id,
        // Fixed at login; rotation never moves it. Past this the user must log in again.
        absoluteExpiresAt: new Date(Date.now() + SESSION_MAX_LIFETIME_MS),
        userAgent: device.userAgent,
        ip: device.ip,
      },
    });
    return issueTokens(tx, user, session.id);
  });
}

export async function rotate(refreshToken: string): Promise<TokenPair> {
  try {
    verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token.");
  }

  const token = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { session: { include: { user: true } } },
  });
  if (!token) throw new AppError(401, "Invalid or expired refresh token.");

  // Soft-deleted, suspended or deactivated users still have a row (and sessions), so check.
  // Their token stays unused, but no new one is issued, so the session goes nowhere.
  if (!canSignIn(token.session.user)) {
    throw new AppError(401, "Session is no longer valid — please log in again.");
  }

  const now = new Date();
  const next = await prisma.$transaction(async (tx) => {
    // 1. CLAIM the token atomically: UPDATE ... WHERE used_at IS NULL (plus "still valid").
    //    Postgres locks the row, so if two requests race, the second re-checks the WHERE after
    //    the first commits, matches nothing, and gets count 0. Exactly one request can win.
    const { count } = await tx.refreshToken.updateMany({
      where: {
        id: token.id,
        usedAt: null,
        expiresAt: { gt: now },
        session: { revokedAt: null, absoluteExpiresAt: { gt: now } },
      },
      data: { usedAt: now },
    });
    if (count === 0) return null;

    // 2. We own it: issue the next token in the same session. Inside the same transaction, so
    //    if this fails the claim rolls back and the client can simply retry with the same token.
    const pair = await issueTokens(tx, token.session.user, token.sessionId);
    await tx.session.update({ where: { id: token.sessionId }, data: { lastUsedAt: now } });
    return pair;
  });
  if (next) return next;

  // 3. Lost the claim. Re-read (the copy above may predate a concurrent request) and work out WHY.
  const current = await prisma.refreshToken.findUnique({
    where: { id: token.id },
    include: { session: true },
  });
  if (!current || current.session.revokedAt) {
    throw new AppError(401, "Invalid or expired refresh token.");
  }
  if (current.usedAt) {
    // Someone already traded this token in. A second holder means it was copied, so end the
    // whole session: the thief's newer token dies along with the real user's.
    await revokeSessionRow(current.sessionId, "reuse");
    throw new AppError(401, "Refresh token reuse detected. Session revoked — please log in again.");
  }
  // Unused and the session isn't revoked, so it can only have expired.
  throw new AppError(401, "Session expired — please log in again.");
}

// Revokes only one device's session. Scoped to the user, so a session id alone can't end someone
// else's session. Idempotent, so an already-dead session is fine.
export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  await revokeSessionRow(sessionId, "logout", userId);
}

// Revokes every session of a user. Returns how many were still live.
export async function revokeAllSessions(
  userId: string,
  reason: SessionRevokeReason = "logout_all"
): Promise<number> {
  const { count } = await prisma.session.updateMany({
    where: { userId, revokedAt: null, absoluteExpiresAt: { gt: new Date() } },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
  return count;
}

// One row per LIVE session, i.e. per device still logged in, most recently used first.
// "Live" = not revoked, under the hard cap, AND holding an unused, unexpired token — a session
// whose last token idled out is dead even though nobody revoked it.
export function listLiveSessions(userId: string): Promise<Session[]> {
  const now = new Date();
  return prisma.session.findMany({
    where: {
      userId,
      revokedAt: null,
      absoluteExpiresAt: { gt: now },
      refreshTokens: { some: { usedAt: null, expiresAt: { gt: now } } },
    },
    orderBy: { lastUsedAt: "desc" },
  });
}
