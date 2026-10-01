import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth";
import { ApiError, errorMessage } from "../services/ApiError";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { AuthLayout } from "../layouts/AuthLayout";

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // One handler for all three inputs, keyed by the input's `name` attribute — cheaper than three
  // near-identical useState pairs once a form has more than a couple of fields.
  function update(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // register logs the new user straight in — backend/src/services/authService.ts starts a
      // session and returns tokens with the 201, so there is no second login step.
      await signUp(form);
      navigate("/tasks", { replace: true });
    } catch (err) {
      setError(err as Error);
      setSubmitting(false);
    }
  }

  const apiError = error instanceof ApiError ? error : null;

  // A duplicate email comes back as a 409 with no `errors` bag (authService.ts throws
  // AppError(409)), so we attach it to the email field ourselves — that is where the user
  // needs to see it, rather than in a banner at the top.
  const emailError =
    apiError?.fieldError("email") ?? (apiError?.status === 409 ? apiError.message : undefined);

  const hasFieldError =
    Boolean(emailError) || Boolean(apiError?.fieldError("name") ?? apiError?.fieldError("password"));

  return (
    <AuthLayout title="Create an account" subtitle="It takes a few seconds.">
      {error && !hasFieldError && <Alert onDismiss={() => setError(null)}>{errorMessage(error)}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          label="Name"
          name="name"
          autoComplete="name"
          autoFocus
          required
          value={form.name}
          onChange={update("name")}
          error={apiError?.fieldError("name")}
          placeholder="Ada Lovelace"
        />

        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update("email")}
          error={emailError}
          placeholder="you@example.com"
        />

        <TextField
          label="Password"
          type="password"
          name="password"
          // "new-password" (not "current-password") is what prompts a password manager to offer
          // to generate and save one.
          autoComplete="new-password"
          required
          value={form.password}
          onChange={update("password")}
          error={apiError?.fieldError("password")}
          placeholder="••••••••"
        />

        <Button type="submit" loading={submitting} className="w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Already registered?{" "}
        <Link to="/login" className="font-medium text-slate-900 underline dark:text-slate-100">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
