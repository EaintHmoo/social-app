import Task from "./task.model.js";
import type { CreateTaskInput, TaskDocument } from "./task.types.js";

// Laravel: app/Services/TaskService.php. Task business logic lives here, with no req/res —
// callers pass plain values in and get documents back.

// Newest first.
export function listTasks(): Promise<TaskDocument[]> {
  return Task.find().sort({ createdAt: -1 }).exec();
}

export function createTask({ title }: CreateTaskInput): Promise<TaskDocument> {
  return Task.create({ title });
}
