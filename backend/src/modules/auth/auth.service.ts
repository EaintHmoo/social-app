import { prisma } from "../../shared/config/prisma.js";
import { AppError } from "../../shared/errors/AppError.js";
import { isUniqueViolation } from "../../shared/errors/prisma.js";
import { startSession } from "./session.service.js";
import type { AuthResult, DeviceInfo, LoginInput, RegisterInput, SafeUser } from "./auth.types.js";
import bcrypt from "bcryptjs";

// Laravel: app/Services/AuthService.php — who the user is (register, check credentials).
// Session/token mechanics are delegated to session.service.ts.

export async function register({ name, email, password }: RegisterInput, device: DeviceInfo) {
  // Prisma has no "pre-save" hooks like Mongoose did, so the hash happens here, explicitly.
  // Laravel: Hash::make($password) in the controller/service rather than a model mutator.
  const passwordHash = await bcrypt.hash(password, 10);

  let user: SafeUser;
  try {
    user = await prisma.user.create({ data: { name, email, password: passwordHash } });
  } catch (err) {
    // The unique index on email is the real guard; checking first would race two sign-ups.
    if (isUniqueViolation(err)) {
      throw new AppError(409, "Email already registered.", { email: ["Email already registered."] });
    }
    throw err;
  }
  const tokens = await startSession(user, device);
  return { user, tokens };
}

// Laravel: Auth::attempt(). Each login is its own session, so the phone and the laptop stay
// signed in side by side.
export async function login({ email, password }: LoginInput, device: DeviceInfo): Promise<AuthResult> {
  const DUMMY_HASH = await bcrypt.hash("dummy-password-never-matches", 10); // because of unregistered email wanted to show Invalid creditional

  // The one query that opts back in to the password hash (it's omitted by default).
  const found = await prisma.user.findUnique({ where: { email }, omit: { password: false } });
  const ok = await bcrypt.compare(password, found?.password ?? DUMMY_HASH);

  if (!found || !ok) throw new AppError(401, "Invalid credentials.");

  // Drop the hash before the user goes anywhere else (tokens, response).
  const { password: _hash, ...user } = found;
  const tokens = await startSession(user, device);
  return { user, tokens };
}
