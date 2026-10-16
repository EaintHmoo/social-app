import mongoose from "mongoose";
import { COMMENT_BY, SEEN_BY, type CommentBy, type IPost, type PostModel, type SeenBy } from "./post.types.js";
import { REACTION_TYPES } from "../reaction/reaction.types.js";

const reactionCountsSchema = new mongoose.Schema(
  Object.fromEntries(REACTION_TYPES.map((type) => [type, { type: Number, default: 0 }])),
  { _id: false }
);

const postSchema = new mongoose.Schema<IPost, PostModel>(
  {
    description: { type: String, trim: true },
    imageKey: { type: String },
    seenBy:    { type: String, enum: SEEN_BY,    required: true, default: "anyone" },
    commentBy: { type: String, enum: COMMENT_BY, required: true, default: "anyone" },
    reactionCounts: { type: reactionCountsSchema, default: () => ({}) },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

// Same rule enforced at the DB layer, in case something bypasses the validator
postSchema.pre("validate", function () {
  if (!this.description && !this.imageKey) {
    this.invalidate("description", "Either description or image is required.");
  }
});

export default mongoose.model<IPost, PostModel>("Post", postSchema);