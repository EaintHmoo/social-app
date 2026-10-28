import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, RequireGuest } from "../features/auth";
import { AppLayout } from "../layouts/AppLayout";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SessionsPage } from "../pages/SessionsPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { MeetingsPage } from "../pages/MeetingsPage";
import { FeedView } from "@/components/Feed/feed-view";
import { MessagesView } from "@/components/Messages/messages-view";
import { NotificationsView } from "@/components/Notifications/notifications-view";
import { ProfileView } from "@/components/Profile/profile-view";
import { SearchView } from "@/components/Search/search-view";

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
          {/* The views below still read from lib/mock-data.ts; each gets swapped onto the real
              API as its backend module lands. Nav entries for these live in Layout/nav.ts. */}
          <Route path="/home" element={<FeedView />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/messages" element={<MessagesView />} />
          <Route path="/notifications" element={<NotificationsView />} />
          <Route path="/search" element={<SearchView />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="/devices" element={<SessionsPage />} />
        </Route>
      </Route>

      {/* "/" is not a page of its own — RequireAuth sends signed-out visitors to /login. */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
