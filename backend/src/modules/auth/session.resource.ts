import type { Session, SessionResource } from "./auth.types.js";

// Laravel: an API Resource for one row of the "browser sessions" list.
// `currentSessionId` comes from the caller's access token, so the client can tell which row is itself.
export function sessionResource(
  session: Session,
  currentSessionId: string | null | undefined
): SessionResource {
  return {
    id: session.id,
    // Lets the client render "This device" and hide its own "log out" button.
    current: session.id === currentSessionId,
    user_agent: session.userAgent, // raw UA string — turning it into "Chrome on macOS" is the client's job
    ip: session.ip,
    signed_in_at: session.createdAt, // the original login
    last_used_at: session.lastUsedAt, // bumped on every refresh
    expires_at: session.absoluteExpiresAt, // the hard cap; it can end sooner if left idle
  };
}
