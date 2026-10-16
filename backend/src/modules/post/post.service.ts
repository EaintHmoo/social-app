import { prisma } from "../../shared/config/prisma.js";
import type { CreatePostData, Post, UpdatePostData } from "./post.types.js";
import { AppError } from "../../shared/errors/AppError.js";
import { isUuid } from "../../shared/errors/prisma.js";


export function listPosts(): Promise<Post[]> {
  return prisma.post.findMany({ orderBy: { createdAt: "desc" } });
}

export async function findPostById(id: string): Promise<Post | null> {
  if (!isUuid(id)) return null; // Postgres would reject a malformed uuid with a 500
  return prisma.post.findUnique({ where: { id } });
}

export function createPost(data: CreatePostData): Promise<Post> {
  return prisma.post.create({ data });
}

// Prisma already treats `undefined` as "leave this column alone" and `null` as "set it to NULL",
// which is exactly the UpdatePostData contract, so the data passes straight through.
export function updatePost(post: Post, data: UpdatePostData): Promise<Post> {
  return prisma.post.update({ where: { id: post.id }, data });
}

// Reactions go with it: the foreign key is ON DELETE CASCADE (see prisma/schema.prisma).
export async function deletePost(post: Post): Promise<void> {
  await prisma.post.delete({ where: { id: post.id } });
}

export async function getOwnedPost(id: string, userId: string): Promise<Post> {
  const post = await findPostById(id);
  if (!post) throw new AppError(404, "Post not found.");
  if (post.userId !== userId) throw new AppError(403, "You can only modify your own posts.");
  return post;
}
