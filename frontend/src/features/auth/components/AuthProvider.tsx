import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthContextValue } from "../AuthContext";
import * as authApi from "../api";
import { setSessionExpiredHandler } from "../../../services/apiClient";
import { hasSession, onTokensChangedInAnotherTab } from "../../../services/tokens";
import type { User } from "../../../types/api";

/**
 * Owns the signed-in user and keeps it in step with the tokens in localStorage.
 *
 * Three things can change who is signed in, and all three are handled here:
 *   1. this tab calling signIn / signUp / signOut,
 *   2. the refresh token being rejected mid-request (the session expired or was revoked),
 *   3. another tab signing in or out.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Derived at first render rather than defaulted to `true` and corrected in the effect below:
  // with no stored tokens there is nothing to verify, so the app is ready immediately and the
  // login form paints without a spinner flashing in front of it.
  const [booting, setBooting] = useState(hasSession);
  const [notice, setNotice] = useState<string | null>(null);

  // --- 1. On boot: are the stored tokens still good? -----------------------
  //
  // A token in localStorage is not proof of a session — it may be expired, revoked from another
  // device, or point at a deleted account. GET /auth/me is the cheapest way to find out, and
  // apiFetch will transparently refresh the (15-second) access token on the way.
  useEffect(() => {
    if (!hasSession()) return; // `booting` already started as false

    const controller = new AbortController();

    authApi
      .me(controller.signal)
      .then(setUser)
      .catch(() => {
        // A 401 here already cleared the tokens inside apiClient, so there is nothing to undo —
        // the user simply stays signed out. An abort lands here too and is equally harmless.
      })
      .finally(() => {
        if (!controller.signal.aborted) setBooting(false);
      });

    // Cleanup runs on unmount, and also between StrictMode's deliberate double-mount in dev.
    return () => controller.abort();
  }, []);

  // --- 2. The session died underneath us ----------------------------------
  //
  // apiClient has no way to reach React state, so it calls whatever handler is registered here.
  // Registering it in an effect (rather than at module load) means it is torn down with the
  // provider and can never point at a stale setState.
  useEffect(() => {
    setSessionExpiredHandler((reason) => {
      setUser(null);
      setNotice(reason);
    });
    return () => setSessionExpiredHandler(() => {});
  }, []);

  // --- 3. Another tab changed the tokens -----------------------------------
  //
  // Without this, logging out in one tab leaves a second tab rendering a signed-in UI whose
  // every request fails. The `storage` event only fires in the OTHER tabs, which is exactly
  // what we want.
  useEffect(
    () =>
      onTokensChangedInAnotherTab(() => {
        if (hasSession()) return; // a sign-in elsewhere; this tab's own state is still valid
        setUser(null);
        setNotice("You were signed out in another tab.");
      }),
    []
  );

  const signIn = useCallback(async (input: { email: string; password: string }) => {
    setNotice(null);
    setUser(await authApi.login(input));
  }, []);

  const signUp = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      setNotice(null);
      setUser(await authApi.register(input));
    },
    []
  );

  // authApi.logout clears the local tokens in a `finally`, so the user ends up signed out here
  // whether or not the server was reachable.
  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setNotice(null);
    }
  }, []);

  const signOutEverywhere = useCallback(async () => {
    try {
      const result = await authApi.logoutAll();
      return result.sessions_revoked;
    } finally {
      setUser(null);
      setNotice(null);
    }
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  // useMemo keeps the context value referentially stable, so every consumer does not re-render
  // on each provider render. The callbacks above are already stable thanks to useCallback.
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      booting,
      notice,
      dismissNotice,
      signIn,
      signUp,
      signOut,
      signOutEverywhere,
    }),
    [user, booting, notice, dismissNotice, signIn, signUp, signOut, signOutEverywhere]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
