import type { PopulatedReaction, ReactionResource, ReactionUser } from "./reaction.types.js";

export function reactionResource(
  reaction: PopulatedReaction & { user: ReactionUser }
): ReactionResource {
  return {
    user: { _id: reaction.user._id, name: reaction.user.name },
    type: reaction.type,
    reactedAt: reaction.updatedAt,
  };
}