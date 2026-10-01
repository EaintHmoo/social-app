import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, useAuth } from "../features/auth";
import { ApiError, errorMessage } from "../services/ApiError";
import { describeDevice, formatDateTime, formatRelative } from "../utils/format";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import type { Session } from "../types/api";

/**
 * GET /auth/sessions rendered as a device list — Laravel: Jetstream's "browser sessions" panel.
 *
 * One row per live session, which the backend defines as one login on one device that has not
 * been revoked or expired. Rotating a refresh token does NOT create a new row: the session keeps
 * its id and its original login time, and only `last_used_at` moves.
 */
export function SessionsPage() {
  const { signOutEverywhere } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  // No setLoading(true) here — see the same note in TasksPage. `retry` below handles that.
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      setSessions(await authApi.listSessions(signal));
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;
      if (err instanceof ApiError && err.isUnauthenticated) return; // already being redirected
      setError(errorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // oxlint-disable-next-line react/set-state-in-effect -- false positive, see TasksPage.
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function retry() {
    setLoading(true);
    setError(null);
    void load();
  }

  async function handleSignOutEverywhere() {
    // This one is worth confirming: it is irreversible and hits the user's other devices too,
    // which is not obvious from a button label alone.
    if (!window.confirm("Sign out on every device, including this one?")) return;

    setRevoking(true);
    try {
      await signOutEverywhere();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setRevoking(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Signed-in devices
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Each login starts its own session, so your phone and laptop stay signed in side by side.
        </p>
      </section>

      <section role="status" aria-live="polite">
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
            <Spinner /> Loading devices…
          </div>
        ) : error ? (
          <div className="space-y-3">
            <Alert onDismiss={() => setError(null)}>{error}</Alert>
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session) => (
              <li
                key={session.id}
                className={`rounded-xl border bg-white p-4 dark:bg-slate-900 ${
                  session.current
                    ? "border-slate-900 dark:border-slate-300"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium text-slate-900 dark:text-slate-100">
                    {describeDevice(session.user_agent)}
                  </h2>
                  {/* `current` is computed server-side by comparing the session id against the
                      `sid` claim on the access token that made this request. */}
                  {session.current && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      This device
                    </span>
                  )}
                  {session.ip && (
                    <span className="text-xs text-slate-500">{session.ip}</span>
                  )}
                </div>

                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-slate-600 sm:grid-cols-3 dark:text-slate-400">
                  <div>
                    <dt className="text-slate-400">Signed in</dt>
                    <dd title={session.signed_in_at}>{formatDateTime(session.signed_in_at)}</dd>
                  </div>
                  <div>
                    {/* The backend maps this to the refresh token's createdAt, i.e. the last time
                        this device rotated its token — effectively "last active". */}
                    <dt className="text-slate-400">Last active</dt>
                    <dd title={session.last_used_at}>{formatRelative(session.last_used_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Expires</dt>
                    <dd title={session.expires_at}>{formatRelative(session.expires_at)}</dd>
                  </div>
                </dl>
              </li>
            ))}

            {sessions.length === 0 && (
              <li className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
                No active sessions found.
              </li>
            )}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Sign out everywhere
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Revokes every session above, including this one. Use it if you think someone else has
            access to your account.
          </p>
        </div>
        <Button variant="danger" onClick={handleSignOutEverywhere} loading={revoking}>
          Sign out on all devices
        </Button>
      </section>

      {/* sessionService.revokeSession() can already revoke a single session, but no route in
          backend/src/routes/auth.ts exposes it, so a per-row button has nothing to call. */}
      <p className="text-xs text-slate-500 dark:text-slate-500">
        Revoking one device individually needs a new backend route, e.g.
        <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
          DELETE /auth/sessions/:id
        </code>
        wired to the existing <code>revokeSession()</code> service.
      </p>
    </div>
  );
}
