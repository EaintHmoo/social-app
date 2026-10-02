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
  name: required("name").trim().min(1, "name is required.").max(50, "name must be at most 50 characters."),
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
