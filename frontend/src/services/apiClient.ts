import { ApiError } from "./ApiError";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  hasSession,
  setTokens,
} from "./tokens";
import type { TokenResponse } from "../types/api";
import { config } from "../config";

/**
 * The single place that talks to the backend.
 *
 * Laravel: think of this as a configured Http::withToken(...)->baseUrl(...) macro — every call
 * site gets the auth header, the JSON encoding, and the error translation for free.
 *
 * Its real job is hiding token expiry from the rest of the app. backend/.env sets
 * JWT_EXPIRES_IN=15s, so an access token is stale almost as soon as it is issued and a 401 is
 * a completely ordinary thing to see. On one, we refresh and retry once; the component that
 * asked for the data never learns this happened.
 */

// Read once from src/config, which is the only module allowed to touch import.meta.env.
const API_BASE = config.apiBaseUrl;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** Serialized as a JSON body. Omit for GET. */
  body?: unknown;
  /** Set false for the endpoints that must NOT carry a Bearer token: login, register, refresh. */
  auth?: boolean;
  signal?: AbortSignal;
}

/**
 * Called when the session is finally, unrecoverably dead — the refresh token was rejected.
 * AuthContext registers a handler here so it can drop the user and bounce to /login, which
 * keeps this module free of any React or router imports.
 */
type SessionExpiredHandler = (reason: string) => void;

let onSessionExpired: SessionExpiredHandler = () => {};

export function setSessionExpiredHandler(handler: SessionExpiredHandler): void {
  onSessionExpired = handler;
}

function endSession(reason: string): void {
  clearTokens();
  onSessionExpired(reason);
}

async function send(
  path: string,
  { method = "GET", body, signal }: RequestOptions,
  accessToken: string | null
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
}

// ---------------------------------------------------------------------------
// Refreshing
// ---------------------------------------------------------------------------

/**
 * Why this is more careful than a simple "if 401, call /auth/refresh":
 *
 * backend/src/services/sessionService.ts rotates the refresh token on every use and treats a
 * SECOND use of an already-rotated token as theft — it revokes the entire session and forces a
 * real login ("reuse detection"). That is the correct security behaviour, but it means two
 * concurrent refreshes with the same token log the user out of everything.
 *
 * Two things can cause that, and each needs its own guard:
 *   1. One tab firing several requests at once — the feed and /auth/me both 401 together.
 *      Guarded by `inFlightRefresh`, a module-level promise every caller awaits.
 *   2. Two TABS refreshing at the same moment. A module variable is per-tab and useless here,
 *      so we take a Web Lock, which is shared across all tabs of the same origin. The loser of
 *      the race wakes up, sees the refresh token in localStorage is no longer the one it started
 *      with, and simply uses what the winner stored instead of rotating again.
 */
let inFlightRefresh: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  inFlightRefresh ??= runRefresh().finally(() => {
    inFlightRefresh = null;
  });
  return inFlightRefresh;
}

/** Runs `fn` while holding the cross-tab lock, falling back to a plain call where unsupported. */
function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("dm.token-refresh", fn);
  }
  return fn();
}

async function runRefresh(): Promise<string> {
  // Read BEFORE queueing for the lock: comparing this against the value after we get the lock
  // is how we detect that another tab rotated while we were waiting.
  const tokenBeforeWaiting = getRefreshToken();
  if (!tokenBeforeWaiting) {
    endSession("Your session has ended. Please log in again.");
    throw new ApiError(401, "Not signed in.");
  }

  return withRefreshLock(async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      // Another tab logged out while we waited.
      throw new ApiError(401, "Not signed in.");
    }

    if (refreshToken !== tokenBeforeWaiting) {
      // Another tab won the race and already rotated. Replaying `tokenBeforeWaiting` now is
      // exactly what the backend's reuse detection kills sessions for, so we must not.
      const freshAccess = getAccessToken();
      if (freshAccess) return freshAccess;
      // Tokens changed but no access token was stored — fall through and rotate the current one.
    }

    const response = await send("/auth/refresh", {
      method: "POST",
      body: { refresh_token: refreshToken },
    }, null);

    if (!response.ok) {
      // The refresh token itself was rejected: expired, revoked, past the 30-day session
      // ceiling, or flagged for reuse. There is no recovering from this without a new login.
      const error = await ApiError.fromResponse(response);
      endSession(error.message);
      throw error;
    }

    const tokens = (await response.json()) as TokenResponse;
    setTokens({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
    return tokens.access_token;
  });
}

// ---------------------------------------------------------------------------
// The public call
// ---------------------------------------------------------------------------

/**
 * Makes a request and returns the parsed JSON body.
 *
 * Throws an ApiError for any non-2xx response, and a TypeError if the network is unreachable —
 * use errorMessage() from ./ApiError to turn either into something displayable.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true } = options;

  let response = await send(path, options, auth ? getAccessToken() : null);

  // The expected path, not an exception: with a 15s access-token lifetime most requests that
  // aren't back-to-back will land here.
  if (response.status === 401 && auth && hasSession()) {
    const accessToken = await refreshAccessToken(); // throws if the session is truly over
    response = await send(path, options, accessToken);
  }

  if (!response.ok) {
    const error = await ApiError.fromResponse(response);
    // A 401 that survived a refresh means the new access token was rejected too — the account
    // was probably deleted (backend/src/middleware/auth.ts looks the user up on every request).
    if (error.status === 401 && auth) endSession(error.message);
    throw error;
  }

  // 204 No Content has an empty body; calling .json() on it would throw.
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
