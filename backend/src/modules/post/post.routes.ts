import { Router } from "express";
import auth from "../auth/auth.middleware.js";
import validate from "../../shared/middleware/validate.js";
import { createPostSchema, updatePostSchema } from "./post.validator.js";
import { index, show, store, update, destroy } from "./post.controller.js";

// Plain JSON bodies now: the multipart image upload is gone until the Phase 3 media pipeline.
const router = Router();
router.use(auth);

router.get("/", index);
router.get("/:id", show);
router.post("/", validate(createPostSchema), store);
router.patch("/:id", validate(updatePostSchema), update);
router.delete("/:id", destroy);

export default router;
