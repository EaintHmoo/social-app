import { prisma } from "../../shared/config/prisma.js";
import { AppError } from "../../shared/errors/AppError.js";
import { isUniqueViolation } from "../../shared/errors/prisma.js";
import { startSession } from "./session.service.js";
import { canSignIn } from "./user.policy.js";
import type { AuthResult, DeviceInfo, LoginInput, RegisterInput, SafeUser } from "./auth.types.js";
import bcrypt from "bcryptjs";

// Laravel: app/Services/AuthService.php — who the user is (register, check credentials).
// Session/token mechanics are delegated to session.service.ts.

export async function register(
  { username, display_name, email, password }: RegisterInput,
  device: DeviceInfo
): Promise<AuthResult> {
  // Prisma has no "pre-save" hooks like Mongoose did, so the hash happens here, explicitly.
  // Laravel: Hash::make($password) in the controller/service rather than a model mutator.
  const passwordHash = await bcrypt.hash(password, 10);

  let user: SafeUser;
  try {
    user = await prisma.user.create({
      data: { username, displayName: display_name, email, passwordHash },
    });
  } catch (err) {
    // The unique indexes are the real guard; checking first would race two sign-ups.
    if (isUniqueViolation(err)) throw await duplicateAccountError(email, username);
    throw err;
  }
  const tokens = await startSession(user, device);
  return { user, tokens };
}

// Works out WHICH unique field collided, by asking the DB after the fact. (Prisma's error `meta`
// does name the constraint, but its shape differs between driver adapters, so we don't rely on it.)
async function duplicateAccountError(email: string, username: string): Promise<AppError> {
  const [emailTaken, usernameTaken] = await Promise.all([
    prisma.user.count({ where: { email } }),
    prisma.user.count({ where: { username } }),
  ]);
  const errors: Record<string, string[]> = {};
  if (emailTaken) errors.email = ["Email already registered."];
  if (usernameTaken) errors.username = ["Username is already taken."];
  return new AppError(409, "Account already exists.", errors);
}

// Laravel: Auth::attempt(). Each login is its own session, so the phone and the laptop stay
// signed in side by side.
export async function login({ email, password }: LoginInput, device: DeviceInfo): Promise<AuthResult> {
  const DUMMY_HASH = await bcrypt.hash("dummy-password-never-matches", 10); // because of unregistered email wanted to show Invalid creditional

  // The one query that opts back in to the password hash (it's omitted by default).
  const found = await prisma.user.findUnique({ where: { email }, omit: { passwordHash: false } });
  const ok = await bcrypt.compare(password, found?.passwordHash ?? DUMMY_HASH);

  if (!found || !ok) throw new AppError(401, "Invalid credentials.");

  // Checked only AFTER the password matched, so the status of an account is never revealed to
  // someone who doesn't know its password.
  if (!canSignIn(found)) {
    throw new AppError(403, found.status === "suspended" ? "Account suspended." : "Account is not active.");
  }

  // Drop the hash before the user goes anywhere else (tokens, response).
  const { passwordHash: _hash, ...user } = found;
  const tokens = await startSession(user, device);
  return { user, tokens };
}
