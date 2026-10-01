import mongoose from "mongoose";
import type { CommentBy, IPost, PostModel, SeenBy } from "./post.types.js";

const postSchema = new mongoose.Schema<IPost, PostModel>(
  {
    description: { type: String, trim: true },
    imageKey: { type: String },
    seenBy: {
      type: String,
      enum: ["anyone", "friend_only"] satisfies SeenBy[],
      default: null,
    },
    commentBy: {
      type: String,
      enum: ["anyone", "friend_only", "off"] satisfies CommentBy[],
      default: null,
    },
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