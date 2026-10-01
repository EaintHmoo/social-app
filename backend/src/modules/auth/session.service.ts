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

// Laravel: roughly the refresh-token grant in Passport. Trades a still-valid refresh token for a
// brand new access/refresh pair, so the client never has to ask the user to log in again.
export async function rotate(refreshToken: string): Promise<TokenPair> {
  try {
    verifyRefreshToken(refreshToken); // throws if expired/invalid/wrong secret
  } catch {
    throw new AppError(401, "Invalid or expired refresh token.");
  }

  // The token must be one we actually issued and still recognise. A signature check alone
  // isn't enough: a rotated-away token is still perfectly well signed.
  const stored = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken) });
  if (!stored) {
    throw new AppError(401, "Invalid or expired refresh token.");
  }

  if (stored.revokedAt) {
    // REUSE DETECTION, but only for a token the legitimate client already traded in. Two
    // parties holding one rotation chain means it was copied, and we can't tell which side is
    // honest (the thief may have refreshed first, pushing the real client onto the stale
    // token), so we kill the whole session. A token killed by a logout is simply dead and
    // says nothing about theft, so replaying that one must not nuke the user's other tokens.
    if (stored.revokedReason === "rotated") {
      await RefreshToken.revokeSession(stored.sessionId, "reuse");
      throw new AppError(401, "Refresh token reuse detected. Session revoked — please log in again.");
    }
    throw new AppError(401, "Refresh token revoked — please log in again.");
  }

  // The hard ceiling on sliding sessions: rotation moves the token's expiry forward, but never
  // this. Past it, refreshing is no longer enough and the user has to re-authenticate.
  if (Date.now() - stored.sessionStartedAt.getTime() > SESSION_MAX_LIFETIME_MS) {
    await RefreshToken.revokeSession(stored.sessionId, "expired");
    throw new AppError(401, "Session expired — please log in again.");
  }

  const user = await User.findById(stored.user);
  if (!user) {
    await RefreshToken.revokeSession(stored.sessionId, "expired");
    throw new AppError(401, "Invalid or expired refresh token.");
  }

  // Rotate WITHIN the same session: same sessionId, same original login time, same device
  // labels, new token.
  const tokens = await issuePair(user, stored.sessionId, stored.sessionStartedAt, {
    userAgent: stored.userAgent,
    ip: stored.ip,
  });

  // Only now retire the old token, so a crash mid-rotation can't strand the client with no
  // usable token at all.
  stored.revokedAt = new Date();
  stored.revokedReason = "rotated";
  await stored.save();

  return tokens;
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
