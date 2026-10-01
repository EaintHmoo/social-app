import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import type { ExposableHttpError } from "../types/errors.js";
import multer from "multer";
import { InvalidImageError } from "../services/image.service.js";



function isExposableHttpError(err: unknown): err is ExposableHttpError {
  return (
    err instanceof Error &&
    (err as Partial<ExposableHttpError>).expose === true &&
    typeof (err as Partial<ExposableHttpError>).status === "number"
  );
}


export default function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Errors Express's own middleware marks as safe to show, e.g. malformed JSON from express.json() → 400.
  if (isExposableHttpError(err)) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({
      message: err.code === "LIMIT_FILE_SIZE" ? "Image must be 10 MB or smaller." : err.message,
    });
  }

  if (err instanceof InvalidImageError) {
  return res.status(err.status).json({ message: err.message });
}

  // Anything else is a bug or an outage. Log the details, but don't send internals to the client.
  console.error(err);
  res.status(500).json({ error: "Server error." });
}
