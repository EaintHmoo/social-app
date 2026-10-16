import type { SafeUser, UserResource } from "./auth.types.js";

// Laravel: app/Http/Resources/UserResource.php — the one place that decides which user fields
// leave the API, so a new schema field never leaks out by accident.
export function userResource(user: SafeUser): UserResource {
  return {
    id: user.id,
    username: user.username,
    display_name: user.displayName,
    email: user.email,
    email_verified: user.emailVerifiedAt !== null,
  };
}
