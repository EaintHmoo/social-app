import type { Post, PostResource } from "./post.types.js";

export function postResource(post: Post): PostResource {
  return {
    id: post.id,
    author_id: post.authorId,
    body: post.body,
    visibility: post.visibility,
    like_count: post.likeCount,
    comment_count: post.commentCount,
    edited_at: post.editedAt,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  };
}
