import { InvalidImageError, processImage, type ImagePresetName, type ProcessedImage } from "./image.service.js";
import { deleteFiles, uploadFile } from "./s3.service.js";

export interface ImageUploadOptions {
  preset: ImagePresetName;
  folder: string;
}

export interface UploadedImage {
  key: string;
  width: number;
  height: number;
}

export async function uploadImages(
  files: Express.Multer.File[],
  { preset, folder }: ImageUploadOptions
): Promise<UploadedImage[]> {
  // 1. Process everything first: one bad file rejects the request before anything reaches S3.
  //    Sequential on purpose: keeps memory predictable with several large photos.
  const processed: ProcessedImage[] = [];
  for (const file of files) {
    try {
      processed.push(await processImage(file.buffer, preset));
    } catch (err) {
      if (err instanceof InvalidImageError) {
        throw new InvalidImageError(`"${file.originalname}" is not a valid image.`);
      }
      throw err;
    }
  }

  // 2. Upload in parallel. If any upload fails, remove the ones that succeeded.
  const results = await Promise.allSettled(processed.map((image) => uploadFile(image, folder)));
  const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");

  if (failed) {
    const uploadedKeys = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    await deleteFiles(uploadedKeys);
    throw failed.reason;
  }

  return results.map((r, i) => ({
    key: (r as PromiseFulfilledResult<string>).value,
    width: processed[i]!.width,
    height: processed[i]!.height,
  }));
}

export async function uploadImage(
  file: Express.Multer.File,
  options: ImageUploadOptions
): Promise<UploadedImage> {
  const [image] = await uploadImages([file], options);
  return image!;
}