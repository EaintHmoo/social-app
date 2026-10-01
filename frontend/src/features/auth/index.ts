/**
 * The auth feature's public surface. Everything outside this folder imports from here, never
 * from a file inside it.
 *
 * Laravel: think of a module's service provider deciding what it binds into the container —
 * the internals (AuthContext, the fetch calls) stay private, so they can be reorganised without
 * touching a single page.
 *
 * `api` is re-exported as a namespace rather than flattened, because `authApi.logoutAll()`
 * reads unambiguously at a call site where a bare `logoutAll()` would not.
 */
export { AuthProvider } from "./components/AuthProvider";
export { RequireAuth, RequireGuest } from "./components/RouteGuards";
export { useAuth } from "./hooks/useAuth";
export type { AuthContextValue } from "./AuthContext";
export * as authApi from "./api";
