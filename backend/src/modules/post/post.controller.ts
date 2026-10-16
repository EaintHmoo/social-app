import type { Request, Response } from "express";
import * as postService from "./post.service.js";
import { postResource } from "./post.resource.js";
import type { CreatePostInput, UpdatePostInput } from "./post.types.js";
import { authUser } from "../auth/auth.request.js";

type IdParams = { id: string };

// GET /posts
export async function index(req: Request, res: Response) {
  const posts = await postService.listPosts(authUser(req).id);
  res.json(posts.map(postResource));
}

// GET /posts/:id
export async function show(req: Request<IdParams>, res: Response) {
  const post = await postService.getVisiblePost(req.params.id, authUser(req).id);
  res.json(postResource(post));
}

// POST /posts
export async function store(req: Request<{}, unknown, CreatePostInput>, res: Response) {
  const post = await postService.createPost({ ...req.body, authorId: authUser(req).id });
  res.status(201).json(postResource(post));
}

// PATCH /posts/:id
export async function update(req: Request<IdParams, unknown, UpdatePostInput>, res: Response) {
  const post = await postService.getOwnedPost(req.params.id, authUser(req).id);
  const updated = await postService.updatePost(post, req.body);
  res.json(postResource(updated));
}

// DELETE /posts/:id — Laravel: destroy(); `delete` is a reserved word in JS
export async function destroy(req: Request<IdParams>, res: Response) {
  const post = await postService.getOwnedPost(req.params.id, authUser(req).id);
  await postService.deletePost(post);
  res.status(204).send();
}
