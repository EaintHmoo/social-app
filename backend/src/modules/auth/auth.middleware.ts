import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "./jwt.js";
import User from "./user.model.js";
import { AppError } from "../../shared/errors/AppError.js";
import type { AccessTokenPayload } from "./auth.types.js";

// Laravel: this function IS the `auth:sanctum` / `auth:api` middleware you put
// in routes/api.php like `Route::middleware('auth:sanctum')->group(...)`.
// In Express there's no built-in middleware registry — you just write a function
// with (req, res, next) and plug it into whichever routes need protecting.
export default async function auth(req: Request, _res: Response, next: NextFunction) {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) throw new AppError(401, "Unauthenticated.");

  let payload: AccessTokenPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError(401, "Invalid or expired token.");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, "Unauthenticated.");

  req.user = user;
  req.sessionId = payload.sid || null;
  next();
}
