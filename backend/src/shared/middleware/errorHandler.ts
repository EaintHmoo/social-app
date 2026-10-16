import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { AppError, type FieldErrors } from "../errors/AppError.js";
import type { ErrorBody, ExposableHttpError } from "../types/errors.js";
import { isUniqueViolation } from "../errors/prisma.js";

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

  // Unique constraint hit that a service didn't handle itself → 409 instead of 500.
  // The DB error's details (table, constraint names) are deliberately not sent to the client.
  if (isUniqueViolation(err)) return send(res, 409, "That value is already taken.");

  if (isExposableHttpError(err)) return send(res, err.status, err.message); // malformed JSON etc.

  console.error(err);
  return send(res, 500, "Server error.");
}

// Unknown URL → same JSON shape instead of Express's HTML 404 page
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(404, `Route not found: ${req.method} ${req.path}`));
}
