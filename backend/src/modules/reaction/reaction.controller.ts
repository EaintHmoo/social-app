import type { Request, Response } from "express";
import * as reactionService from "./reaction.service.js";
import { reactionResource } from "./reaction.resource.js";
import { listReactionsQuerySchema } from "./reaction.validator.js";
import type { ReactInput } from "./reaction.types.js";
import { authUser } from "../auth/auth.request.js";
import { getVisiblePost } from "../post/post.service.js";

type PostParams = { postId: string };

// Every handler starts with getVisiblePost(): a post the user can't see (private, followers-only,
// blocked, deleted) is a 404 here too — otherwise reacting would reveal that it exists.

// GET /posts/:postId/reactions?type=LOVE&page=1&limit=20
export async function index(req: Request<PostParams>, res: Response) {
  const parsed = listReactionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(422).json({
      message: "Invalid query.",
      errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
    return;
  }
  const post = await getVisiblePost(req.params.postId, authUser(req).id);
  const query = parsed.data;

  const [summary, { items, total }] = await Promise.all([
    reactionService.getSummary(post.id),
    reactionService.listReactions(post.id, query),
  ]);

  res.json({
    summary,
    data: items.map(reactionResource),
    meta: { page: query.page, limit: query.limit, total },
  });
}

// PUT /posts/:postId/reactions   { "type": "LOVE" }
export async function react(req: Request<PostParams, unknown, ReactInput>, res: Response) {
  const userId = authUser(req).id;
  const post = await getVisiblePost(req.params.postId, userId);

  await reactionService.react(post.id, userId, req.body.type);

  res.json({
    my_reaction: req.body.type,
    summary: await reactionService.getSummary(post.id),
  });
}

// DELETE /posts/:postId/reactions
export async function remove(req: Request<PostParams>, res: Response) {
  const userId = authUser(req).id;
  const post = await getVisiblePost(req.params.postId, userId);

  await reactionService.removeReaction(post.id, userId);

  res.json({
    my_reaction: null,
    summary: await reactionService.getSummary(post.id),
  });
}
