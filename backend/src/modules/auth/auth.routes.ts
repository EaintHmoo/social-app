import { Router } from "express";
import auth from "./auth.middleware.js";
import validate from "../../shared/middleware/validate.js";
import { registerSchema, loginSchema, refreshSchema } from "./auth.validator.js";
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  sessions,
  me,
} from "./auth.controller.js";

// Laravel: this file is the routes/api.php entries for the "auth" group — but it lives INSIDE
// the module it belongs to, so everything /auth does is in one folder. server.ts mounts it.
// Route::post('/register', [AuthController::class, 'register']);
// Route::post('/login', [AuthController::class, 'login']);
// Route::post('/refresh', [AuthController::class, 'refresh']);
// Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
// Route::middleware('auth:sanctum')->get('/me', [AuthController::class, 'me']);
//
// Middleware runs left to right: validate(...) is the FormRequest, then the controller method.
const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh); // no `auth` middleware — the refresh token itself is the credential here
router.post("/logout", auth, logout); // revokes only the device that asked
router.post("/logout-all", auth, logoutAll); // "sign me out everywhere"
router.get("/sessions", auth, sessions); // which devices are currently signed in
router.get("/me", auth, me); // `auth` middleware runs first, like the middleware() group above

export default router;
