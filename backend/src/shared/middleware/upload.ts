import multer from "multer";
import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export function imageParser(maxFiles = 1) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // per file
      files: maxFiles,
      fields: 10,
    },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED.includes(file.mimetype)) cb(null, true);
      else cb(new AppError(415, "Only JPEG, PNG, WebP, AVIF or GIF images are allowed."));
    },
  });
}

export const fileToBody =
  (field: string): RequestHandler =>
  (req, _res, next) => {
    if (req.file) req.body = { ...req.body, [field]: req.file };
    next();
  };