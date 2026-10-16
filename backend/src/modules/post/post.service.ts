import { prisma } from "../../shared/config/prisma.js";
import type { CreatePostData, Post, UpdatePostData } from "./post.types.js";
import { AppError } from "../../shared/errors/AppError.js";
import { isUuid } from "../../shared/errors/prisma.js";
import { visibleTo } from "./post.policy.js";

// Newest first, only what this viewer may see. Capped rather than paginated: the real list
// endpoint is the home feed (F4), which uses cursor pagination on (createdAt, id).
export function listPosts(viewerId: string): Promise<Post[]> {
  return prisma.post.findMany({
    where: visibleTo(viewerId),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 50,
  });
}

// null for "doesn't exist" AND "exists but you can't see it" — callers turn both into the same 404.
export async function findVisiblePost(id: string, viewerId: string): Promise<Post | null> {
  if (!isUuid(id)) return null; // Postgres would reject a malformed uuid with a 500
  return prisma.post.findFirst({ where: { id, ...visibleTo(viewerId) } });
}

export async function getVisiblePost(id: string, viewerId: string): Promise<Post> {
  const post = await findVisiblePost(id, viewerId);
  if (!post) throw new AppError(404, "Post not found.");
  return post;
}

export function createPost(data: CreatePostData): Promise<Post> {
  return prisma.post.create({ data });
}

export function updatePost(post: Post, { body, visibility }: UpdatePostData): Promise<Post> {
  return prisma.post.update({
    where: { id: post.id },
    data: {
      body,
      visibility,
      // "Edited" means the text changed. Changing who can see it isn't an edit to the content.
      ...(body !== undefined && body !== post.body && { editedAt: new Date() }),
    },
  });
}

// Soft delete: the row (and its reactions/comments) stays for moderation and reports, but
// visibleTo() filters it out everywhere. Laravel: SoftDeletes.
export async function deletePost(post: Post): Promise<void> {
  await prisma.post.update({ where: { id: post.id }, data: { deletedAt: new Date() } });
}

// 404 if the viewer can't see it; 403 only when they CAN see it but it isn't theirs.
export async function getOwnedPost(id: string, userId: string): Promise<Post> {
  const post = await getVisiblePost(id, userId);
  if (post.authorId !== userId) throw new AppError(403, "You can only modify your own posts.");
  return post;
}
