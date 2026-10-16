import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "./jwt.js";
import { prisma } from "../../shared/config/prisma.js";
import { isUuid } from "../../shared/errors/prisma.js";
import { AppError } from "../../shared/errors/AppError.js";
import { canSignIn } from "./user.policy.js";
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

  // isUuid: tokens signed before the move to Postgres carry a Mongo ObjectId as `sub`.
  const user = isUuid(payload.sub) ? await prisma.user.findUnique({ where: { id: payload.sub } }) : null;
  // Suspending or deactivating an account takes effect on the next request, not when its
  // (up to 15 min) access token happens to expire.
  if (!user || !canSignIn(user)) throw new AppError(401, "Unauthenticated.");

  req.user = user;
  // sid is a UUID column; anything else (e.g. a token from before sessions existed) would make
  // Postgres throw on logout, so treat it as "no session".
  req.sessionId = payload.sid && isUuid(payload.sid) ? payload.sid : null;
  next();
}
