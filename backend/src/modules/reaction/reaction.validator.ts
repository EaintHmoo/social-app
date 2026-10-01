import { z } from "zod";
import { REACTION_TYPES } from "./reaction.types.js";

const reactionType = z.enum(REACTION_TYPES, {
  error: `Reaction must be one of: ${REACTION_TYPES.join(", ")}.`,
});

export const reactSchema = z.object({
  type: reactionType,
});

export const listReactionsQuerySchema = z.object({
  type: reactionType.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});