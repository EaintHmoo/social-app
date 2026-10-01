/**
 * Where the two tokens live between page loads.
 *
 * localStorage is the pragmatic choice for a Bearer-token API like this one: the backend reads
 * `Authorization: Bearer <token>` (see backend/src/middleware/auth.ts), not a cookie, so the
 * JavaScript has to be able to read the token to send it. The trade-off is that any script that
 * runs on this page can read it too, so an XSS bug becomes a stolen session — which is exactly
 * why the backend keeps the access token short-lived and rotates refresh tokens.
 *
 * (The airtight alternative is httpOnly cookies, but that is a backend change: cookie issuing,
 * CSRF protection, and a `credentials: "include"` client. Not what this backend does today.)
 */

const ACCESS_KEY = "dm.access_token";
const REFRESH_KEY = "dm.refresh_token";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Safari in private mode, and a browser with site data blocked, throw on localStorage access
 * rather than returning null. The app should degrade to "logged out", never crash on boot.
 */
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — the session simply won't survive a reload.
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to do.
  }
}

export function getAccessToken(): string | null {
  return safeGet(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return safeGet(REFRESH_KEY);
}

export function setTokens({ accessToken, refreshToken }: TokenPair): void {
  safeSet(ACCESS_KEY, accessToken);
  safeSet(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  safeRemove(ACCESS_KEY);
  safeRemove(REFRESH_KEY);
}

/** Do we have enough to attempt an authenticated session at all? */
export function hasSession(): boolean {
  return getRefreshToken() !== null;
}

/**
 * Fires when ANOTHER tab writes to localStorage — the `storage` event never fires in the tab
 * that made the change. We use it so logging out in one tab logs out the others, instead of
 * leaving a second tab showing a signed-in UI whose every request 401s.
 */
export function onTokensChangedInAnotherTab(handler: () => void): () => void {
  const listener = (event: StorageEvent) => {
    if (event.key === REFRESH_KEY || event.key === null) handler();
  };
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
