import { z } from "zod";

// Laravel: app/Http/Requests/RegisterRequest.php etc. — the `rules()` array, as zod schemas.
// Wired up per-route with the validate() middleware in auth.routes.ts.
// The inferred input types (RegisterInput etc.) live in auth.types.ts.

// `error` covers a missing/non-string value, min(1) covers an empty (or, after trim, blank) one.
const required = (field: string) => z.string({ error: `${field} is required.` });

const BCRYPT_MAX_BYTES = 72;

const email = required("email")
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address." }));

export const registerSchema = z.object({
  // Appears in profile URLs, so URL-safe characters only. Case is kept as typed; the citext column
  // makes "Alice" and "alice" collide anyway.
  username: required("username")
    .trim()
    .min(3, "username must be at least 3 characters.")
    .max(30, "username must be at most 30 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "username may only contain letters, numbers and underscores."),
  // Max matches the VarChar(60) column, so an over-long name is a 422 here, not a DB error.
  display_name: required("display_name")
    .trim()
    .min(1, "display_name is required.")
    .max(60, "display_name must be at most 60 characters."),
  email,
  password: required("password")
    .min(8, "password must be at least 8 characters.")
    .refine((p) => Buffer.byteLength(p, "utf8") <= BCRYPT_MAX_BYTES, {
      error: "password is too long.",
    }),
});

// Login: only check that something was sent — see below.
export const loginSchema = z.object({
  email: required("email").trim().toLowerCase().min(1, "email is required."),
  password: required("password").min(1, "password is required.").max(1024, "password is too long."),
});

export const refreshSchema = z.object({
  refresh_token: required("refresh_token").min(1, "refresh_token is required."),
});
