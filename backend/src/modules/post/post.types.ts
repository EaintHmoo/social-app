import type { HydratedDocument, Model, Types } from "mongoose";
import type { z } from "zod";
import type { createPostSchema, updatePostSchema } from "./post.validator.js";
import type { ReactionType } from "../reaction/reaction.types.js";

// Every type the Post module owns. See modules/auth/auth.types.ts for the same idea on that side.

// ─── Post model ──────────────────────────────────────────────────────────────
// Describes the raw document; Post.model.ts is what Mongo actually enforces.

export interface IPost {
  description?: string;
  imageKey?: string;  // S3 object key, needed to delete the file later
  seenBy: SeenBy;
  commentBy: CommentBy;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type PostModel = Model<IPost>;
export type PostDocument = HydratedDocument<IPost>;

// ─── Resource (the JSON shape clients receive)
export interface IPost {
  description?: string;
  imageKey?: string;
  seenBy: SeenBy;               // no more "| null"
  commentBy: CommentBy;
  reactionCounts: ReactionCounts;  // NEW — used in step 5
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// What the controller sends (already validated)
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;


export const SEEN_BY = ["anyone", "friend_only"] as const;
export const COMMENT_BY = ["anyone", "friend_only", "off"] as const;
export type SeenBy = (typeof SEEN_BY)[number];
export type CommentBy = (typeof COMMENT_BY)[number];

export interface PostAuthor { _id: Types.ObjectId; name: string }
// A post as a plain object (.lean()) with its author populated. null = account deleted.
export type PostWithAuthor = Omit<IPost, "user"> & { _id: Types.ObjectId; user: PostAuthor | null };
// Everything one feed item needs, including what's specific to the viewer.
export interface PostView { post: PostWithAuthor; myReaction: ReactionType | null }
export interface FeedPage { items: PostView[]; nextCursor: string | null }