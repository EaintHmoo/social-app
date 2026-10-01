import type { Request, Response } from "express";
import * as reactionService from "./reaction.service.js";
import { reactionResource } from "./reaction.resource.js";
import { listReactionsQuerySchema } from "./reaction.validator.js";
import type { PopulatedReaction, ReactInput, ReactionUser } from "./reaction.types.js";

type PostParams = { postId: string };

async function ensurePostExists(req: Request<PostParams>, res: Response): Promise<boolean> {
  if (await reactionService.postExists(req.params.postId)) return true;
  res.status(404).json({ message: "Post not found." });
  return false;
}

// GET /posts/:postId/reactions?type=love&page=1&limit=20
export async function index(req: Request<PostParams>, res: Response) {
  const parsed = listReactionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(422).json({
      message: "Invalid query.",
      errors: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
    return;
  }
  if (!(await ensurePostExists(req, res))) return;

  const { postId } = req.params;
  const query = parsed.data;

  const [summary, { items, total }] = await Promise.all([
    reactionService.getSummary(postId),
    reactionService.listReactions(postId, query),
  ]);

  res.json({
    summary,
    data: items
      .filter((r): r is PopulatedReaction & { user: ReactionUser } => r.user !== null)
      .map(reactionResource),
    meta: { page: query.page, limit: query.limit, total },
  });
}

// PUT /posts/:postId/reactions   { "type": "love" }
export async function react(req: Request<PostParams, unknown, ReactInput>, res: Response) {
  if (!(await ensurePostExists(req, res))) return;

  const { postId } = req.params;
  await reactionService.react(postId, req.user!._id, req.body.type);

  res.json({
    myReaction: req.body.type,
    summary: await reactionService.getSummary(postId),
  });
}

// DELETE /posts/:postId/reactions
export async function remove(req: Request<PostParams>, res: Response) {
  if (!(await ensurePostExists(req, res))) return;

  const { postId } = req.params;
  await reactionService.removeReaction(postId, req.user!._id);

  res.json({
    myReaction: null,
    summary: await reactionService.getSummary(postId),
  });
}