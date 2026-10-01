import type { PostDocument, PostResource } from "./post.types.js";
import { getFileUrl } from "../../shared/services/s3.service.js";


export function postResource(post: PostDocument): PostResource {
  return {
    _id: post._id,
    description: post.description,
    image: getFileUrl(post.imageKey),
    seenBy: post.seenBy,
    commentBy: post.commentBy,
    user: post.user,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}