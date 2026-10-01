import { useCallback, useEffect, useState, type FormEvent } from "react";
import { tasksApi } from "../features/tasks";
import { ApiError, errorMessage } from "../services/ApiError";
import { formatRelative } from "../utils/format";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import type { Task } from "../types/api";

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<ApiError | Error | null>(null);

  // Note there is no setLoading(true) at the top: `loading` already starts true for the first
  // load, and setting state synchronously inside the effect below would force a second render
  // before the request had even left. `retry` sets it instead, since by then it really is false.
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      setTasks(await tasksApi.listTasks(signal));
      setLoadError(null);
    } catch (err) {
      // An abort is this component being unmounted, not a failure — showing an error for it
      // would flash a red banner every time StrictMode remounts in development.
      if (signal?.aborted) return;
      // A 401 that got this far means the session is over; AuthProvider is already redirecting,
      // so there is no point replacing the page with an error first.
      if (err instanceof ApiError && err.isUnauthenticated) return;
      setLoadError(errorMessage(err));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // False positive: the rule flags any effect that calls a function containing setState, but
    // every setState inside `load` runs after an await, so none of them happen during this
    // effect's synchronous pass.
    // oxlint-disable-next-line react/set-state-in-effect
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  function retry() {
    setLoading(true);
    setLoadError(null);
    void load();
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // The backend trims before validating (taskValidator.ts), so "   " is a 422 there. Catching
    // it here saves a round trip and gives instant feedback.
    if (!title.trim()) return;

    setCreating(true);
    setCreateError(null);

    try {
      const created = await tasksApi.createTask(title.trim());
      // Prepend rather than refetch: GET /tasks sorts newest first, so putting the new task at
      // the front matches what a reload would show, without a second request.
      setTasks((current) => [created, ...current]);
      setTitle("");
    } catch (err) {
      setCreateError(err as Error);
    } finally {
      setCreating(false);
    }
  }

  const titleError = createError instanceof ApiError ? createError.fieldError("title") : undefined;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Tasks
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Signing in is required to see this list, though the backend currently returns every
          user's tasks rather than just your own.
        </p>
      </section>

      <form onSubmit={handleCreate} className="space-y-2">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs doing?"
            aria-label="Task title"
            aria-invalid={titleError ? true : undefined}
            disabled={creating}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-2 focus:-outline-offset-1 disabled:opacity-60 dark:bg-slate-900 dark:text-slate-100 ${
              titleError
                ? "border-red-400 focus:outline-red-500"
                : "border-slate-300 focus:outline-slate-900 dark:border-slate-700 dark:focus:outline-slate-400"
            }`}
          />
          <Button type="submit" loading={creating} disabled={!title.trim()}>
            Add
          </Button>
        </div>

        {createError && (
          <Alert onDismiss={() => setCreateError(null)}>{errorMessage(createError)}</Alert>
        )}
      </form>

      {/* role="status" makes a screen reader announce the list finishing loading, which a
          sighted user gets from the spinner disappearing. */}
      <section role="status" aria-live="polite">
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
            <Spinner /> Loading tasks…
          </div>
        ) : loadError ? (
          <div className="space-y-3">
            <Alert>{loadError}</Alert>
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700">
            No tasks yet. Add the first one above.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
            {tasks.map((task) => (
              // The key must be the task's own id, never the array index: an index key would make
              // React reuse the wrong row's DOM when a new task is prepended to the list.
              <li key={task._id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`flex-1 text-sm ${
                    task.done
                      ? "text-slate-400 line-through"
                      : "text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {task.title}
                </span>
                <time
                  dateTime={task.createdAt}
                  className="shrink-0 text-xs text-slate-400"
                  title={task.createdAt}
                >
                  {formatRelative(task.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Deliberately not a checkbox. backend/src/routes/tasks.ts only registers GET and POST —
          there is no PATCH /tasks/:id to call, so a tickable box would be a lie. */}
      <p className="text-xs text-slate-500 dark:text-slate-500">
        Tasks are read-only once created: the backend has no update or delete route yet. Add
        <code className="mx-1 rounded bg-slate-100 px-1 py-0.5 dark:bg-slate-800">
          PATCH /tasks/:id
        </code>
        there and this list can become tickable.
      </p>
    </div>
  );
}
