import type { RequestHandler } from "express";
import { z } from "zod";

export default function validate(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body ?? {});
    next();
  };
}