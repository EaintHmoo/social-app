import { prisma } from "../../shared/config/prisma.js";
import {
  REACTION_TYPES,
  type ListReactionsQuery,
  type ReactionSummary,
  type ReactionType,
  type ReactionWithUser,
} from "./reaction.types.js";
import { AppError } from "../../shared/errors/AppError.js";
import { isUuid } from "../../shared/errors/prisma.js";

export async function postExists(postId: string): Promise<boolean> {
  if (!isUuid(postId)) return false;
  return (await prisma.post.count({ where: { id: postId } })) > 0;
}

export async function assertPostExists(postId: string): Promise<boolean> {
  if (await postExists(postId)) return true;
  throw new AppError(404, "Post not found.");
}

// Create or change the user's reaction in one atomic operation. With a unique `where` like this,
// Prisma runs a native INSERT ... ON CONFLICT DO UPDATE, so two concurrent clicks can't collide.
export function react(postId: string, userId: string, type: ReactionType) {
  return prisma.reaction.upsert({
    where: { postId_userId: { postId, userId } },
    create: { postId, userId, type },
    update: { type },
  });
}

export async function removeReaction(postId: string, userId: string): Promise<void> {
  // deleteMany (not delete) so removing a reaction that doesn't exist is a no-op, not an error
  await prisma.reaction.deleteMany({ where: { postId, userId } });
}

export async function getSummary(postId: string): Promise<ReactionSummary> {
  // Laravel: ->groupBy('type')->selectRaw('type, count(*)')
  const rows = await prisma.reaction.groupBy({
    by: ["type"],
    where: { postId },
    _count: { _all: true },
  });

  const summary = { total: 0 } as ReactionSummary;
  for (const type of REACTION_TYPES) summary[type] = 0;
  for (const { type, _count } of rows) {
    summary[type] = _count._all;
    summary.total += _count._all;
  }
  return summary;
}

export async function listReactions(
  postId: string,
  { type, page, limit }: ListReactionsQuery
): Promise<{ items: ReactionWithUser[]; total: number }> {
  const where = { postId, ...(type && { type }) };

  const [items, total] = await prisma.$transaction([
    prisma.reaction.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, name: true } } }, // explicit fields: never leak email etc.
    }),
    prisma.reaction.count({ where }),
  ]);

  return { items, total };
}
