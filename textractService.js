import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract";
import { getS3BucketInfo, isS3Configured } from "./storageService.js";

const { region: DEFAULT_REGION, bucket: DEFAULT_BUCKET } = getS3BucketInfo();

const TEXTRACT_REGION =
  process.env.AWS_TEXTRACT_REGION ||
  DEFAULT_REGION ||
  process.env.AWS_REGION ||
  "us-east-1";

let textractClient = null;
const isTextractEnabled =
  (process.env.ENABLE_TEXTRACT_OCR || "true").toLowerCase() === "true";

const ensureClient = () => {
  if (textractClient) return textractClient;
  textractClient = new TextractClient({ region: TEXTRACT_REGION });
  return textractClient;
};

const normalizeName = (value) =>
  (value || "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const pickLikelyName = (blocks = []) => {
  const lines = blocks
    .filter((block) => block.BlockType === "LINE" && block.Text)
    .map((block) => ({
      text: block.Text,
      confidence: block.Confidence || 0
    }));

  if (!lines.length) return null;
  const sorted = lines
    .filter((line) => line.text.trim().split(/\s+/).length >= 2)
    .sort((a, b) => Number(b.confidence) - Number(a.confidence));

  return sorted[0] || lines[0];
};

export const runNameOcr = async ({ key, bucket = DEFAULT_BUCKET, applicantName }) => {
  if (!isTextractEnabled || !isS3Configured()) return null;
  if (!bucket || !key) return null;

  const client = ensureClient();
  const command = new DetectDocumentTextCommand({
    Document: {
      S3Object: {
        Bucket: bucket,
        Name: key
      }
    }
  });

  const response = await client.send(command);
  const blocks = response.Blocks || [];
  const detectedLines = blocks
    .filter((block) => block.BlockType === "LINE" && block.Text)
    .map((block) => ({
      text: block.Text,
      confidence: block.Confidence || 0
    }));

  if (detectedLines.length) {
    console.log(
      `[OCR] Textract lines for ${key}:`,
      detectedLines.map(
        (line) => `${line.text} (confidence ${line.confidence?.toFixed(2) ?? "0"})`
      )
    );
  } else {
    console.log(`[OCR] Textract found no lines for ${key}`);
  }

  const bestLine = pickLikelyName(blocks);

  const extractedName = bestLine?.text || "";
  const applicantNormalized = normalizeName(applicantName);
  const bestLineNormalized = normalizeName(extractedName);

  const matchingLine = detectedLines.find((line) => {
    const normalized = normalizeName(line.text);
    return normalized && normalized === applicantNormalized;
  });

  const matchedName = matchingLine?.text || extractedName;
  const matchedNormalized = matchingLine
    ? normalizeName(matchingLine.text)
    : bestLineNormalized;

  let status = "PENDING";
  if (matchedNormalized) {
    status =
      applicantNormalized && matchedNormalized === applicantNormalized
        ? "MATCH"
        : "MISMATCH";
  } else {
    status = "ERROR";
  }

  return {
    status,
    extractedName: matchedName || null,
    confidence: matchingLine?.confidence || bestLine?.confidence || null
  };
};
