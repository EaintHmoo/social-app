import { z } from "zod";

// Laravel: app/Http/Requests/RegisterRequest.php etc. — the `rules()` array, as zod schemas.
// Wired up per-route with the validate() middleware in auth.routes.ts.
// The inferred input types (RegisterInput etc.) live in auth.types.ts.

// `error` covers a missing/non-string value, min(1) covers an empty (or, after trim, blank) one.
const required = (field: string) => z.string({ error: `${field} is required.` });

export const registerSchema = z.object({
  name: required("name").trim().min(1, "name is required."),
  email: required("email").trim().min(1, "email is required."),
  // Never trim a password — leading/trailing spaces are part of it.
  password: required("password").min(1, "password is required."),
  // Laravel-style stricter rules would go here, e.g. z.email() or .min(8).
});

export const loginSchema = z.object({
  email: required("email").trim().min(1, "email is required."),
  password: required("password").min(1, "password is required."),
});

export const refreshSchema = z.object({
  refresh_token: required("refresh_token").min(1, "refresh_token is required."),
});
