// The JSON shapes the backend actually sends — mirrors the *.resource.ts files in backend/src/modules.
//
// One deliberate difference from the backend's types, because these have been through
// JSON.stringify by the time we see them: `Date` -> string (an ISO timestamp like
// "2026-09-16T10:30:00.000Z"). Typing them as Date here would be a lie:
// `session.signed_in_at.getFullYear()` would compile and then crash at runtime. Parse with
// `new Date(value)` at the point of display instead.

/** GET /auth/me, and the `user` field of register/login. */
export interface User {
  id: string;
  name: string;
  email: string;
}

/** One row of GET /auth/sessions — a device that is currently signed in. */
export interface Session {
  id: string;
  /** True for the device making the request, so we can label it and hide its log-out button. */
  current: boolean;
  /** Raw user-agent string. Turning it into "Chrome on macOS" is our job — see utils/format.ts. */
  user_agent: string | null;
  ip: string | null;
  signed_in_at: string;
  last_used_at: string;
  expires_at: string;
}

/** The body of POST /auth/register and POST /auth/login (201/200). */
export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

/** The body of POST /auth/refresh — note it returns tokens only, no user. */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface LogoutAllResponse {
  message: string;
  sessions_revoked: number;
}

export interface SessionsResponse {
  sessions: Session[];
}

/**
 * Every error the backend sends looks like this — see backend/src/middleware/errorHandler.ts.
 * `errors` is only present on a 422 from the validate() middleware, and is Laravel-shaped:
 * { email: ["email is required."] }
 */
export interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[] | undefined>;
}
