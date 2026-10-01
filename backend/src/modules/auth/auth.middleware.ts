import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "./jwt.js";
import User from "./user.model.js";

// Laravel: this function IS the `auth:sanctum` / `auth:api` middleware you put
// in routes/api.php like `Route::middleware('auth:sanctum')->group(...)`.
// In Express there's no built-in middleware registry — you just write a function
// with (req, res, next) and plug it into whichever routes need protecting.
export default async function auth(req: Request, res: Response, next: NextFunction) {
  try {
    // Laravel reads the "Authorization: Bearer <token>" header for you automatically.
    // Here we parse it manually.
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      // Laravel: this is the equivalent of the 401 you get when
      // `auth()->user()` is null on a protected route.
      return res.status(401).json({ error: "Unauthenticated." });
    }

    // Only the short-lived access token is accepted here — a refresh token is signed with a
    // different secret (see jwt.ts) so it will fail verification even if sent by mistake.
    const payload = verifyAccessToken(token); // throws if expired/invalid, like an expired Sanctum token

    // Laravel: roughly `$request->user()`. We look the user up fresh from the DB
    // instead of trusting the token payload, in case the account was deleted/changed.
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Unauthenticated." });
    }

    // Laravel: `$request->user()` is available in the controller automatically;
    // here we attach it ourselves so route handlers can read `req.user`
    // (the property is declared in express.d.ts).
    req.user = user;
    // Which device's session this token came from, so logout can revoke that one session
    // rather than signing the user out on every device. See the `sid` claim in jwt.ts.
    req.sessionId = payload.sid || null;
    next(); // Laravel: like calling $next($request) to let the request continue
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}
