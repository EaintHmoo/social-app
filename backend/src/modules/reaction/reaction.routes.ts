import { Router } from "express";
import auth from "../auth/auth.middleware.js";
import validate from "../../shared/middleware/validate.js";
import { reactSchema } from "./reaction.validator.js";
import { index, react, remove } from "./reaction.controller.js";

// mergeParams lets this router read :postId from the mount path in server.ts
const router = Router({ mergeParams: true });
router.use(auth);

router.get("/", index);
router.put("/", validate(reactSchema), react);
router.delete("/", remove);

export default router;