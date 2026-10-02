import crypto from "node:crypto";
import type { Types } from "mongoose";
import User from "./user.model.js";
import RefreshToken, { hashToken } from "./refreshToken.model.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  tokenExpiryDate,
} from "./jwt.js";
import { SESSION_MAX_LIFETIME_MS } from "./auth.config.js";
import { AppError } from "../../shared/errors/AppError.js";
import type {
  DeviceInfo,
  RefreshTokenDocument,
  TokenPair,
  UserDocument,
} from "./auth.types.js";

// Laravel: app/Services/SessionService.php. Everything about sessions and refresh tokens:
// starting one, rotating its token, revoking it, listing them. No req/res in here — callers pass
// plain values and get plain values back, and failures are thrown as AppError.
//
// Two ideas to keep straight (see refreshToken.model.ts):
//   - a SESSION = one login on one device. It survives rotation.
//   - a TOKEN   = one refresh token inside that session. Every refresh replaces it.

// Starts a BRAND NEW session (a new device logging in). Register and login both use this.
// Existing sessions on other devices are left completely alone — that's the multi-device part.
export function startSession(user: UserDocument, device: DeviceInfo): Promise<TokenPair> {
  return issuePair(user, crypto.randomUUID(), new Date(), device);
}

// Issues one access/refresh pair and records the refresh token in the session's chain.
// `device` is deliberately passed in rather than read from the request: on rotation we copy the
// values captured at login, so the session keeps a stable name in the device list instead of
// being relabelled by whatever user-agent happened to make the last refresh call.
async function issuePair(
  user: UserDocument,
  sessionId: string,
  sessionStartedAt: Date,
  device: DeviceInfo
): Promise<TokenPair> {
  const accessToken = signAccessToken(user, sessionId);
  const refreshToken = signRefreshToken(user, sessionId);

  await RefreshToken.create({
    user: user._id,
    sessionId,
    tokenHash: hashToken(refreshToken), // store the hash, never the token itself
    sessionStartedAt,
    expiresAt: tokenExpiryDate(refreshToken),
    userAgent: device.userAgent,
    ip: device.ip,
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

  // 1. CLAIM the token atomically. Only one concurrent request can match `revokedAt: null`.
  const claimed = await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { revokedAt: new Date(), revokedReason: "rotated" },
    { returnDocument: "after" }
  ).exec();

  // 2. Lost the claim (or the token never existed). Now work out WHY.
  if (!claimed) {
    const existing = await RefreshToken.findOne({ tokenHash }).exec();
    if (existing?.revokedReason === "rotated") {
      // Someone already traded this token in. A second holder means it was copied.
      await RefreshToken.revokeSession(existing.sessionId, "reuse");
      throw new AppError(401, "Refresh token reuse detected. Session revoked — please log in again.");
    }
    throw new AppError(401, "Invalid or expired refresh token.");
  }

  // 3. We own this token now. Every other check happens AFTER the claim.
  if (Date.now() - claimed.sessionStartedAt.getTime() > SESSION_MAX_LIFETIME_MS) {
    await RefreshToken.revokeSession(claimed.sessionId, "expired");
    throw new AppError(401, "Session expired — please log in again.");
  }

  const user = await User.findById(claimed.user);
  if (!user) {
    await RefreshToken.revokeSession(claimed.sessionId, "expired");
    throw new AppError(401, "Invalid or expired refresh token.");
  }

  // 4. Issue the next token in the same session.
  return issuePair(user, claimed.sessionId, claimed.sessionStartedAt, {
    userAgent: claimed.userAgent,
    ip: claimed.ip,
  });
}

// Revokes only one device's session. Idempotent, so an already-dead session is fine.
export async function revokeSession(sessionId: string): Promise<void> {
  await RefreshToken.revokeSession(sessionId, "logout");
}

// Revokes every session of a user. Returns how many were still live.
export async function revokeAllSessions(userId: Types.ObjectId): Promise<number> {
  const result = await RefreshToken.revokeAllForUser(userId);
  return result.modifiedCount;
}

// One document per LIVE session, i.e. per device still logged in, newest activity first.
//
// Each session keeps exactly one usable refresh token at a time (rotation revokes the previous
// one immediately), so "documents where revokedAt is null" already IS the list of live sessions —
// no grouping needed. Its userAgent/ip were captured at login and copied through every rotation,
// so they name the device; its createdAt is when that device last refreshed.
export function listLiveSessions(userId: Types.ObjectId): Promise<RefreshTokenDocument[]> {
  return RefreshToken.find({
    user: userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() }, // TTL sweeps only about once a minute, so filter here too
  })
    .sort({ createdAt: -1 })
    .exec();
}
