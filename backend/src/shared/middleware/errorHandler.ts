import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { z } from "zod";
import { AppError, type FieldErrors } from "../errors/AppError.js";
import type { ErrorBody, ExposableHttpError } from "../types/errors.js";

function isExposableHttpError(err: unknown): err is ExposableHttpError {
  return (
    err instanceof Error &&
    (err as Partial<ExposableHttpError>).expose === true &&
    typeof (err as Partial<ExposableHttpError>).status === "number"
  );
}


function send(res: Response, status: number, message: string, errors?: FieldErrors) {
  const body: ErrorBody = errors ? { message, errors } : { message };
  return res.status(status).json(body);
}

export default function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) return send(res, err.status, err.message, err.errors);

  if (err instanceof z.ZodError) {
    const errors = z.flattenError(err).fieldErrors as FieldErrors;
    return send(res, 422, err.issues[0]?.message ?? "Invalid data.", errors);
  }

  if (err instanceof multer.MulterError) {
    return err.code === "LIMIT_FILE_SIZE"
      ? send(res, 413, "Image must be 10 MB or smaller.")
      : send(res, 400, err.message);
  }

  // Unique index hit (e.g. duplicate email) → 409 instead of 500
  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? "field";
    return send(res, 409, `That ${field} is already taken.`, { [field]: [`That ${field} is already taken.`] });
  }

  // Mongoose schema rules (your post pre("validate") hook) → same 422 shape as zod
  if (err instanceof mongoose.Error.ValidationError) {
    const errors: FieldErrors = {};
    for (const [field, e] of Object.entries(err.errors)) errors[field] = [e.message];
    return send(res, 422, Object.values(errors)[0]?.[0] ?? "Invalid data.", errors);
  }

  if (err instanceof mongoose.Error.CastError) return send(res, 400, `Invalid ${err.path}.`);

  if (isExposableHttpError(err)) return send(res, err.status, err.message); // malformed JSON etc.

  console.error(err);
  return send(res, 500, "Server error.");
}

// Unknown URL → same JSON shape instead of Express's HTML 404 page
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.method} ${req.path}`));
}

function isDuplicateKeyError(err: unknown): err is { code: 11000; keyValue?: Record<string, unknown> } {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === 11000;
}