import type { Request, Response } from "express";
import * as postService from "./post.service.js";
import { postResource } from "./post.resource.js";
import type { CreatePostInput, PostDocument, UpdatePostInput } from "./post.types.js";
import { uploadImage, type ImageUploadOptions } from "../../shared/services/image-upload.service.js";
import { deleteFile } from "../../shared/services/s3.service.js";
import { authUser } from "../auth/auth.request.js";

type IdParams = { id: string };
const POST_IMAGE: ImageUploadOptions = { preset: "post", folder: "posts" };


export async function index(req: Request, res: Response) {
  const posts = await postService.listPosts();
  res.json(posts.map((post) => postResource(post)));
}


export async function store(req: Request<{}, unknown, CreatePostInput>, res: Response) {
  const { description, seenBy, commentBy } = req.body;
  const imageKey = req.file ? (await uploadImage(req.file, POST_IMAGE)).key : undefined;

  try {
    const post = await postService.createPost({
      description, seenBy, commentBy, imageKey, user: authUser(req)._id,
    });
    res.status(201).json(postResource(post));
  } catch (err) {
    if (imageKey) await deleteFile(imageKey).catch(() => {});
    throw err;
  }
}

export async function update(req: Request<IdParams, unknown, UpdatePostInput>, res: Response) {
  const post = await postService.getOwnedPost(req.params.id, authUser(req)._id);
  if (!post) return;

  const { description, seenBy, commentBy, removeImage } = req.body;

  // Check the rule against the post's final state before touching S3
  const willHaveDescription = description !== undefined ? !!description : !!post.description;
  const willHaveImage = req.file ? true : removeImage ? false : !!post.imageKey;
  if (!willHaveDescription && !willHaveImage) {
    res.status(422).json({ message: "A post needs a description or an image." });
    return;
  }

  const oldKey = post.imageKey;
  const newKey = req.file ? (await uploadImage(req.file, POST_IMAGE)).key : undefined;
  
  try {
    const updated = await postService.updatePost(post, {
      description: description === undefined ? undefined : description || null,
      seenBy,
      commentBy,
      imageKey: newKey ?? (removeImage ? null : undefined),
    });

    // Old file is only removed once the DB no longer points to it
    if (oldKey && (newKey || removeImage)) {
      await deleteFile(oldKey).catch((err) => console.error(`S3 delete failed: ${oldKey}`, err));
    }

    res.json(postResource(updated));
  } catch (err) {
    if (newKey) await deleteFile(newKey).catch(() => {});
    throw err;
  }
}

// Laravel: destroy() — `delete` is a reserved word in JS
export async function destroy(req: Request<IdParams>, res: Response) {
  const post = await postService.getOwnedPost(req.params.id, authUser(req)._id);
  if (!post) return;

  const { imageKey } = post;
  await postService.deletePost(post);

  if (imageKey) {
    await deleteFile(imageKey).catch((err) => console.error(`S3 delete failed: ${imageKey}`, err));
  }

  res.status(204).send();
}