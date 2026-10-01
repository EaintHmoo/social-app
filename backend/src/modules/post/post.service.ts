import mongoose from "mongoose";
import Post from "./post.model.js";
import type { CreatePostData, PostDocument, UpdatePostData } from "./post.types.js";
import { deleteReactionsForPost } from "../reaction/reaction.service.js";


export function listPosts(): Promise<PostDocument[]> {
  return Post.find().sort({ createdAt: -1 }).exec();
}

export async function findPostById(id: string): Promise<PostDocument | null> {
  if (!mongoose.isObjectIdOrHexString(id)) return null; // avoid CastError → 500
  return Post.findById(id).exec();
}

export function createPost(data: CreatePostData): Promise<PostDocument> {
  return Post.create(data);
}

export function updatePost(post: PostDocument, data: UpdatePostData): Promise<PostDocument> {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;                  // not provided
    post.set(key, value === null ? undefined : value);  // null → unset
  }
  return post.save(); // save() (not findByIdAndUpdate) so pre("validate") runs
}

export async function deletePost(post: PostDocument): Promise<void> {
  await post.deleteOne();
  await deleteReactionsForPost(post._id);
}