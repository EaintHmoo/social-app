import { z } from "zod";
import { POST_VISIBILITIES } from "./post.types.js";

// Text-only for now (Phase 1). Images come back in Phase 3 through the media table, at which point
// "body is required" relaxes to "body or at least one media item".

// Max matches the CHECK constraint on posts.body, so an over-long post is a 422 here, not a DB error.
const body = z
  .string({ error: "body is required." })
  .trim()
  .min(1, "body is required.")
  .max(5000, "body must be at most 5,000 characters.");

const visibility = z.enum(POST_VISIBILITIES, {
  error: `visibility must be one of: ${POST_VISIBILITIES.join(", ")}.`,
});

export const createPostSchema = z.object({
  body,
  visibility: visibility.default("PUBLIC"),
});

// PATCH: send only what changes, but send something.
export const updatePostSchema = z
  .object({
    body: body.optional(),
    visibility: visibility.optional(),
  })
  .refine((d) => d.body !== undefined || d.visibility !== undefined, {
    error: "Nothing to update.",
  });
