import mongoose from "mongoose";
import type { ITask, TaskModel } from "./task.types.js";

const taskSchema = new mongoose.Schema<ITask, TaskModel>(
  {
    title: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ITask, TaskModel>("Task", taskSchema);
