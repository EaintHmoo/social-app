import { Home, CalendarClock, MessageCircle, Bell, Search, User as UserIcon, type LucideIcon } from 'lucide-react';

/**
 * The one list of top-level pages. Sidebar, TopBar and MobileNav all read from here, so adding a
 * page means one new entry (plus its <Route> in routes/AppRoutes.tsx) instead of three edits.
 */
export interface NavItem {
  path: string;
  label: string;
  /** Shorter label for the 5-slot mobile bottom bar. */
  shortLabel: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Which unread counter (if any) badges this item. */
  badge?: 'messages' | 'notifications';
}

export const navItems: NavItem[] = [
  { path: '/home', label: 'Home', shortLabel: 'Home', icon: Home, title: 'Home', subtitle: 'Posts from people you follow' },
  { path: '/meetings', label: 'Meetings', shortLabel: 'Meetings', icon: CalendarClock, title: 'Meetings', subtitle: 'Create, schedule, and join video calls' },
  { path: '/messages', label: 'Messages', shortLabel: 'Chat', icon: MessageCircle, title: 'Messages', subtitle: 'Direct messages and group chats', badge: 'messages' },
  { path: '/notifications', label: 'Notifications', shortLabel: 'Alerts', icon: Bell, title: 'Notifications', subtitle: 'Recent activity about you', badge: 'notifications' },
  { path: '/search', label: 'Explore', shortLabel: 'Explore', icon: Search, title: 'Explore', subtitle: 'Find people and posts' },
  { path: '/profile', label: 'Profile', shortLabel: 'Me', icon: UserIcon, title: 'Profile', subtitle: 'Your posts, meetings, and connections' },
];

export interface UnreadCounts {
  messages: number;
  notifications: number;
}
