import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { s3Client, s3Config } from "../config/s3.js";

export interface UploadBody {
  buffer: Buffer;
  contentType: string;
  ext: string;
}

export async function uploadFile(body: UploadBody, folder = "uploads"): Promise<string> {
  const key = `${folder}/${crypto.randomUUID()}.${body.ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: body.buffer,
      ContentType: body.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return key;
}

export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: s3Config.bucket, Key: key }));
}

// Best effort: used for cleanup, so one failure shouldn't stop the others
export async function deleteFiles(keys: string[]): Promise<void> {
  await Promise.allSettled(keys.map((key) => deleteFile(key)));
}

export function getFileUrl(key?: string | null): string | undefined {
  if (!key) return undefined;
  return `${process.env.ASSET_BASE_URL}/${key}`;
}