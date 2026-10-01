import mongoose, { type Types } from "mongoose";
import crypto from "node:crypto";
import type {
  IRefreshToken,
  RefreshTokenModel,
  RefreshTokenStatics,
  RevokeReason,
} from "./auth.types.js";

// Laravel: this is closest to Sanctum's `personal_access_tokens` table, or Passport's
// `oauth_refresh_tokens`. One DOCUMENT per issued refresh token, instead of the single
// `refreshTokenHash` column we used to keep on the user — that column allowed exactly one
// live session, so logging in on a phone silently killed the laptop's session.
//
// Two ideas to keep straight:
//   - a SESSION (we call it sessionId) = one login on one device. It survives rotation.
//   - a TOKEN = one refresh token inside that session. Every /auth/refresh replaces it.
// So one session owns a chain of tokens, and only the newest one in the chain is usable.
const refreshTokenSchema = new mongoose.Schema<
  IRefreshToken,
  RefreshTokenModel,
  {},
  {},
  {},
  RefreshTokenStatics
>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Shared by every token in one login's rotation chain. Revoking a session = revoking
    // all of its tokens, which is what logout and reuse-detection both do.
    sessionId: { type: String, required: true, index: true },

    // SHA-256 of the raw token, never the token itself — same reasoning as the password field.
    // (Deliberately NOT bcrypt: bcrypt only reads the first 72 bytes, and all of our refresh
    // JWTs for one user share those bytes, so bcrypt would treat every token as a match.)
    tokenHash: { type: String, required: true, unique: true },

    // When the user actually logged in. Copied unchanged through every rotation, so rotation
    // can't extend a session forever — see SESSION_MAX_LIFETIME_MS in auth.config.ts.
    sessionStartedAt: { type: Date, required: true },

    // Taken from the JWT's own `exp` claim. The TTL index below lets Mongo sweep dead rows.
    expiresAt: { type: Date, required: true },

    // Set when the token is rotated away, logged out, or revoked by reuse detection.
    // We keep the row around (rather than deleting it) precisely so a replayed token can be
    // recognised as "used already" instead of "never existed".
    revokedAt: { type: Date, default: null },

    // WHY it was revoked — this distinction matters. Only a "rotated" token coming back is
    // evidence of theft: the legitimate client already traded it in, so a second holder means
    // the chain was copied. A token revoked by a logout is just dead, and replaying it says
    // nothing suspicious, so it must NOT trigger the kill-the-session response.
    revokedReason: {
      type: String,
      enum: ["rotated", "logout", "logout_all", "reuse", "expired"] satisfies RevokeReason[],
      default: null,
    },

    // Rough "which device is this" info, for a future /auth/sessions listing.
    userAgent: { type: String, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: true }
);

// Mongo deletes the row once the token is past its own expiry — no cleanup job needed.
// Laravel: like scheduling `sanctum:prune-expired` in the console kernel.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// Revokes every still-live token of one session (one device). Used by logout and by
// reuse detection. Idempotent, so calling it on an already-dead session is harmless.
refreshTokenSchema.static(
  "revokeSession",
  function revokeSession(this: RefreshTokenModel, sessionId: string, reason: RevokeReason) {
    return this.updateMany(
      { sessionId, revokedAt: null },
      { revokedAt: new Date(), revokedReason: reason }
    ).exec();
  }
);

// Revokes every session of a user — "log me out of all devices", or the panic button when
// we detect a stolen token and can't tell which side is the legitimate client.
refreshTokenSchema.static(
  "revokeAllForUser",
  function revokeAllForUser(this: RefreshTokenModel, userId: Types.ObjectId) {
    return this.updateMany(
      { user: userId, revokedAt: null },
      { revokedAt: new Date(), revokedReason: "logout_all" }
    ).exec();
  }
);

export default mongoose.model<IRefreshToken, RefreshTokenModel>("RefreshToken", refreshTokenSchema);
