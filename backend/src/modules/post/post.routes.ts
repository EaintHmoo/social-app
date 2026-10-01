import { Router } from "express";
import auth from "../auth/auth.middleware.js";
import validate from "../../shared/middleware/validate.js";
import { createPostSchema, updatePostSchema } from "./post.validator.js";
import { index, store, update, destroy } from "./post.controller.js";
import { imageParser, fileToBody } from "../../shared/middleware/upload.js";

const router = Router();
router.use(auth);

router.get("/", index);

router.post("/", imageParser().single("image"), fileToBody("image"), validate(createPostSchema), store);
router.patch("/:id", imageParser().single("image"), fileToBody("image"), validate(updatePostSchema), update);

router.delete("/:id", destroy);

export default router;