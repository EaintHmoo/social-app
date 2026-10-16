import type { Prisma } from "../../generated/prisma/client.js";

// Laravel: PostPolicy@view, but as a WHERE clause instead of a per-row check, so a list query and
// a single-post lookup apply the exact same rule — and a post the viewer can't see is simply not
// found (404), never "forbidden" (403), which would confirm it exists.
//
// A viewer can see a post when it isn't deleted, neither side has blocked the other, and either:
//   - they wrote it, or
//   - it's PUBLIC, or
//   - it's FOLLOWERS and they have an ACTIVE (not pending) follow on the author.
// PRIVATE posts therefore match only the first rule.
export function visibleTo(viewerId: string): Prisma.PostWhereInput {
  return {
    deletedAt: null,
    author: {
      deletedAt: null,
      // Blocks hide content in both directions.
      blocking: { none: { blockedId: viewerId } },
      blockedBy: { none: { blockerId: viewerId } },
    },
    OR: [
      { authorId: viewerId },
      { visibility: "PUBLIC" },
      {
        visibility: "FOLLOWERS",
        author: { followers: { some: { followerId: viewerId, status: "ACTIVE" } } },
      },
    ],
  };
}
