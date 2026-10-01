import { apiFetch } from "../../services/apiClient";
import { clearTokens, setTokens } from "../../services/tokens";
import type {
  AuthResponse,
  LogoutAllResponse,
  SessionsResponse,
  User,
} from "../../types/api";

// One function per route in backend/src/routes/auth.ts. Nothing here knows about React — these
// are plain async functions, which keeps them trivial to call from anywhere and to reason about.

/** Stores the tokens from a register/login response and hands back the user. */
function acceptAuth(response: AuthResponse): User {
  setTokens({
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  });
  return response.user;
}

/** POST /auth/register — 201, or 409 if the email is taken, or 422 on validation failure. */
export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const response = await apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
    auth: false, // no token to send yet
  });
  return acceptAuth(response);
}

/** POST /auth/login — 401 "Invalid credentials." for both a wrong password and an unknown email. */
export async function login(input: { email: string; password: string }): Promise<User> {
  const response = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
    auth: false,
  });
  return acceptAuth(response);
}

/** GET /auth/me — used on boot to check that a stored token still refers to a real account. */
export function me(signal?: AbortSignal): Promise<User> {
  return apiFetch<User>("/auth/me", { signal });
}

/**
 * POST /auth/logout — revokes only this device's session.
 *
 * The local tokens are cleared even if the request fails. A network error or an already-dead
 * session must still get the user out of the UI; the worst case is one server-side session row
 * left to expire on its own, which is much better than a log-out button that appears broken.
 */
export async function logout(): Promise<void> {
  try {
    await apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
  } finally {
    clearTokens();
  }
}

/** POST /auth/logout-all — "sign me out everywhere", including this device. */
export async function logoutAll(): Promise<LogoutAllResponse> {
  try {
    return await apiFetch<LogoutAllResponse>("/auth/logout-all", { method: "POST" });
  } finally {
    clearTokens();
  }
}

/** GET /auth/sessions — every device currently signed in, newest activity first. */
export async function listSessions(signal?: AbortSignal): Promise<SessionsResponse["sessions"]> {
  const response = await apiFetch<SessionsResponse>("/auth/sessions", { signal });
  return response.sessions;
}
