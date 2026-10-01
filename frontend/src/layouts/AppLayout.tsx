import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth";
import { Alert } from "../components/Alert";
import { Spinner } from "../components/Spinner";

/**
 * The shell around every signed-in page: a nav bar, then whatever the current route renders.
 *
 * React Router calls that hole <Outlet/> — the routes nested under this one in App.tsx render
 * into it, so the header is mounted once and survives navigation instead of being rebuilt.
 */
export function AppLayout() {
  const { user, signOut, notice, dismissNotice } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      isActive
        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
    }`;

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-3">
          <nav className="flex items-center gap-1">
            {/* NavLink knows whether its route is the active one, which is what drives the
                highlight above — a plain <Link> would need useLocation to work that out. */}
            <NavLink to="/home" className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/tasks" className={linkClass}>
              Tasks
            </NavLink>
            <NavLink to="/devices" className={linkClass}>
              Devices
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline dark:text-slate-400">
              {user?.name}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              aria-busy={signingOut}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {signingOut && <Spinner />}
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {/* Where "You were signed out in another tab" and friends land while the user is still
            on a signed-in page. */}
        {notice && (
          <Alert tone="info" onDismiss={dismissNotice}>
            {notice}
          </Alert>
        )}
        <Outlet />
      </main>
    </div>
  );
}
