import mongoose, { Types } from "mongoose";
import Post from "../post/post.model.js";
import Reaction from "./reaction.model.js";
import {
  REACTION_TYPES,
  type ListReactionsQuery,
  type PopulatedReaction,
  type ReactionSummary,
  type ReactionType,
} from "./reaction.types.js";

type Id = Types.ObjectId | string;

export async function postExists(postId: string): Promise<boolean> {
  if (!mongoose.isObjectIdOrHexString(postId)) return false;
  return (await Post.exists({ _id: postId })) !== null;
}

// Create or change the user's reaction in one atomic operation
export function react(postId: Id, userId: Id, type: ReactionType) {
  return Reaction.findOneAndUpdate(
    { post: postId, user: userId },
    { $set: { type } },
    { upsert: true, returnDocument: "after", runValidators: true }
  ).exec();
}

export async function removeReaction(postId: Id, userId: Id): Promise<void> {
  await Reaction.deleteOne({ post: postId, user: userId });
}

export async function getSummary(postId: string): Promise<ReactionSummary> {
  // aggregate() doesn't cast strings, so the ObjectId must be explicit
  const rows = await Reaction.aggregate<{ _id: ReactionType; count: number }>([
    { $match: { post: new Types.ObjectId(postId) } },
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);

  const summary = { total: 0 } as ReactionSummary;
  for (const type of REACTION_TYPES) summary[type] = 0;
  for (const { _id, count } of rows) {
    summary[_id] = count;
    summary.total += count;
  }
  return summary;
}

export async function listReactions(postId: string, { type, page, limit }: ListReactionsQuery) {
  const filter = { post: postId, ...(type && { type }) };

  const [items, total] = await Promise.all([
    Reaction.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name") // explicit fields: never leak password etc.
      .lean<PopulatedReaction[]>()
      .exec(),
    Reaction.countDocuments(filter),
  ]);

  return { items, total };
}

export async function deleteReactionsForPost(postId: Id): Promise<void> {
  await Reaction.deleteMany({ post: postId });
}