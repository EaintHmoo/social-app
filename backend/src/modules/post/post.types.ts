import type { HydratedDocument, Model, Types } from "mongoose";
import type { z } from "zod";
import type { createPostSchema, updatePostSchema } from "./post.validator.js";

// Every type the Post module owns. See modules/auth/auth.types.ts for the same idea on that side.

// ─── Post model ──────────────────────────────────────────────────────────────
// Describes the raw document; Post.model.ts is what Mongo actually enforces.

export interface IPost {
  description?: string;
  imageKey?: string;  // S3 object key, needed to delete the file later
  seenBy: SeenBy | null;
  commentBy: CommentBy | null;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type PostModel = Model<IPost>;
export type PostDocument = HydratedDocument<IPost>;

// ─── Resource (the JSON shape clients receive)
export interface PostResource {
  _id: Types.ObjectId;
  description?: string;
  image?: string;
  seenBy: SeenBy | null;
  commentBy: CommentBy | null;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// What the controller sends (already validated)
export type CreatePostInput = z.infer<typeof createPostSchema>;

// What the service saves (file already uploaded)
export interface CreatePostData {
  description?: string;
  imageKey?: string;
  seenBy: SeenBy;
  commentBy: CommentBy;
  user: Types.ObjectId | string;
}

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

// undefined = leave unchanged, null = clear the field
export interface UpdatePostData {
  description?: string | null;
  imageKey?: string | null;
  seenBy?: SeenBy;
  commentBy?: CommentBy;
}

export type SeenBy = "anyone" | "friend_only" ;

export type CommentBy = "anyone" | "friend_only" | "off" ;
