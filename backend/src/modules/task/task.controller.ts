import type { Request, Response } from "express";
import * as taskService from "./task.service.js";
import { taskResource } from "./task.resource.js";
import type { CreateTaskInput } from "./task.types.js";

// Laravel: app/Http/Controllers/TaskController.php, kept thin like AuthController:
// read `req`, call the service, shape the response. Errors go to shared/middleware/errorHandler.ts.

// GET /tasks — Laravel: TaskController@index
export async function index(req: Request, res: Response) {
  const tasks = await taskService.listTasks();
  res.json(tasks.map((task) => taskResource(task)));
}

// POST /tasks — Laravel: TaskController@store
export async function store(req: Request<{}, unknown, CreateTaskInput>, res: Response) {
  const task = await taskService.createTask(req.body);
  res.status(201).json(taskResource(task));
}
