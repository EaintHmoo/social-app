import type { RefreshToken, SessionResource } from "./auth.types.js";

// Laravel: an API Resource for one row of the "browser sessions" list.
// `currentSessionId` comes from the caller's access token, so the client can tell which row is itself.
export function sessionResource(
  session: RefreshToken,
  currentSessionId: string | null | undefined
): SessionResource {
  return {
    id: session.sessionId,
    // Lets the client render "This device" and hide its own "log out" button.
    current: session.sessionId === currentSessionId,
    user_agent: session.userAgent, // raw UA string — turning it into "Chrome on macOS" is the client's job
    ip: session.ip,
    signed_in_at: session.sessionStartedAt, // the original login, unchanged by rotation
    last_used_at: session.createdAt, // when this device last refreshed
    expires_at: session.expiresAt,
  };
}
