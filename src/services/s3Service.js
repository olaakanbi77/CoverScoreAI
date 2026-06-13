const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');

// Configure S3 Client
const s3Config = {
  region: process.env.S3_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  }
};

// Only add endpoint if provided (for Cloudflare R2, MinIO, DigitalOcean, etc.)
if (process.env.S3_ENDPOINT) {
  s3Config.endpoint = process.env.S3_ENDPOINT;
  // For R2 or Minio, force path style can sometimes be needed, but usually auto works.
}

const s3Client = new S3Client(s3Config);
const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

const isConfigured = () => {
  return BUCKET_NAME && s3Config.credentials.accessKeyId && s3Config.credentials.secretAccessKey;
};

/**
 * Uploads a file buffer to S3
 * @param {Buffer} buffer - The file buffer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File mime type
 * @param {string} folder - Optional folder prefix (e.g., 'leads/123')
 * @returns {Promise<{key: string, url: string}>}
 */
const uploadFile = async (buffer, originalName, mimeType, folder = 'documents') => {
  if (!isConfigured()) {
    throw new Error('S3 Storage is not configured.');
  }

  // Generate unique filename to prevent overwrites
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const key = `${folder}/${hash}${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await s3Client.send(command);

  return { key, fileName: originalName };
};

/**
 * Generates a presigned URL for downloading a file
 * @param {string} key - The S3 object key
 * @param {number} expiresIn - Expiration time in seconds (default 1 hour)
 * @returns {Promise<string>}
 */
const getDownloadUrl = async (key, expiresIn = 3600) => {
  if (!isConfigured()) return null;

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Deletes a file from S3
 * @param {string} key - The S3 object key
 */
const deleteFile = async (key) => {
  if (!isConfigured()) return;

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
};

module.exports = {
  uploadFile,
  getDownloadUrl,
  deleteFile,
  isConfigured
};
