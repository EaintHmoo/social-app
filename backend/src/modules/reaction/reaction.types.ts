import type { HydratedDocument, Model, Types } from "mongoose";
import type { z } from "zod";
import type { listReactionsQuerySchema, reactSchema } from "./reaction.validator.js";

export const REACTION_TYPES = ["like", "love", "funny", "insight", "unlike"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

// ─── Reaction model ──────────────────────────────────────────────────────────

export interface IReaction {
  post: Types.ObjectId;
  user: Types.ObjectId;
  type: ReactionType;
  createdAt: Date;
  updatedAt: Date;
}

export type ReactionModel = Model<IReaction>;
export type ReactionDocument = HydratedDocument<IReaction>;

// ─── "Who reacted" (user populated) ──────────────────────────────────────────

export interface ReactionUser {
  _id: Types.ObjectId;
  name: string;
}

export type PopulatedReaction = Omit<IReaction, "user"> & {
  _id: Types.ObjectId;
  user: ReactionUser | null; // null if the user was deleted
};

export interface ReactionResource {
  user: ReactionUser;
  type: ReactionType;
  reactedAt: Date;
}

export type ReactionSummary = Record<ReactionType, number> & { total: number };

// ─── Validated input ─────────────────────────────────────────────────────────

export type ReactInput = z.infer<typeof reactSchema>;
export type ListReactionsQuery = z.infer<typeof listReactionsQuerySchema>;