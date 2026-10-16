import type { Post, PostResource } from "./post.types.js";
import { getFileUrl } from "../../shared/services/s3.service.js";


export function postResource(post: Post): PostResource {
  return {
    id: post.id,
    description: post.description,
    image: getFileUrl(post.imageKey),
    seenBy: post.seenBy,
    commentBy: post.commentBy,
    userId: post.userId,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}
