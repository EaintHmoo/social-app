import type { ReactionResource, ReactionWithUser } from "./reaction.types.js";

export function reactionResource(reaction: ReactionWithUser): ReactionResource {
  return {
    user: { id: reaction.user.id, username: reaction.user.username, display_name: reaction.user.displayName },
    type: reaction.type,
    reacted_at: reaction.createdAt,
  };
}