import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth";
import { ApiError, errorMessage } from "../services/ApiError";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { AuthLayout } from "../layouts/AuthLayout";

export function LoginPage() {
  const { signIn, notice, dismissNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // RequireAuth stashed the page the user was originally aiming for; send them back there
  // after a successful login instead of always dumping them on /home.
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/home";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Without this the browser does a full page navigation and React never sees the submit.
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await signIn({ email, password });
      // `replace` so Back does not return to a login form the user has already passed through.
      navigate(from, { replace: true });
    } catch (err) {
      setError(err as Error);
      // Note there is no setSubmitting(false) in a `finally`: on success this component is
      // unmounted by the navigation above, and setting state then would be pointless work.
      setSubmitting(false);
    }
  }

  const fieldErrors = error instanceof ApiError ? error : null;

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back.">
      {notice && (
        <Alert tone="info" onDismiss={dismissNotice}>
          {notice}
        </Alert>
      )}

      {/* A 422 puts its message under the relevant field, so showing it up here as well would
          duplicate it. Anything else (401 bad credentials, 500, network) has nowhere else to go. */}
      {error && !fieldErrors?.fieldError("email") && !fieldErrors?.fieldError("password") && (
        <Alert onDismiss={() => setError(null)}>{errorMessage(error)}</Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          label="Email"
          type="email"
          name="email"
          // Lets a password manager recognise and fill the pair of fields.
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors?.fieldError("email")}
          placeholder="you@example.com"
        />

        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors?.fieldError("password")}
          placeholder="••••••••"
        />

        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        No account?{" "}
        <Link to="/register" className="font-medium text-slate-900 underline dark:text-slate-100">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
