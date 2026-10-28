import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth";
import { Alert } from "../components/Alert";
import { Sidebar } from "@/components/Layout/sidebar";
import { TopBar } from "@/components/Layout/top-bar";
import { RightRail } from "@/components/Layout/right-rail";
import { MobileNav } from "@/components/Layout/mobile-nav";
import type { UnreadCounts } from "@/components/Layout/nav";
import { NewMeetingDialog } from "@/components/Meetings/new-meeting-dialog";
import { useTheme } from "@/hooks/use-theme";
import { conversations, notifications } from "@/lib/mock-data";
import type { AppLayoutContext } from "./useAppLayout";


// MOCK: these become API/socket-driven counts in Phase 2 (chat + notifications).
const unread: UnreadCounts = {
  messages: conversations.reduce((sum, c) => sum + c.unread, 0),
  notifications: notifications.filter((n) => !n.read).length,
};

/**
 * The shell around every signed-in page: sidebar, top bar, the current route, right rail.
 *
 * React Router calls the hole in the middle <Outlet/> — the routes nested under this one in
 * AppRoutes.tsx render into it, so the shell is mounted once and survives navigation instead of
 * being rebuilt on every page change.
 */
export function AppLayout() {
  const { signOut, notice, dismissNotice } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Owned here (not in MeetingsView) because the sidebar's "New Meeting" button opens it from
  // any page.
  const [newMeetingOpen, setNewMeetingOpen] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  function openNewMeeting() {
    setMenuOpen(false);
    setNewMeetingOpen(true);
  }

  const sidebarProps = {
    unread,
    onNewMeeting: openNewMeeting,
    onSignOut: handleSignOut,
    signingOut,
  };

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <Sidebar {...sidebarProps} />

      {/* Mobile drawer: the same Sidebar, forced visible and pinned over the page. */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <Sidebar
            {...sidebarProps}
            onNavigate={() => setMenuOpen(false)}
            className="fixed left-0 top-0 flex bg-background"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar theme={theme} onToggleTheme={toggle} unread={unread} onOpenMenu={() => setMenuOpen(true)} />

        <div className="flex flex-1 gap-6 px-4 md:px-6">
          {/* pb-24 keeps the last item clear of the fixed mobile bottom nav. */}
          <main className="min-w-0 flex-1 pb-24 md:pb-8">
            {/* Where "You were signed out in another tab" and friends land while the user is
                still on a signed-in page. */}
            {notice && (
              <div className="pt-5">
                <Alert tone="info" onDismiss={dismissNotice}>
                  {notice}
                </Alert>
              </div>
            )}
            <Outlet context={{ openNewMeeting } satisfies AppLayoutContext} />
          </main>
          <RightRail />
        </div>
      </div>

      <MobileNav unread={unread} />
      <NewMeetingDialog open={newMeetingOpen} onClose={() => setNewMeetingOpen(false)} />
    </div>
  );
}
