import mongoose from "mongoose";
import { REACTION_TYPES, type IReaction, type ReactionModel } from "./reaction.types.js";

const reactionSchema = new mongoose.Schema<IReaction, ReactionModel>(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: [...REACTION_TYPES], required: true },
  },
  { timestamps: true }
);

// One reaction per user per post, enforced by MongoDB, which also makes the upsert safe
reactionSchema.index({ post: 1, user: 1 }, { unique: true });
// "Who reacted" listing, newest first
reactionSchema.index({ post: 1, updatedAt: -1 });

export default mongoose.model<IReaction, ReactionModel>("Reaction", reactionSchema);