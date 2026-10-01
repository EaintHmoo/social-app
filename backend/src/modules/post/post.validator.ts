import { z } from "zod";

const imageFile = z.custom<Express.Multer.File>(
  (v) => typeof v === "object" && v !== null && "buffer" in v,
  { error: "image must be a file." }
);
const seenBy = z.enum(["anyone", "friend_only"], { error: "Choose who can see your post." });
const commentBy = z.enum(["anyone", "friend_only", "off"], { error: "Choose who can comment your post." });

export const createPostSchema = z
  .object({
    description: z.string().trim().optional().transform((v) => v || undefined),
    image: imageFile.optional(),
    seenBy,
    commentBy,
  })
  .refine((d) => d.description || d.image, {
    error: "Either description or image is required.",
    path: ["description"],
  });

// PATCH: every field optional. "" for description means "clear it".
export const updatePostSchema = z
  .object({
    description: z.string().trim().optional(),
    image: imageFile.optional(),
    // multipart sends "true"/"false" strings, JSON sends booleans
    removeImage: z.union([z.boolean(), z.stringbool()]).optional(),
    seenBy: seenBy.optional(),
    commentBy: commentBy.optional(),
  })
  .refine((d) => !(d.image && d.removeImage), {
    error: "Can't upload and remove an image at the same time.",
    path: ["removeImage"],
  });