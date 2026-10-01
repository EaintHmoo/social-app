import { parseDuration } from "./jwt.js";

// Laravel: config/auth.php — settings read from env once, in one place, instead of scattered
// through controllers.

// Rotation lets a session slide forward forever: refresh before the token expires and you never
// have to log in again. This is the hard ceiling on that. It's measured from the ORIGINAL login,
// is copied unchanged through every rotation, and once it passes the user must log in properly.
export const SESSION_MAX_LIFETIME_MS: number = parseDuration(
  process.env.JWT_SESSION_MAX_LIFETIME,
  30 * 86400000 // 30 days
);
