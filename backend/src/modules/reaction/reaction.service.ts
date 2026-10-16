import { prisma } from "../../shared/config/prisma.js";
import {
  REACTION_TYPES,
  type ListReactionsQuery,
  type ReactionSummary,
  type ReactionType,
  type ReactionWithUser,
} from "./reaction.types.js";

// Visibility is checked by the controller (postService.getVisiblePost) before any of these run,
// so reacting to — or listing reactions on — a post you can't see is a 404.
//
// posts.like_count counts reactions of every type. It's changed in the SAME transaction as the
// reaction row, so the two can't disagree (CLAUDE.md: counters are updated with the write).

// Create or change the user's reaction. Returns nothing; the controller re-reads the summary.
export async function react(postId: string, userId: string, type: ReactionType): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // INSERT ... ON CONFLICT DO NOTHING. count tells us whether this was a NEW reaction, which is
    // the only case that changes like_count. If two requests race, the second waits on the first's
    // row lock, then hits the conflict and gets count 0 — so the counter is bumped exactly once.
    const { count } = await tx.reaction.createMany({
      data: [{ postId, userId, type }],
      skipDuplicates: true,
    });

    if (count === 1) {
      await tx.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
    } else {
      // Already reacted: just switch the type (love -> laugh). The count doesn't change.
      await tx.reaction.update({ where: { postId_userId: { postId, userId } }, data: { type } });
    }
  });
}

export async function removeReaction(postId: string, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // deleteMany (not delete) so removing a reaction that doesn't exist is a no-op, not an error —
    // and its count tells us whether there was anything to un-count.
    const { count } = await tx.reaction.deleteMany({ where: { postId, userId } });
    if (count === 1) {
      await tx.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
    }
  });
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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, username: true, displayName: true } } }, // explicit fields: never leak email etc.
    }),
    prisma.reaction.count({ where }),
  ]);

  return { items, total };
}
