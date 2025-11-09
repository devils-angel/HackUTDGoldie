import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const AWS_REGION =
  process.env.AWS_REGION ||
  process.env.AWS_S3_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "us-east-1";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || "";
const AWS_S3_PREFIX = (process.env.AWS_S3_PREFIX || "")
  .replace(/^\/+/, "")
  .replace(/\/+$/, "");
const AWS_S3_SSE = process.env.AWS_S3_SSE || null;

let s3Client = null;
if (AWS_S3_BUCKET) {
  s3Client = new S3Client({
    region: AWS_REGION
  });
}

const prefixWithTrailingSlash = AWS_S3_PREFIX ? `${AWS_S3_PREFIX}/` : "";
console.log(AWS_S3_BUCKET);
export const isS3Configured = () => Boolean(s3Client && AWS_S3_BUCKET);
export const getS3BucketInfo = () => ({
  bucket: AWS_S3_BUCKET,
  region: AWS_REGION,
  prefix: AWS_S3_PREFIX
});

const buildKey = (applicationId, originalName) => {
  const safeOriginal =
    originalName?.replace(/[^a-zA-Z0-9.\-_]/g, "_") || "document.bin";
  const safeApplicationId = applicationId
    ? applicationId.replace(/[^a-zA-Z0-9\-_]/g, "_")
    : "unassigned";
  return `${prefixWithTrailingSlash}${safeApplicationId}/${Date.now()}-${crypto.randomUUID()}-${safeOriginal}`;
};

export const uploadIdentityDocument = async ({
  buffer,
  mimetype,
  originalname,
  applicationId
}) => {
  if (!isS3Configured()) {
    throw new Error("S3 bucket is not configured");
  }

  const key = buildKey(applicationId, originalname);
  const command = new PutObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    Metadata: applicationId ? { applicationId } : undefined,
    ...(AWS_S3_SSE ? { ServerSideEncryption: AWS_S3_SSE } : {})
  });

  await s3Client.send(command);

  const url = `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
  return { key, url };
};
