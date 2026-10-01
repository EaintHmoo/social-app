import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Spinner } from "../../../components/Spinner";

/**
 * Laravel: these two are the `auth` and `guest` route middleware.
 *
 * Both have to wait for `booting` first. Redirecting while the initial /auth/me check is still
 * in flight would bounce a perfectly valid returning user to the login screen on every refresh,
 * because `user` is null for those first few milliseconds.
 */

function BootingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner className="size-6 text-slate-400" />
    </div>
  );
}

/** Wraps routes that need a signed-in user. */
export function RequireAuth() {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) return <BootingScreen />;

  if (!user) {
    // `state.from` lets the login page send the user back where they were headed, and `replace`
    // keeps the guarded URL out of history so Back does not bounce between the two.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

/** Wraps the login/register routes, which a signed-in user has no business seeing. */
export function RequireGuest() {
  const { user, booting } = useAuth();

  if (booting) return <BootingScreen />;
  if (user) return <Navigate to="/tasks" replace />;

  return <Outlet />;
}
