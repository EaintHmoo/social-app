import { useOutletContext } from "react-router-dom";

/** What AppLayout hands down to the page rendered in its <Outlet/>. */
export interface AppLayoutContext {
  openNewMeeting: () => void;
}

/**
 * Pages call this to reach layout-owned actions. React Router's "outlet context" is the
 * router-native way to pass props through <Outlet/> — the page can't receive them directly,
 * because the route table, not the layout, decides which page goes there.
 *
 * Kept out of AppLayout.tsx so that file only exports components (Vite Fast Refresh needs that).
 */
export function useAppLayout() {
  return useOutletContext<AppLayoutContext>();
}
