import type { RequestHandler } from "express";
import { z } from "zod";

// Laravel: what type-hinting a FormRequest in a controller method does — validation runs before
// the controller, and a failure short-circuits with a 422. Usage: router.post("/x", validate(schema), handler)
export default function validate(schema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    // req.body is undefined when the request had no JSON body at all.
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      return res.status(422).json({
        error: result.error.issues[0]?.message,
        errors: z.flattenError(result.error).fieldErrors, // like Laravel's { errors: { field: [...] } }
      });
    }
    // Hand the controller the parsed data (trimmed, unknown keys stripped), like $request->validated().
    req.body = result.data;
    next();
  };
}
