import sharp from "sharp";

export class InvalidImageError extends Error {
  readonly status = 422;
  constructor(message = "The uploaded file is not a valid image.") {
    super(message);
    this.name = "InvalidImageError";
  }
}

export interface ImagePreset {
  width: number;
  height: number;
  fit: "inside" | "cover";
  quality: number;
}

export const IMAGE_PRESETS = {
  post: { width: 1600, height: 1600, fit: "inside", quality: 80 },
  avatar: { width: 256, height: 256, fit: "cover", quality: 80 },
} as const satisfies Record<string, ImagePreset>;

export type ImagePresetName = keyof typeof IMAGE_PRESETS;

export interface ProcessedImage {
  buffer: Buffer;
  contentType: string;
  ext: string;
  width: number;
  height: number;
  size: number;
}

export async function processImage(input: Buffer, presetName: ImagePresetName): Promise<ProcessedImage> {
  const preset = IMAGE_PRESETS[presetName];

  try {
    const { data, info } = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({
        width: preset.width,
        height: preset.height,
        fit: preset.fit,
        withoutEnlargement: true,
      })
      .webp({ quality: preset.quality })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      contentType: "image/webp",
      ext: "webp",
      width: info.width,
      height: info.height,
      size: info.size,
    };
  } catch {
    // Corrupt file, not really an image, or over the pixel limit
    throw new InvalidImageError();
  }
}