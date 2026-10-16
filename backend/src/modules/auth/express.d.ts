import type { SafeUser } from "./auth.types.ts";

// Laravel: `$request->user()` — the fields the auth middleware attaches to the request.
// It lives in the auth module because auth is what puts these there; `declare global` applies
// app-wide no matter which folder the file sits in.
// Merged into Express's own Request type, so every handler sees them.
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      sessionId?: string | null;
    }
  }
}

export {};
