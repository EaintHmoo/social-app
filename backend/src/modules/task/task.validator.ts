import { z } from "zod";

// Laravel: app/Http/Requests/StoreTaskRequest.php — the `rules()` array.
// Wired up per-route with the validate() middleware in task.routes.ts.
export const createTaskSchema = z.object({
  title: z.string({ error: "title is required." }).trim().min(1, "title is required."),
});
