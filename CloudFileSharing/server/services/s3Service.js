const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, S3_BUCKET } = require('../config/aws');

/**
 * Upload a file buffer to S3
 */
const uploadToS3 = async ({ buffer, key, mimetype, metadata = {} }) => {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
    Metadata: metadata,
    ServerSideEncryption: 'AES256',
  });

  await s3Client.send(command);

  const url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return { url, key };
};

/**
 * Generate a pre-signed download URL (expires in 1 hour by default)
 */
const getSignedDownloadUrl = async (key, expiresIn = 3600, originalName = null) => {
  const params = {
    Bucket: S3_BUCKET,
    Key: key,
  };
  if (originalName) {
    const safeName = encodeURIComponent(originalName).replace(/['()]/g, escape);
    params.ResponseContentDisposition = `attachment; filename="${originalName.replace(/"/g, '\\"')}"; filename*=UTF-8''${safeName}`;
  }
  const command = new GetObjectCommand(params);
  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Delete a file from S3
 */
const deleteFromS3 = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  await s3Client.send(command);
};

/**
 * Copy a file within S3
 */
const copyInS3 = async (sourceKey, destinationKey) => {
  const command = new CopyObjectCommand({
    Bucket: S3_BUCKET,
    CopySource: `${S3_BUCKET}/${sourceKey}`,
    Key: destinationKey,
    ServerSideEncryption: 'AES256',
  });
  await s3Client.send(command);
  const url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${destinationKey}`;
  return { url, key: destinationKey };
};

/**
 * Check if a file exists in S3
 */
const existsInS3 = async (key) => {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
};

module.exports = { uploadToS3, getSignedDownloadUrl, deleteFromS3, copyInS3, existsInS3 };
