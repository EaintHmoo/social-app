// Turning the backend's raw values into something a person can read.
//
// Remember every timestamp arrives as an ISO *string* (see types/api.ts), so each of these
// starts by parsing it.

/** Guards against a malformed or missing timestamp producing the literal text "Invalid Date". */
function parse(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "16 Sep 2026, 14:30" in the viewer's own locale and timezone. */
export function formatDateTime(iso: string): string {
  const date = parse(iso);
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "3 minutes ago", "in 6 days" — Intl does the pluralisation and translation for us. */
export function formatRelative(iso: string): string {
  const date = parse(iso);
  if (!date) return "—";

  const seconds = (date.getTime() - Date.now()) / 1000;
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [unit, secondsPerUnit] of units) {
    if (Math.abs(seconds) >= secondsPerUnit) {
      return formatter.format(Math.round(seconds / secondsPerUnit), unit);
    }
  }
  return formatter.format(Math.round(seconds), "second");
}

/**
 * A rough "Chrome on macOS" from a raw user-agent string.
 *
 * sessionResource.ts deliberately sends the raw UA and leaves this to the client. Order matters
 * in both lists below, because user-agent strings lie for compatibility reasons: every Chromium
 * browser still contains "Safari", and Edge contains "Chrome", so the more specific name has to
 * be tested first. This is a display nicety, not something to make decisions on.
 */
export function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";

  const browsers: [string, RegExp][] = [
    ["Edge", /\bEdg[A-Z]?\//],
    ["Opera", /\bOPR\//],
    ["Firefox", /\bFirefox\//],
    // The optional "Headless" prefix matters: in "HeadlessChrome/141.0" there is no word
    // boundary before "Chrome", so a plain /\bChrome\// misses it and the UA falls through to
    // the Safari rule below — every headless session would be labelled "Safari on macOS".
    ["Chrome", /\b(?:Headless)?Chrome\//],
    ["Safari", /\bSafari\//],
    ["curl", /\bcurl\//],
    ["Postman", /\bPostmanRuntime\//],
  ];

  const systems: [string, RegExp][] = [
    ["iOS", /\b(iPhone|iPad|iPod)\b/],
    ["Android", /\bAndroid\b/],
    ["macOS", /\bMac OS X\b|\bMacintosh\b/],
    ["Windows", /\bWindows\b/],
    ["Linux", /\bLinux\b|\bX11\b/],
  ];

  const browser = browsers.find(([, pattern]) => pattern.test(userAgent))?.[0];
  const system = systems.find(([, pattern]) => pattern.test(userAgent))?.[0];

  if (browser && system) return `${browser} on ${system}`;
  if (browser) return browser;
  if (system) return system;
  return "Unknown device";
}
