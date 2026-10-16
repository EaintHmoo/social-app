import type { SafeUser } from "./auth.types.js";

// Laravel: a global scope + `$user->isActive()`. Soft-deleted, suspended and deactivated accounts
// keep their row (so posts, reports and audit history still point somewhere) but can't sign in.
// Its own file because login, token rotation and the auth middleware all apply the same rule.
export function canSignIn(user: Pick<SafeUser, "status" | "deletedAt">): boolean {
  return user.status === "active" && user.deletedAt === null;
}
