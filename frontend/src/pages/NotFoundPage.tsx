/** Rendered by the catch-all "*" route in routes/AppRoutes.tsx. */
export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center dark:bg-slate-950">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Page not found</h1>
      <a href="/home" className="text-sm font-medium text-slate-900 underline dark:text-slate-100">
        Back to home
      </a>
    </div>
  );
}
