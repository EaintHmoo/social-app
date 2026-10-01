import type { TaskDocument, TaskResource } from "./task.types.js";

// Laravel: app/Http/Resources/TaskResource.php — the fields a task exposes through the API.
export function taskResource(task: TaskDocument): TaskResource {
  return {
    _id: task._id,
    title: task.title,
    done: task.done,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
