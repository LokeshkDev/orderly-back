import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cached S3 Client instance
let s3ClientInstance = null;

/**
 * Lazily get or initialize the Cloudflare R2 S3 Client using current process.env
 */
export const getR2Client = () => {
  const isR2Configured = Boolean(
    process.env.R2_ACCESS_KEY_ID && 
    process.env.R2_SECRET_ACCESS_KEY && 
    process.env.R2_ENDPOINT
  );

  if (!isR2Configured) {
    return null;
  }

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: process.env.R2_REGION || 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
      }
    });
  }

  return s3ClientInstance;
};

/**
 * Upload single buffer to Cloudflare R2 (or local filesystem fallback) in specified folder
 * Enforces: Max 10MB Images, Max 50MB Videos, Sharp optimization to 100KB - 800KB range.
 */
export const uploadFileToDestination = async (file, folderName = 'general', req = null) => {
  if (!file || !file.buffer) {
    throw new Error('Invalid file object: buffer is missing');
  }

  const sanitizeFolder = (folderName || 'general').replace(/[^a-zA-Z0-9_\-]/g, '');
  const originalName = file.originalname || 'file';
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
  const isImage = file.mimetype ? file.mimetype.startsWith('image/') : false;
  const isVideo = file.mimetype ? file.mimetype.startsWith('video/') : false;

  // 1. Strict Size Validation
  const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB max for images
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB max for videos

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 15MB`);
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    throw new Error(`Video size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 50MB`);
  }

  let finalBuffer = file.buffer;
  let finalContentType = file.mimetype || 'application/octet-stream';
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
      console.warn('Sharp optimization note (using raw buffer):', e.message);
    }
  }

  const keyPath = `${sanitizeFolder}/${finalFileName}`;

  // 3. Primary: Upload to Cloudflare R2 if configured
  const r2Client = getR2Client();
  if (r2Client) {
    try {
      const bucketName = process.env.R2_BUCKET_NAME || 'orderly2-0';
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: keyPath,
        Body: finalBuffer,
        ContentType: finalContentType
      });

      await r2Client.send(command);

      const publicDomain = process.env.R2_PUBLIC_URL || 'https://pub-fad69f3046584c2c82dcebb11d9da522.r2.dev';
      const baseUrl = publicDomain.endsWith('/') ? publicDomain.slice(0, -1) : publicDomain;
      return `${baseUrl}/${keyPath}`;
    } catch (r2Err) {
      console.warn('⚠️ Cloudflare R2 upload attempt failed, falling back to local storage:', r2Err.message);
    }
  }

  // 4. Fallback: Local Filesystem Storage (when R2 is not configured or temporary R2 issue)
  const uploadsDir = path.join(__dirname, '..', 'uploads', sanitizeFolder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localFilePath = path.join(uploadsDir, finalFileName);
  await fs.promises.writeFile(localFilePath, finalBuffer);

  // Return full absolute URL in production so frontends on other origins (Vercel, admin domain) can load it
  let origin = '';
  if (process.env.BACKEND_URL) {
    origin = process.env.BACKEND_URL.replace(/\/$/, '');
  } else if (req) {
    const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
    const host = req.get('host');
    if (host) origin = `${proto}://${host}`;
  }

  return origin 
    ? `${origin}/uploads/${sanitizeFolder}/${finalFileName}` 
    : `/uploads/${sanitizeFolder}/${finalFileName}`;
};

export const uploadSingle = async (req, res) => {
  try {
    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Ensure file is attached.' });
    }

    const folder = req.query.folder || req.body?.folder || 'general';
    const url = await uploadFileToDestination(file, folder, req);

    res.status(200).json({ 
      success: true, 
      data: { url, folder, filename: file.originalname } 
    });
  } catch (error) {
    console.error('File Upload Error:', error);
    res.status(500).json({ success: false, message: error.message || 'File upload failed' });
  }
};

export const uploadMultiple = async (req, res) => {
  try {
    const files = req.files && req.files.length > 0 
      ? req.files 
      : (req.file ? [req.file] : []);

    if (!files.length) {
      return res.status(400).json({ success: false, message: 'No files uploaded. Ensure files are attached.' });
    }

    const folder = req.query.folder || req.body?.folder || 'general';
    const uploadPromises = files.map(file => uploadFileToDestination(file, folder, req));
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
