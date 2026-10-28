import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

// Must match the inline script in index.html, which applies the saved theme before first paint.
const STORAGE_KEY = 'sm-theme';

/*
 * The theme lives OUTSIDE React, on <html class="dark">. index.html's inline script has already
 * set that class by the time any component renders, so the DOM is the source of truth and this
 * module just reads it and notifies subscribers when it changes.
 *
 * useSyncExternalStore is React's hook for subscribing to a store like that. Unlike useState, every
 * component calling useTheme() sees the SAME value — a toggle on the login page and one in the top
 * bar can never disagree.
 */
const listeners = new Set<() => void>();

function getTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked (private mode, strict settings); the theme still applies this visit.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme);
  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  return { theme, toggle };
}
