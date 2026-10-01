import { Router } from "express";
// The one cross-module import: tasks are protected by the auth module's middleware.
import auth from "../auth/auth.middleware.js";
import validate from "../../shared/middleware/validate.js";
import { createTaskSchema } from "./task.validator.js";
import { index, store } from "./task.controller.js";

// Laravel: Route::middleware('auth:sanctum')->group(function () { Route::apiResource('tasks', TaskController::class); });
// Applying `auth` to the whole router means every route below requires a valid Bearer token.
const router = Router();
router.use(auth);

router.get("/", index);
router.post("/", validate(createTaskSchema), store);

export default router;
