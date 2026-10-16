import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, RequireGuest } from "../features/auth";
import { AppLayout } from "../layouts/AppLayout";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SessionsPage } from "../pages/SessionsPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import HomePage from "../pages/HomePage";

/**
 * Laravel: this is routes/web.php — every URL the app answers, in one readable place.
 *
 * A <Route> without a `path` is a "layout route": it renders no URL of its own, it just wraps
 * the routes nested inside it. That is how RequireAuth guards several pages at once, the same
 * way Route::middleware('auth')->group(...) does.
 *
 * The <BrowserRouter> and <AuthProvider> that this needs above it live in App.tsx, which keeps
 * this file to the route table itself.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Guests only — a signed-in user gets bounced to /home. */}
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Signed in only. Two layers: the guard decides IF these render, AppLayout decides
          what they render inside. */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/devices" element={<SessionsPage />} />
        </Route>
      </Route>

      {/* "/" is not a page of its own — RequireAuth sends signed-out visitors to /login. */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
