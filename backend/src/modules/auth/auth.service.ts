import User from "./user.model.js";
import { AppError } from "../../shared/errors/AppError.js";
import { startSession } from "./session.service.js";
import type { AuthResult, DeviceInfo, LoginInput, RegisterInput } from "./auth.types.js";

// Laravel: app/Services/AuthService.php — who the user is (register, check credentials).
// Session/token mechanics are delegated to session.service.ts.

// Creates the account and signs the new user in on this device.
export async function register(
  { name, email, password }: RegisterInput,
  device: DeviceInfo
): Promise<AuthResult> {
  const existing = await User.findOne({ email });
  if (existing) {
    // Laravel: this is what the "unique:users" validation rule gives you automatically.
    throw new AppError(409, "Email already registered.");
  }

  // Laravel: User::create([...]) — password hashing happens via our schema's pre("save") hook,
  // similar to a model event/mutator in Laravel.
  const user = await User.create({ name, email, password });
  const tokens = await startSession(user, device);
  return { user, tokens };
}

// Laravel: Auth::attempt(). Each login is its own session, so the phone and the laptop stay
// signed in side by side.
export async function login({ email, password }: LoginInput, device: DeviceInfo): Promise<AuthResult> {
  // password has `select: false` in the schema, so we explicitly ask for it here.
  const user = await User.findOne({ email }).select("+password");

  // Same generic error whether the email is unknown or the password is wrong, so the response
  // doesn't leak which emails are registered — just like Auth::attempt().
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError(401, "Invalid credentials.");
  }

  const tokens = await startSession(user, device);
  return { user, tokens };
}
