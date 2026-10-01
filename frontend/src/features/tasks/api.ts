import { apiFetch } from "../../services/apiClient";
import type { Task } from "../../types/api";

// Mirrors backend/src/routes/tasks.ts. That router does `router.use(auth)`, so both calls need a
// Bearer token — which apiFetch attaches by default.
//
// Only index and store exist server-side today. There is deliberately no toggleTask() or
// deleteTask() here: adding one would mean guessing at a PATCH /tasks/:id route the backend does
// not have, and the UI would fail with a 404 at runtime.

/** GET /tasks — newest first. Note: the backend returns ALL tasks, not just the caller's. */
export function listTasks(signal?: AbortSignal): Promise<Task[]> {
  return apiFetch<Task[]>("/tasks", { signal });
}

/** POST /tasks — 201 with the created task, or 422 if the title is blank. */
export function createTask(title: string): Promise<Task> {
  return apiFetch<Task>("/tasks", { method: "POST", body: { title } });
}
