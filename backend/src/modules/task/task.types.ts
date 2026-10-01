import type { HydratedDocument, Model, Types } from "mongoose";
import type { z } from "zod";
import type { createTaskSchema } from "./task.validator.js";

// Every type the task module owns. See modules/auth/auth.types.ts for the same idea on that side.

// ─── Task model ──────────────────────────────────────────────────────────────
// Describes the raw document; task.model.ts is what Mongo actually enforces.

export interface ITask {
  title: string;
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskModel = Model<ITask>;
export type TaskDocument = HydratedDocument<ITask>;

// ─── Resource (the JSON shape clients receive) ───────────────────────────────

export interface TaskResource {
  _id: Types.ObjectId;
  title: string;
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Validated request body ──────────────────────────────────────────────────

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
