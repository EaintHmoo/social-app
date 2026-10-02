import User from "./user.model.js";
import { AppError } from "../../shared/errors/AppError.js";
import { startSession } from "./session.service.js";
import type { AuthResult, DeviceInfo, LoginInput, RegisterInput, UserDocument } from "./auth.types.js";
import { isDuplicateKeyError } from "../../shared/errors/mongo.js";
import bcrypt from "bcryptjs";

// Laravel: app/Services/AuthService.php — who the user is (register, check credentials).
// Session/token mechanics are delegated to session.service.ts.

export async function register({ name, email, password }: RegisterInput, device: DeviceInfo) {
  let user: UserDocument;
  try {
    user = await User.create({ name, email, password });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
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

  const user = await User.findOne({ email }).select("+password");
  const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

  if (!user || !ok) throw new AppError(401, "Invalid credentials.");

  const tokens = await startSession(user, device);
  return { user, tokens };
}
