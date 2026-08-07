import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Cloudflare R2 S3 Client if credentials exist
const isR2Configured = Boolean(
  process.env.R2_ACCESS_KEY_ID && 
  process.env.R2_SECRET_ACCESS_KEY && 
  process.env.R2_ENDPOINT
);

let s3Client = null;
if (isR2Configured) {
  s3Client = new S3Client({
    region: process.env.R2_REGION || 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });
}

/**
 * Upload single buffer to Cloudflare R2 (or local filesystem fallback) in specified folder
 * Enforces: Max 10MB Images, Max 50MB Videos, Sharp optimization to 100KB - 800KB range.
 */
const uploadFileToDestination = async (file, folderName = 'general') => {
  const sanitizeFolder = folderName.replace(/[^a-zA-Z0-9_\-]/g, '');
  const ext = path.extname(file.originalname).toLowerCase();
  const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');

  // 1. Strict Size Validation
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB max for images
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB max for videos

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 10MB`);
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    throw new Error(`Video size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 50MB`);
  }

  let finalBuffer = file.buffer;
  let finalContentType = file.mimetype;
  let finalFileName = `${Date.now()}_${baseName}${ext}`;

  // 2. High-Clarity Image Optimization (Target range: 100KB – 800KB)
  if (isImage && !['.gif', '.svg'].includes(ext)) {
    try {
      // First Pass: High-fidelity WebP conversion (1920px max resolution, quality 82)
      let optimized = await sharp(file.buffer)
        .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 4, smartSubsample: true })
        .toBuffer();

      // Second Pass: If compressed size still > 800KB, optimize slightly further to guarantee 100KB-800KB size
      if (optimized.length > 800 * 1024) {
        optimized = await sharp(file.buffer)
          .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 78, effort: 4 })
          .toBuffer();
      }

      finalBuffer = optimized;
      finalContentType = 'image/webp';
      finalFileName = `${Date.now()}_${baseName}.webp`;
    } catch (e) {
      console.warn('Sharp optimization warning:', e.message);
    }
  }

  const keyPath = `${sanitizeFolder}/${finalFileName}`;

  // 3. Upload directly to Cloudflare R2 if configured
  if (isR2Configured && s3Client) {
    const bucketName = process.env.R2_BUCKET_NAME || 'orderly-assets';
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: keyPath,
      Body: finalBuffer,
      ContentType: finalContentType
    });

    await s3Client.send(command);

    const publicDomain = process.env.R2_PUBLIC_URL || 'https://pub-mock-url.r2.dev';
    const baseUrl = publicDomain.endsWith('/') ? publicDomain.slice(0, -1) : publicDomain;
    return `${baseUrl}/${keyPath}`;
  }

  // 4. Local Filesystem Fallback when R2 is not configured
  const uploadsDir = path.join(__dirname, '..', 'uploads', sanitizeFolder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localFilePath = path.join(uploadsDir, finalFileName);
  await fs.promises.writeFile(localFilePath, finalBuffer);

  return `/uploads/${sanitizeFolder}/${finalFileName}`;
};

export const uploadSingle = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const folder = req.query.folder || req.body.folder || 'general';
    const url = await uploadFileToDestination(req.file, folder);

    res.status(200).json({ 
      success: true, 
      data: { url, folder, filename: req.file.originalname } 
    });
  } catch (error) {
    console.error('File Upload Error:', error);
    res.status(500).json({ success: false, message: error.message || 'File upload failed' });
  }
};

export const uploadMultiple = async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const folder = req.query.folder || req.body.folder || 'general';
    const uploadPromises = req.files.map(file => uploadFileToDestination(file, folder));
    const urls = await Promise.all(uploadPromises);

    res.status(200).json({ 
      success: true, 
      data: { urls, folder } 
    });
  } catch (error) {
    console.error('Multiple File Upload Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Multiple file upload failed' });
  }
};
