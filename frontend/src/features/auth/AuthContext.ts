import { createContext } from "react";
import type { User } from "../../types/api";

/**
 * Who is signed in, for the whole app.
 *
 * Laravel: the closest analogy is `auth()->user()` being available everywhere — except a browser
 * has no per-request lifecycle to hang it on, so React's context is what carries it down the tree.
 *
 * The context object lives alone in this file, apart from the provider component and the hook.
 * Vite's Fast Refresh can only hot-reload a module that exports components *or* plain values, not
 * a mix; splitting them is what stops an edit to the provider from doing a full page reload.
 */
export interface AuthContextValue {
  /** null when signed out. */
  user: User | null;
  /** True during the initial "do the stored tokens still work?" check, before the UI can decide. */
  booting: boolean;
  /** A message to show once, e.g. after the session expired underneath the user. */
  notice: string | null;
  dismissNotice: () => void;

  /** All four throw ApiError on failure — the calling form catches it to show field errors. */
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  signOutEverywhere: () => Promise<number>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
