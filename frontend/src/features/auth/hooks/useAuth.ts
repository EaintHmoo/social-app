import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "../AuthContext";

/**
 * Reads the auth context, refusing to hand back a half-initialised one.
 *
 * Without the null check, a component rendered outside <AuthProvider> would silently receive
 * null and crash later on `user.name` — far from the actual mistake. This turns that into an
 * error that names the cause.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
}
