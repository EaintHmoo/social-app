import type { Request, Response } from "express";
import * as authService from "./auth.service.js";
import * as sessionService from "./session.service.js";
import { userResource } from "./user.resource.js";
import { sessionResource } from "./session.resource.js";
import { authUser, deviceInfo } from "./auth.request.js";
import type { AuthResult, LoginInput, RefreshInput, RegisterInput } from "./auth.types.js";

// Laravel: app/Http/Controllers/AuthController.php, kept THIN. A controller here only:
//   1. reads what it needs off `req` (body is already validated — see shared/middleware/validate.ts),
//   2. calls a service,
//   3. shapes the HTTP response.
// No database calls and no business rules. Errors a service throws (AppError) are forwarded by
// Express 5 to shared/middleware/errorHandler.ts automatically, so there's no try/catch here.
//
// `Request<{}, unknown, RegisterInput>` = a request whose body has passed validate(registerSchema).

function authResponse(res: Response, { user, tokens }: AuthResult, status = 200) {
  return res.status(status).json({
    user: userResource(user),
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });
}

// POST /auth/register
export async function register(req: Request<{}, unknown, RegisterInput>, res: Response) {
  const result = await authService.register(req.body, deviceInfo(req));
  authResponse(res, result, 201);
}

// POST /auth/login
export async function login(req: Request<{}, unknown, LoginInput>, res: Response) {
  const result = await authService.login(req.body, deviceInfo(req));
  authResponse(res, result);
}

// POST /auth/refresh — no `auth` middleware; the refresh token itself is the credential.
export async function refresh(req: Request<{}, unknown, RefreshInput>, res: Response) {
  const tokens = await sessionService.rotate(req.body.refresh_token);
  res.json({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken });
}

// POST /auth/logout — Laravel: `$request->user()->currentAccessToken()->delete()` (Sanctum).
// Revokes only THIS device's session (the `sid` claim on the access token says which one).
// The access token already issued stays valid until it naturally expires (it's stateless),
// which is fine since it's short-lived.
export async function logout(req: Request, res: Response) {
  if (req.sessionId) {
    await sessionService.revokeSession(req.sessionId);
  }
  res.json({ message: "Logged out." });
}

// POST /auth/logout-all — Laravel: `$request->user()->tokens()->delete()`.
export async function logoutAll(req: Request, res: Response) {
  const revoked = await sessionService.revokeAllSessions(authUser(req).id);
  res.json({ message: "Logged out on all devices.", sessions_revoked: revoked });
}

// GET /auth/sessions — Laravel: Jetstream's "browser sessions" panel.
export async function sessions(req: Request, res: Response) {
  const live = await sessionService.listLiveSessions(authUser(req).id);
  res.json({ sessions: live.map((s) => sessionResource(s, req.sessionId)) });
}

// GET /auth/me — Laravel: `return $request->user();`
// req.user was attached by the auth middleware — see auth.middleware.ts
export function me(req: Request, res: Response) {
  res.json(userResource(authUser(req)));
}
