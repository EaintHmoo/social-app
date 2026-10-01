import { S3Client } from '@aws-sdk/client-s3';

export const s3Config = {
  region: process.env.AWS_REGION!,
  bucket: process.env.S3_BUCKET!,
};

export const s3Client = new S3Client({
  region: s3Config.region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});