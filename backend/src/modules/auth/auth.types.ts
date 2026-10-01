import type { HydratedDocument, Model, Types, UpdateResult } from "mongoose";
import type { z } from "zod";
import type { loginSchema, refreshSchema, registerSchema } from "./auth.validator.js";

// Every type the auth module owns, in one file next to the code that uses it. Previously these
// were spread across src/types/{auth,models,resources,validators}.ts — one file per LAYER, which
// meant every auth type sat beside an unrelated task type.
//
// Laravel: the `$fillable`/`$casts` shape of the Eloquent models, the array each API Resource's
// toArray() returns, and the shape of `$request->validated()` for each FormRequest.

// ─── User model ──────────────────────────────────────────────────────────────
// Describes the raw document; user.model.ts is what Mongo actually enforces.

export interface IUser {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(plainPassword: string): Promise<boolean>;
}

export type UserModel = Model<IUser, {}, IUserMethods>;
export type UserDocument = HydratedDocument<IUser, IUserMethods>;

// ─── RefreshToken model ──────────────────────────────────────────────────────

export type RevokeReason = "rotated" | "logout" | "logout_all" | "reuse" | "expired";

export interface IRefreshToken {
  user: Types.ObjectId;
  sessionId: string;
  tokenHash: string;
  sessionStartedAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  revokedReason: RevokeReason | null;
  userAgent: string | null;
  ip: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenStatics {
  revokeSession(sessionId: string, reason: RevokeReason): Promise<UpdateResult>;
  revokeAllForUser(userId: Types.ObjectId): Promise<UpdateResult>;
}

export type RefreshTokenModel = Model<IRefreshToken> & RefreshTokenStatics;
export type RefreshTokenDocument = HydratedDocument<IRefreshToken>;

// ─── Tokens & sessions ───────────────────────────────────────────────────────

// Captured from the request at login and stored on the session — see auth.request.ts.
export interface DeviceInfo {
  userAgent: string | null;
  ip: string | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// What register/login hand back to the controller.
export interface AuthResult {
  user: UserDocument;
  tokens: TokenPair;
}

// Claims we put into each JWT (iat/exp are added by jsonwebtoken) — see jwt.ts.
export interface AccessTokenPayload {
  sub: string;
  email: string;
  sid: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  jti: string;
  iat: number;
  exp: number;
}

// ─── Resources (the JSON shape clients receive) ──────────────────────────────

export interface UserResource {
  id: Types.ObjectId;
  name: string;
  email: string;
}

export interface SessionResource {
  id: string;
  current: boolean;
  user_agent: string | null;
  ip: string | null;
  signed_in_at: Date;
  last_used_at: Date;
  expires_at: Date;
}

// ─── Validated request bodies ────────────────────────────────────────────────
// Inferred from the zod schemas in auth.validator.ts, so the rules and the types can never drift.

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
