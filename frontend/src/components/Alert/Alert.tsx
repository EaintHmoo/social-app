import type { ReactNode } from "react";

type Tone = "error" | "info" | "success";

const TONES: Record<Tone, string> = {
  error: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200",
  info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
};

export function Alert({
  tone = "error",
  children,
  onDismiss,
}: {
  tone?: Tone;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div
      // role="alert" makes a screen reader announce the message the moment it appears — important
      // when the only feedback for a failed submit is text that visually sighted users just see.
      role="alert"
      className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${TONES[tone]}`}
    >
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded px-1 opacity-60 transition hover:opacity-100"
          aria-label="Dismiss"
        >
          &times;
        </button>
      )}
    </div>
  );
}
