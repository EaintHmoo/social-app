import type { ReactionResource, ReactionWithUser } from "./reaction.types.js";

export function reactionResource(reaction: ReactionWithUser): ReactionResource {
  return {
    user: { id: reaction.user.id, name: reaction.user.name },
    type: reaction.type,
    reactedAt: reaction.updatedAt,
  };
}